'use server'

import { getCurrentUser } from "@/data/user"
import { db } from "@0unveiled/database"
import { notifications } from "@0unveiled/database/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidateTag, unstable_cache } from "next/cache"

// Cached function for getting unread notification count
export const getCachedUnreadNotificationCount = unstable_cache(
  async (userId: string) => {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return result.length;
  },
  ['unread-notification-count'],
  {
    tags: ['notifications'],
    revalidate: 60, // Cache for 1 minute
  }
);

// Cached function for getting recent notifications
export const getCachedRecentNotifications = unstable_cache(
  async (userId: string, limit: number = 5) => {
    const result = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
    });
    
    return result;
  },
  ['recent-notifications'],
  {
    tags: ['notifications'],
    revalidate: 120, // Cache for 2 minutes
  }
);

/**
 * Get unread notification count with caching optimization
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return 0;

  try {
    return await getCachedUnreadNotificationCount(currentUser.id);
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}

/**
 * Get recent notifications with caching optimization
 */
export async function getRecentNotifications(limit: number = 5) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  try {
    return await getCachedRecentNotifications(currentUser.id, limit);
  } catch (error) {
    console.error("Error fetching recent notifications:", error);
    return [];
  }
}

/**
 * Get all notifications for the current user (without cache for admin interface)
 */
export async function getUserNotifications() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, currentUser.id),
      orderBy: [desc(notifications.createdAt)],
    });

    return userNotifications;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return null;
  }
}

/**
 * Mark a notification as read with cache invalidation
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    // Update the notification
    const result = await db
      .update(notifications)
      .set({ 
        isRead: true,
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, currentUser.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Notification not found or not authorized.' };
    }

    // Invalidate related caches
    revalidateTag('notifications');
    
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: 'Failed to mark notification as read.' };
  }
}

/**
 * Mark all notifications as read with cache invalidation
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    // Update all unread notifications for the user
    await db
      .update(notifications)
      .set({ 
        isRead: true,
      })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false)
        )
      );

    // Invalidate related caches
    revalidateTag('notifications');
    
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: 'Failed to mark all notifications as read.' };
  }
}

/**
 * Get notification summary for client components with better error handling
 */
export async function getNotificationSummaryForClient(limit: number = 5) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    const [notifications, unreadCount] = await Promise.all([
      getCachedRecentNotifications(currentUser.id, limit),
      getCachedUnreadNotificationCount(currentUser.id)
    ]);

    return {
      notifications,
      unreadCount,
      hasMore: notifications.length === limit, // Simple check if there might be more
    };
  } catch (error) {
    console.error("Error fetching notification summary:", error);
    return null;
  }
}

/**
 * Create a new notification with cache invalidation
 */
export async function createNotification({
  userId,
  content,
  linkUrl,
  type = 'GENERAL'
}: {
  userId: string;
  content: string;
  linkUrl?: string;
  type?: 'GENERAL' | 'CONNECTION' | 'PROJECT' | 'SYSTEM';
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(notifications).values({
      userId,
      content,
      linkUrl,
      type: type as any, // Type assertion for enum compatibility
    });

    // Invalidate caches for the user
    revalidateTag('notifications');
    
    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: 'Failed to create notification.' };
  }
}
