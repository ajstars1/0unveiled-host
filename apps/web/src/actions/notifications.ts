'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  notifications, 
  users,
  notificationTypeEnum,
  type Notification, 
  type User 
} from '@0unveiled/database'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Fetches the count of unread notifications for the current user.
 * @returns The count of unread notifications, or 0 if not authenticated or error.
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return 0
    }

    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, currentUser.id),
        eq(notifications.isRead, false)
      ),
    })
    return unreadNotifications.length
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return 0
  }
}

/**
 * Fetches all notifications for the current user, ordered by creation date (newest first).
 * @returns An array of notifications or null if not authenticated or error.
 */
export const getUserNotifications = async (): Promise<Notification[] | null> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return null
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, currentUser.id),
      orderBy: desc(notifications.createdAt),
    })

    return userNotifications
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return null
  }
}

/**
 * Marks a single notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 * @returns Object indicating success or error.
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!notificationId) {
    return { success: false, error: 'Notification ID is required.' };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    const updatedNotifications = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, currentUser.id),
        eq(notifications.isRead, false)
      ))
      .returning();

    if (updatedNotifications.length === 0) {
      console.warn(`No notification updated for ID: ${notificationId} and user: ${currentUser.id}. Might be already read or not found.`);
    }

    // Revalidate paths that display notification counts or lists
    revalidatePath('/dashboard/notifications');
    revalidatePath('/dashboard/layout'); // To update header count (might need more specific path if layout changes)

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read.' };
  }
};

/**
 * Marks all unread notifications for the current user as read.
 * @returns Object indicating success or error.
 */
export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, currentUser.id),
        eq(notifications.isRead, false)
      ));

    // Revalidate relevant paths
    revalidatePath('/dashboard/notifications');
    revalidatePath('/dashboard/layout'); // To update header count

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read.' };
  }
};

/**
 * Creates a notification for a specific user, respecting their preferences.
 * @param userId - The ID of the user receiving the notification.
 * @param type - The type of notification.
 * @param content - The main text content of the notification.
 * @param linkUrl - Optional URL for the notification to link to.
 * @returns Object indicating success or error.
 */
export const createNotification = async (
  userId: string,
  type: typeof notificationTypeEnum.enumValues[number],
  content: string,
  linkUrl?: string
): Promise<{ success: boolean; notification?: Notification; error?: string }> => {
  if (!userId || !type || !content) {
    return { success: false, error: 'Missing required notification data.' };
  }

  try {
    // 1. Fetch Recipient User's Settings
    const recipient = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        notifyMessages: true,
        notifyConnections: true,
        notifyProjects: true,
        notifyAchievements: true,
        notifyEvents: true,
      }
    });

    if (!recipient) {
      console.warn(`createNotification: Recipient user ${userId} not found.`);
      return { success: true }; 
    }

    // 2. Check Preference based on NotificationType
    let shouldCreateNotification = false;
    switch (type) {
      case 'NEW_MESSAGE':
        shouldCreateNotification = recipient.notifyMessages;
        break;
      case 'CONNECTION_REQUEST_RECEIVED':
      case 'CONNECTION_REQUEST_ACCEPTED':
        shouldCreateNotification = recipient.notifyConnections;
        break;
      case 'PROJECT_INVITE':
      case 'PROJECT_UPDATE':
      case 'APPLICATION_RECEIVED':
      case 'APPLICATION_STATUS_UPDATE':
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
        shouldCreateNotification = recipient.notifyProjects;
        break;
      case 'SYSTEM_ALERT':
      case 'NEW_FOLLOWER':
      case 'INTEGRATION_UPDATE':
      default:
        shouldCreateNotification = true;
    }

    // 3. Conditional Creation
    if (!shouldCreateNotification) {
      console.log(`Notification of type ${type} suppressed for user ${userId} due to preferences.`);
      return { success: true };
    }

    // --- Proceed with creation if check passed ---
    const [newNotification] = await db.insert(notifications).values({
      userId: userId,
      type: type,
      content: content,
      linkUrl: linkUrl,
      isRead: false, 
    }).returning();

    // Revalidate the recipient's notification paths
    revalidatePath('/dashboard/notifications');
    revalidatePath('/dashboard/layout'); 

    return { success: true, notification: newNotification };

  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification.' };
  }
};

/**
 * Fetches the most recent notifications for the current user.
 * @param limit - The maximum number of notifications to fetch. Defaults to 5.
 * @returns An array of recent notifications or null if not authenticated or error.
 */
export const getRecentNotifications = async (limit: number = 5): Promise<Notification[] | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const recentNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, currentUser.id),
      orderBy: desc(notifications.createdAt),
      limit: limit,
    });

    return recentNotifications;
  } catch (error) {
    console.error("Error fetching recent user notifications:", error);
    return null;
  }
};

/**
 * Fetches a summary of notifications for the current user, suitable for client-side queries.
 * Includes the unread count and a limited list of recent notifications.
 * @param limit - The maximum number of recent notifications to fetch. Defaults to 5.
 * @returns An object with count and notifications array, or null if not authenticated/error.
 */
export const getNotificationSummaryForClient = async (
  limit: number = 5
): Promise<{ count: number; notifications: Notification[] } | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    // Fetch count and recent notifications in parallel
    const [unreadNotifications, recentNotifications] = await Promise.all([
      db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false)
        ),
      }),
      db.query.notifications.findMany({
        where: eq(notifications.userId, currentUser.id),
        orderBy: desc(notifications.createdAt),
        limit: limit,
      }),
    ]);

    return { 
      count: unreadNotifications.length, 
      notifications: recentNotifications 
    };

  } catch (error) {
    console.error("Error fetching notification summary for client:", error);
    return null;
  }
};

// TODO: Add actions for marking notifications as read (single and all)

// Add other notification actions here if needed (e.g., mark as read) 