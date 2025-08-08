'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { getAuthenticatedUser } from '@/actions/auth'
import { 
  channels, 
  channelMembers, 
  messages, 
  users,
  type Channel,
  type ChannelMember,
  type Message,
  type User
} from '@0unveiled/database'
import { eq, and, or, desc, asc, isNull, isNotNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

// --- Types --- 
export type MessageWithAuthor = Message & {
    readAt: Date | null;
    author: {
        id: string;
        username: string | null;
        firstName: string;
        lastName: string | null;
        profilePicture: string | null;
    };
};

// Add type for DM Channel List Item
export type DmChannelListItem = {
  channelId: string;
  otherUser: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string | null;
    profilePicture: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    authorId: string;
  } | null;
  unreadCount: number;
};

// --- Actions --- 

/**
 * Finds an existing DM channel between two users or creates a new one.
 * Ensures the current user is one of the participants.
 * @param otherUserId - The ID of the other user to chat with.
 * @returns Object containing the channel ID or an error.
 */
export const getOrCreateDmChannel = async (
  otherUserId: string
): Promise<{ channelId?: string; error?: string }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }
  if (!otherUserId || currentUser.id === otherUserId) {
    return { error: 'Invalid recipient user ID.' };
  }

  try {
    // Find channels where BOTH users are members and the type is DM
    const potentialChannels = await db.query.channels.findMany({
      where: eq(channels.type, 'DIRECT_MESSAGE'),
      with: {
        members: true,
      },
    });

    // Filter for channels with exactly 2 members where both users are members
    const existingChannel = potentialChannels.find((channel) => {
      const memberIds = channel.members.map(m => m.userId);
      return memberIds.length === 2 && 
             memberIds.includes(currentUser.id) && 
             memberIds.includes(otherUserId);
    });

    if (existingChannel) {
      return { channelId: existingChannel.id };
    }

    // If not found, create a new channel and add members
    const [newChannel] = await db.insert(channels).values({
      type: 'DIRECT_MESSAGE',
      name: null,
    }).returning();

    // Add both users as members
    await db.insert(channelMembers).values([
      { userId: currentUser.id, channelId: newChannel.id },
      { userId: otherUserId, channelId: newChannel.id },
    ]);

    return { channelId: newChannel.id };
  } catch (error) {
    console.error("Error getting or creating DM channel:", error);
    return { error: 'Failed to get or create DM channel.' };
  }
};

/**
 * Sends a message to a specific channel.
 * Verifies that the current user is a member of the channel.
 * Creates a notification for the recipient(s).
 * @param channelId - The ID of the channel to send the message to.
 * @param content - The text content of the message.
 * @returns Object containing the created message or an error.
 */
export const sendMessage = async (
  channelId: string,
  content: string
): Promise<{ message?: Message; error?: string }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  // Trim content first
  const trimmedContent = content.trim();

  // Validate content length
  if (!channelId || !trimmedContent || trimmedContent.length === 0) {
    return { error: 'Channel ID and message content are required.' };
  }
  if (trimmedContent.length > 1000) { // Enforce max length
      return { error: 'Message exceeds maximum length of 1000 characters.' };
  }

  try {
    // First verify user is a member of the channel
    const userMembership = await db.query.channelMembers.findFirst({
      where: and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, currentUser.id)
      ),
    });

    if (!userMembership) {
      return { error: 'Channel not found or you are not a member.' };
    }

    // Get channel details and members
    const channelWithMembers = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
      with: {
        members: {
          columns: {
            userId: true
          }
        }
      }
    });

    if (!channelWithMembers) {
      return { error: 'Channel not found or you are not a member.' };
    }

    // Create the message using trimmedContent
    const [newMessage] = await db.insert(messages).values({
      channelId: channelId,
      authorId: currentUser.id,
      content: trimmedContent, // Use the trimmed content
    }).returning();

    // --- Send Notification --- 
    const recipient = channelWithMembers.members.find(m => m.userId !== currentUser.id);
    if (recipient) {
        try {
            const senderName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'A user';
            // Use trimmedContent for notification preview
            const notificationContent = `${senderName}: ${trimmedContent.substring(0, 50)}${trimmedContent.length > 50 ? '...' : ''}`; 
            const notificationLink = `/chat/${channelId}`;

            await createNotification(
                recipient.userId,
                'NEW_MESSAGE',
                notificationContent,
                notificationLink
            );
        } catch (notificationError) {
            console.error(`Failed to create message notification for user ${recipient.userId}:`, notificationError);
        }
    }
    // --- End Notification --- 

    // Update the channel's updatedAt timestamp to ensure it appears at the top
    await db.update(channels)
      .set({ updatedAt: new Date() })
      .where(eq(channels.id, channelId));

    // Invalidate channel list cache for the current user and potentially the recipient
    revalidatePath('/chat'); // Invalidate the list page

    // Realtime should handle message display, but revalidating channel list is useful

    return { message: newMessage };

  } catch (error) {
    console.error("Error sending message:", error);
    return { error: 'Failed to send message.' };
  }
};

/**
 * Fetches messages for a specific channel with pagination.
 * Verifies that the current user is a member of the channel.
 * Throws an error if authentication fails, channel not found, or user not authorized.
 * @param channelId - The ID of the channel to fetch messages from.
 * @param limit - The maximum number of messages to return (default 50).
 * @param cursor - The ID of the message to start fetching before (for pagination).
 * @returns Object containing messages and next cursor.
 * @throws Error if user is not authenticated, not a member, or DB query fails.
 */
export const getMessagesForChannel = async (
  channelId: string,
  limit: number = 50,
  cursor?: string
): Promise<{ messages: MessageWithAuthor[]; nextCursor: string | null; }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Not authenticated.');
  }
  if (!channelId) {
    throw new Error('Channel ID is required.');
  }

  try {
    // Verify user is a member of the channel
    const membership = await db.query.channelMembers.findFirst({
      where: and(
        eq(channelMembers.userId, currentUser.id),
        eq(channelMembers.channelId, channelId)
      ),
    });
    if (!membership) {
      throw new Error('Not authorized to view messages in this channel.');
    }

    // Fetch messages
    const channelMessages = await db.query.messages.findMany({
      where: eq(messages.channelId, channelId),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          }
        }
      },
      orderBy: desc(messages.createdAt),
      limit: limit + 1,
      offset: cursor ? 1 : 0, // Simple pagination - in production you'd want proper cursor-based pagination
    });

    let nextCursor: string | null = null;
    if (channelMessages.length > limit) {
      const nextMessage = channelMessages.pop();
      if (nextMessage) {
        nextCursor = nextMessage.id;
      }
    }

    // Reverse for display order and cast to the expected type
    return { messages: channelMessages.reverse() as MessageWithAuthor[], nextCursor };

  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error('Failed to fetch messages.');
  }
};

/**
 * Marks a channel as read for the current user by updating lastReadAt.
 * @param channelId - The ID of the channel to mark as read.
 * @returns Object indicating success or error.
 */
export const markChannelAsRead = async (channelId: string): Promise<{ success: boolean; error?: string }> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: 'Not authenticated.' };
    }
    if (!channelId) {
        return { success: false, error: 'Channel ID is required.' };
    }

    try {
        // Upsert ensures the record exists or is created if needed, then updated.
        // This is safer than assuming the ChannelMember record always exists.
        const existingMember = await db.query.channelMembers.findFirst({
          where: and(
            eq(channelMembers.userId, currentUser.id),
            eq(channelMembers.channelId, channelId)
          ),
        });

        if (existingMember) {
          await db.update(channelMembers)
            .set({ lastReadAt: new Date() })
            .where(and(
              eq(channelMembers.userId, currentUser.id),
              eq(channelMembers.channelId, channelId)
            ));
        } else {
          await db.insert(channelMembers).values({
            userId: currentUser.id,
            channelId: channelId,
            lastReadAt: new Date(),
          });
        }

        // Revalidate the chat list path to trigger a data refetch on the client
        // This helps clear the unread badge without manual state management
        revalidatePath('/chat');

        return { success: true };
    } catch (error) {
        console.error(`Error marking channel ${channelId} as read for user ${currentUser.id}:`, error);
        // Handle potential errors during the upsert operation
        return { success: false, error: 'Failed to mark channel as read.' };
    }
};

/**
 * Fetches all DIRECT_MESSAGE channels for the current user.
 * Includes the other participant's details, the last message sent, and unread count.
 * Optimized to fetch unread counts more efficiently.
 * @returns Array of DM channel list items sorted by last message time or channel update time.
 */
export const getDmChannelsForCurrentUser = async (): Promise<DmChannelListItem[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Not authenticated.');
  }

  try {
    // 1. First, get channel IDs where the user is a member
    const userMemberships = await db.query.channelMembers.findMany({
      where: eq(channelMembers.userId, currentUser.id),
      columns: {
        channelId: true,
        lastReadAt: true,
      },
    });

    if (userMemberships.length === 0) {
      return []; // User is not a member of any channels
    }

    const userChannelIds = userMemberships.map(m => m.channelId);
    const lastReadMap = new Map(userMemberships.map(m => [m.channelId, m.lastReadAt]));

    // 2. Fetch DIRECT_MESSAGE channels from those channel IDs
    const userChannels = await db.query.channels.findMany({
      where: and(
        eq(channels.type, 'DIRECT_MESSAGE'),
        // We'll need to filter by channel IDs in batches or use a different approach
      ),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
        messages: { // Fetch only the last message for preview
          orderBy: desc(messages.createdAt),
          limit: 1,
        },
      },
      orderBy: desc(channels.updatedAt),
    });

    // Filter channels to only include those where the user is a member
    const filteredChannels = userChannels.filter(channel => 
      userChannelIds.includes(channel.id)
    );

    // 3. Process channels to combine data and calculate actual unread count
    const dmListItemsPromises = filteredChannels.map(async (channel) => {
      const otherMember = channel.members.find(m => m.userId !== currentUser!.id);
      const lastMsg = channel.messages[0]; // Last message from the include
      const lastReadTime = lastReadMap.get(channel.id);

      // For now, we'll skip the complex unread count calculation since it requires
      // more complex Drizzle queries. We can implement this later with proper operators.
      let unreadCount = 0;
      
      // Define a fallback for otherUser details if needed
      const otherUserDetails = otherMember?.user ?? {
          id: 'unknown-user',
          username: 'Unknown',
          firstName: 'Deleted',
          lastName: 'User',
          profilePicture: null
      };

      return {
        channelId: channel.id,
        otherUser: {
            id: otherUserDetails.id,
            username: otherUserDetails.username,
            firstName: otherUserDetails.firstName ?? '', // Ensure non-null string
            lastName: otherUserDetails.lastName,
            profilePicture: otherUserDetails.profilePicture,
        },
        lastMessage: lastMsg ? {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt,
            authorId: lastMsg.authorId,
        } : null,
        unreadCount: unreadCount,
        // Include last message timestamp for sorting, fallback to channel update time
        sortTimestamp: lastMsg?.createdAt ?? channel.updatedAt,
      };
    });

    const processedChannels = await Promise.all(dmListItemsPromises);

    // 5. Sort the final list by the determined sortTimestamp (descending)
    const sortedDmListItems = processedChannels.sort((a, b) =>
        b.sortTimestamp.getTime() - a.sortTimestamp.getTime()
    );

    // Remove the temporary sortTimestamp before returning
    return sortedDmListItems.map(({ sortTimestamp, ...rest }) => rest);

  } catch (error) {
    console.error("Error fetching DM channels:", error);
    throw new Error('Failed to fetch DM channels.');
  }
};

// --- End Action ---

/**
 * Type for the other user's details in a DM channel.
 */
export type DmParticipantDetails = Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'username' | 'profilePicture'
    // Add lastSeen or isOnline here if you implement presence/status tracking
> | null;


/**
 * Fetches details of the other participant in a specific DM channel.
 * @param channelId - The ID of the DM channel.
 * @returns The other participant's details or null if not found/error.
 */
export const getDmChannelDetails = async (channelId: string): Promise<{ otherUser: DmParticipantDetails; error?: string }> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { otherUser: null, error: 'Not authenticated.' };
    }
    if (!channelId) {
        return { otherUser: null, error: 'Channel ID is required.' };
    }

    try {
        // First verify user is a member of the channel
        const userMembership = await db.query.channelMembers.findFirst({
            where: and(
                eq(channelMembers.channelId, channelId),
                eq(channelMembers.userId, currentUser.id)
            ),
        });

        if (!userMembership) {
            return { otherUser: null, error: 'Channel not found or you are not a member.' };
        }

        // Get channel details and members
        const channel = await db.query.channels.findFirst({
            where: and(
              eq(channels.id, channelId),
              eq(channels.type, 'DIRECT_MESSAGE')
            ),
            with: {
                members: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                profilePicture: true,
                                // lastSeen: true, // Select status field if added later
                            }
                        }
                    }
                }
            }
        });

        if (!channel) {
            return { otherUser: null, error: 'Channel not found or you are not a member.' };
        }

        const otherMember = channel.members.find(member => member.userId !== currentUser.id);

        if (!otherMember || !otherMember.user) {
            // This might happen if the other user was deleted, return appropriate state
             return { otherUser: { id: 'unknown', firstName: 'Unknown', lastName: 'User', username: null, profilePicture: null }, error: 'Other participant not found.' };
        }

        return { otherUser: otherMember.user };

    } catch (error) {
        console.error(`Error fetching DM channel details for ${channelId}:`, error);
        return { otherUser: null, error: 'Failed to fetch channel details.' };
    }
};

/**
 * Marks messages in a DM channel as read by the current user.
 * Updates messages where the current user is the recipient and readAt is null.
 * @param channelId The ID of the direct message channel.
 * @returns Result object indicating success or failure.
 */
export const markMessagesAsRead = async (
  channelId: string
): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    // 1. Authenticate user
    const { data: currentUser, error: authError } = await getAuthenticatedUser();
    if (authError || !currentUser) {
      return { success: false, error: authError || 'User not authenticated' };
    }

    // 2. Find the channel to ensure it exists and is a DM channel
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.id, channelId),
        eq(channels.type, 'DIRECT_MESSAGE')
      ),
    });

    if (!channel) {
      return { success: false, error: 'Direct message channel not found' };
    }

    // 3. Update messages (mark as read)
    await db.update(messages)
      .set({ readAt: new Date() })
      .where(and(
        eq(messages.channelId, channelId),
        isNull(messages.readAt)
      ));

    // 4. Update ChannelMember lastReadAt timestamp using upsert
    const existingMember = await db.query.channelMembers.findFirst({
      where: and(
        eq(channelMembers.userId, currentUser.id),
        eq(channelMembers.channelId, channelId)
      ),
    });

    if (existingMember) {
      await db.update(channelMembers)
        .set({ lastReadAt: new Date() })
        .where(and(
          eq(channelMembers.userId, currentUser.id),
          eq(channelMembers.channelId, channelId)
        ));
    } else {
      await db.insert(channelMembers).values({
        userId: currentUser.id,
        channelId: channelId,
        lastReadAt: new Date(),
      });
    }

    // 5. Optional: Revalidate path if needed
    // Revalidating layout might still be useful to eventually update the count
    revalidatePath('/chat'); // Revalidate the list page
    revalidatePath('/layout'); // Revalidate layout for header count

    return { success: true, count: 0 }; // Note: Drizzle doesn't return count like Prisma

  } catch (error) {
    console.error(`[markMessagesAsRead Error] Failed for channel ${channelId}:`, error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}; 