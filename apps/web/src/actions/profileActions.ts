'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@0unveiled/database'
import { getCurrentUser } from '@/data/user' // Corrected import path
import { eq, and, or } from "drizzle-orm"
import { showcasedItems, connectionRequests, connections, users } from "@0unveiled/database"
import { createNotification } from './notifications'; // Import the action

/**
 * Toggles the pinned status of a showcased item.
 * Only the owner of the profile can perform this action.
 * Revalidates the user's profile path after update.
 * @param itemId - The ID of the ShowcasedItem to update.
 * @param newPinState - The desired pinned state (true or false).
 * @param username - The username of the profile being viewed (needed for revalidation).
 * @returns Object indicating success or error.
 */
export const toggleShowcasedItemPin = async (
  itemId: string,
  newPinState: boolean,
  username: string
): Promise<{ success: boolean; error?: string }> => {
  if (!itemId || typeof newPinState !== 'boolean' || !username) {
    return { success: false, error: 'Invalid input provided.' }
  }

  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' }
  }

  try {
    // Fetch the item to verify ownership
    const itemToUpdate = await db
      .select({ userId: showcasedItems.userId })
      .from(showcasedItems)
      .where(eq(showcasedItems.id, itemId))
      .limit(1)

    if (!itemToUpdate.length) {
      return { success: false, error: 'Item not found.' }
    }

    // Verify ownership
    if (itemToUpdate[0].userId !== currentUser.id) {
      return { success: false, error: 'Not authorized to modify this item.' }
    }

    // Update the item's pinned status
    await db
      .update(showcasedItems)
      .set({ isPinned: newPinState })
      .where(eq(showcasedItems.id, itemId))

    // Revalidate the profile path to refresh data
    revalidatePath(`/${username}`) // Use the provided username for the dynamic path
    // Invalidate leaderboard caches for this user
    revalidateTag(`leaderboard:user:${currentUser.id}`)
    revalidateTag(`leaderboard:rank:${currentUser.id}:GENERAL::`)
    // Invalidate general leaderboard caches
    revalidateTag('leaderboard:type:GENERAL:::50')
    revalidateTag('leaderboard:type:GENERAL:::100')

    return { success: true }
  } catch (error) {
    console.error('Error toggling showcased item pin:', error)
    return { success: false, error: 'Failed to update pin status.' }
  }
}

/**
 * Sends a connection request from the current user to another user.
 * @param recipientId - The ID of the user to send the request to.
 * @param profileUsername - The username of the profile being viewed (for revalidation).
 * @returns Object indicating success or error, status, and optional requestId.
 */
export const sendConnectionRequest = async (
  recipientId: string,
  profileUsername: string
): Promise<{
  success: boolean;
  error?: string;
  status?: 'PENDING' | 'CONNECTED' | 'ALREADY_SENT' | 'ALREADY_RECEIVED';
  connectionRequestId?: string; // Add optional connectionRequestId
}> => {
  if (!recipientId || !profileUsername) {
    return { success: false, error: 'Invalid input provided.' };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' };
  }

  const requesterId = currentUser.id;

  if (requesterId === recipientId) {
    return { success: false, error: 'Cannot connect with yourself.' };
  }

  try {
    // Ensure IDs are ordered consistently for checking Connection table
    const [userOneId, userTwoId] = [requesterId, recipientId].sort();

    // Check if already connected
    const existingConnection = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.userOneId, userOneId),
          eq(connections.userTwoId, userTwoId)
        )
      )
      .limit(1)

    if (existingConnection.length > 0) {
      return { success: false, error: 'Already connected.', status: 'CONNECTED' };
    }

    // Check if a request already exists (either direction)
    const existingRequest = await db
      .select()
      .from(connectionRequests)
      .where(
        or(
          and(
            eq(connectionRequests.requesterId, requesterId),
            eq(connectionRequests.recipientId, recipientId)
          ),
          and(
            eq(connectionRequests.requesterId, recipientId),
            eq(connectionRequests.recipientId, requesterId)
          )
        )
      )
      .limit(1)

    if (existingRequest.length > 0) {
      const request = existingRequest[0]
      if (request.status === 'PENDING') {
          if (request.requesterId === requesterId) {
              return { success: false, error: 'Request already sent.', status: 'ALREADY_SENT' };
          } else {
              return { success: false, error: 'You have a pending request from this user.', status: 'ALREADY_RECEIVED' };
          }
      } else if (request.status === 'REJECTED') {
          await db
            .delete(connectionRequests)
            .where(eq(connectionRequests.id, request.id))
      }
    }

    // Create the new connection request
    const newRequest = await db
      .insert(connectionRequests)
      .values({
        requesterId: requesterId,
        recipientId: recipientId,
        status: 'PENDING',
      })
      .returning({ id: connectionRequests.id })

    // Create Notification for the recipient
    try {
        const senderName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'A user';
        const notificationContent = `${senderName} sent you a connection request.`;
        const notificationLink = '/connections?tab=requests';

        await createNotification(
            recipientId,
            'CONNECTION_REQUEST_RECEIVED' as any, // Use correct type
            notificationContent,
            notificationLink
        );
    } catch (notificationError) {
        console.error("Failed to create connection request notification:", notificationError);
    }

    // Revalidate the profile page to update the button state
    revalidatePath(`/${profileUsername}`);

    return { success: true, status: 'PENDING', connectionRequestId: newRequest[0].id }; // Return the ID

  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error: 'Failed to send connection request.' };
  }
};

// TODO: Add actions for accepting, rejecting, and withdrawing requests.
// TODO: Add action for removing connections.

/**
 * Accepts a connection request.
 * Requires the logged-in user to be the recipient of the request.
 * Creates a Connection record upon success.
 * @param requestId - The ID of the ConnectionRequest to accept.
 * @returns Object indicating success or error.
 */
export const acceptConnectionRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Not authenticated." };
  }

  if (!requestId) {
    return { success: false, error: "Request ID is required." };
  }

  try {
    // 1. Find the request and verify recipient and status
    const request = await db
      .select()
      .from(connectionRequests)
      .where(eq(connectionRequests.id, requestId))
      .limit(1)

    if (!request.length) {
      return { success: false, error: "Connection request not found." };
    }

    const connectionRequest = request[0]
    
    if (connectionRequest.recipientId !== currentUser.id) {
      return { success: false, error: "Not authorized to accept this request." };
    }
    if (connectionRequest.status !== 'PENDING') {
      return { success: false, error: `Request already ${connectionRequest.status.toLowerCase()}.` };
    }

    // 2. Update request status
    await db
      .update(connectionRequests)
      .set({ status: 'ACCEPTED' })
      .where(eq(connectionRequests.id, requestId))

    // 3. Create the connection
    const userOneId = connectionRequest.requesterId < connectionRequest.recipientId ? connectionRequest.requesterId : connectionRequest.recipientId;
    const userTwoId = connectionRequest.requesterId < connectionRequest.recipientId ? connectionRequest.recipientId : connectionRequest.requesterId;

    await db
      .insert(connections)
      .values({
        userOneId: userOneId,
        userTwoId: userTwoId,
      })
    
    // Send notification to requester
     try {
        const recipientName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'A user';
        const notificationContent = `${recipientName} accepted your connection request.`;
        const notificationLink = `/${currentUser.username}`; // Link to the acceptor's profile

        await createNotification(
            connectionRequest.requesterId, // Notify the original requester
            'CONNECTION_REQUEST_ACCEPTED' as any, // Use correct type
            notificationContent,
            notificationLink
        );
    } catch (notificationError) {
        console.error("Failed to create connection accepted notification:", notificationError);
    }

    // Revalidate relevant paths (e.g., dashboard, connections page)
    revalidatePath('');
    revalidatePath('/connections');
    // Potentially revalidate profiles of both users
    // revalidatePath(`/profile/${currentUser.username}`);
    // We need the requester's username for their profile path

    return { success: true };

  } catch (error: any) {
    console.error("Error accepting connection request:", error);
    return { success: false, error: error.message || "Failed to accept request." };
  }
};

/**
 * Rejects or withdraws a connection request.
 * Requires the logged-in user to be either the recipient (reject) or the requester (withdraw).
 * @param requestId - The ID of the ConnectionRequest to reject/withdraw.
 * @returns Object indicating success or error.
 */
export const rejectOrWithdrawConnectionRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Not authenticated." };
  }

  if (!requestId) {
    return { success: false, error: "Request ID is required." };
  }

  try {
    const request = await db
      .select()
      .from(connectionRequests)
      .where(eq(connectionRequests.id, requestId))
      .limit(1)

    if (!request.length) {
      return { success: false, error: "Connection request not found." };
    }

    const connectionRequest = request[0]

    // Authorize: User must be either requester or recipient
    if (connectionRequest.recipientId !== currentUser.id && connectionRequest.requesterId !== currentUser.id) {
      return { success: false, error: "Not authorized to modify this request." };
    }
    
    // Only act on PENDING requests
    if (connectionRequest.status !== 'PENDING') {
      return { success: false, error: `Request is already ${connectionRequest.status.toLowerCase()}.` };
    }

    // Determine action based on user role (recipient rejects, requester withdraws)
    const newStatus = connectionRequest.recipientId === currentUser.id 
                      ? 'REJECTED' 
                      : 'REJECTED'; // Treat withdrawal as rejection for simplicity now
                                                    // Or potentially delete the request if withdrawn?
                                                    // Let's update to REJECTED for now.

    await db
      .update(connectionRequests)
      .set({ status: newStatus })
      .where(eq(connectionRequests.id, requestId))
    
    // TODO: Consider sending a notification upon rejection/withdrawal?

    // Revalidate relevant paths
    revalidatePath('');
    revalidatePath('/connections');
    // Potentially revalidate profiles

    return { success: true };

  } catch (error: any) {
    console.error("Error rejecting/withdrawing connection request:", error);
    return { success: false, error: error.message || "Failed to update request." };
  }
};

/**
 * Removes an existing connection between the current user and another user.
 * @param connectedUserId - The ID of the user to disconnect from.
 * @param connectionsPath - The path to revalidate (e.g., '/connections').
 * @returns Object indicating success or error.
 */
export const removeConnection = async (
  connectedUserId: string,
  connectionsPath: string
): Promise<{ success: boolean; error?: string }> => {
   const currentUser = await getCurrentUser();
   if (!currentUser) {
     return { success: false, error: "Not authenticated." };
   }

   if (!connectedUserId) {
     return { success: false, error: "Connected user ID is required." };
   }

   const userOneId = currentUser.id < connectedUserId ? currentUser.id : connectedUserId;
   const userTwoId = currentUser.id < connectedUserId ? connectedUserId : currentUser.id;

   try {
     const deletedConnection = await db
       .delete(connections)
       .where(
         and(
           eq(connections.userOneId, userOneId),
           eq(connections.userTwoId, userTwoId)
         )
       )
       .returning()

     if (!deletedConnection.length) {
       // This case might not be reachable if the query throws on not found,
       // but handle defensively.
       return { success: false, error: "Connection not found." };
     }

     revalidatePath(connectionsPath);
     revalidatePath(''); // Revalidate dashboard metrics
     // Potentially revalidate profiles

     return { success: true }; 

   } catch (error: any) {
     console.error("Error removing connection:", error);
     return { success: false, error: error.message || "Failed to remove connection." };
   }
 }; 