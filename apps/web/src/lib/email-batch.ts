import { db } from '@/lib/drizzle'
import logger from '@/lib/logger'
import { sendEmailNotification, type EmailNotificationData } from '@/lib/email'
import { users, notifications, type Notification } from '@0unveiled/database'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

/**
 * Processes batch email notifications for users with DAILY or WEEKLY frequency
 * This would typically be called by a cron job or scheduled task
 */

interface BatchEmailSummary {
  userId: string
  email: string
  firstName: string
  unreadCount: number
  latestNotifications: Array<{
    type: string
    content: string
    linkUrl?: string
    createdAt: string
  }>
}

/**
 * Get users who should receive daily email digests
 * @returns Array of users with pending notifications
 */
export const getUsersForDailyDigest = async (): Promise<BatchEmailSummary[]> => {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  try {
    const usersWithDailyPreference = await db.query.users.findMany({
      where: eq(users.emailFrequency, 'DAILY'),
      columns: {
        id: true,
        email: true,
        firstName: true,
      }
    })

    const summaries: BatchEmailSummary[] = []

    for (const user of usersWithDailyPreference) {
      const recentNotifications = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, user.id),
          sql`${notifications.createdAt} >= ${oneDayAgo.toISOString()}`
        ),
        orderBy: desc(notifications.createdAt),
        limit: 10 // Limit to latest 10 notifications
      })

      if (recentNotifications.length > 0) {
        const unreadCount = recentNotifications.filter((n: Notification) => !n.isRead).length
        
        summaries.push({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          unreadCount,
          latestNotifications: recentNotifications.map((n: Notification) => ({
            type: n.type,
            content: n.content,
            linkUrl: n.linkUrl || undefined,
            createdAt: n.createdAt
          }))
        })
      }
    }

    return summaries
  } catch (error) {
    logger.error('Error getting users for daily digest:', error)
    return []
  }
}

/**
 * Get users who should receive weekly email digests
 * @returns Array of users with pending notifications
 */
export const getUsersForWeeklyDigest = async (): Promise<BatchEmailSummary[]> => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  try {
    const usersWithWeeklyPreference = await db.query.users.findMany({
      where: eq(users.emailFrequency, 'WEEKLY'),
      columns: {
        id: true,
        email: true,
        firstName: true,
      }
    })

    const summaries: BatchEmailSummary[] = []

    for (const user of usersWithWeeklyPreference) {
      const recentNotifications = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, user.id),
          sql`${notifications.createdAt} >= ${oneWeekAgo.toISOString()}`
        ),
        orderBy: desc(notifications.createdAt),
        limit: 20 // Limit to latest 20 notifications for weekly
      })

      if (recentNotifications.length > 0) {
        const unreadCount = recentNotifications.filter((n: Notification) => !n.isRead).length
        
        summaries.push({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          unreadCount,
          latestNotifications: recentNotifications.map((n: Notification) => ({
            type: n.type,
            content: n.content,
            linkUrl: n.linkUrl || undefined,
            createdAt: n.createdAt
          }))
        })
      }
    }

    return summaries
  } catch (error) {
    logger.error('Error getting users for weekly digest:', error)
    return []
  }
}

/**
 * Sends a daily digest email to a user
 * @param summary - User's notification summary
 * @returns Result of email sending
 */
export const sendDailyDigestEmail = async (
  summary: BatchEmailSummary
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const emailData: EmailNotificationData = {
    to: summary.email,
    firstName: summary.firstName,
    notificationType: 'SYSTEM_ALERT', // Using system alert as base type for digest
    content: `You have ${summary.unreadCount} unread notifications from the last 24 hours.`,
    linkUrl: `${baseUrl}/notifications`
  }

  // Custom template for daily digest
  const digestHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
      <h1 style="color: #1f2937; margin-bottom: 24px;">Your Daily Digest</h1>
      <p style="font-size: 16px; color: #374151;">Hi ${summary.firstName},</p>
      <p style="font-size: 16px; color: #374151;">Here's what happened in the last 24 hours:</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 16px;">
          ${summary.unreadCount} Unread Notifications
        </h2>
        
        ${summary.latestNotifications.slice(0, 5).map(notification => `
          <div style="border-left: 3px solid #3b82f6; padding-left: 12px; margin-bottom: 16px;">
            <p style="font-weight: 500; color: #1f2937; margin: 0 0 4px 0;">
              ${notification.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              ${notification.content}
            </p>
            <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">
              ${new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        `).join('')}
        
        ${summary.latestNotifications.length > 5 ? `
          <p style="color: #6b7280; font-style: italic; margin-top: 16px;">
            ... and ${summary.latestNotifications.length - 5} more notifications
          </p>
        ` : ''}
      </div>

      <div style="margin: 32px 0;">
        <a href="${baseUrl}/notifications" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          View All Notifications
        </a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>Best regards,<br>The 0unveiled Team</p>
        <p>You're receiving this daily digest because you've set your email preference to daily. 
           <a href="${baseUrl}/settings/notifications" style="color: #3b82f6;">Change your email preferences</a>
        </p>
      </div>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: '0unveiled <notifications@support.0unveiled.com>',
      to: summary.email,
      subject: `Your daily digest - ${summary.unreadCount} new notifications`,
      html: digestHtml,
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send digest email' 
    }
  }
}

/**
 * Sends a weekly digest email to a user
 * @param summary - User's notification summary
 * @returns Result of email sending
 */
export const sendWeeklyDigestEmail = async (
  summary: BatchEmailSummary
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Group notifications by type for better weekly summary
  const notificationsByType = summary.latestNotifications.reduce((acc, notification) => {
    const type = notification.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(notification)
    return acc
  }, {} as Record<string, typeof summary.latestNotifications>)

  const digestHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
      <h1 style="color: #1f2937; margin-bottom: 24px;">Your Weekly Summary</h1>
      <p style="font-size: 16px; color: #374151;">Hi ${summary.firstName},</p>
      <p style="font-size: 16px; color: #374151;">Here's your activity summary for the past week:</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 16px;">
          ${summary.unreadCount} Unread • ${summary.latestNotifications.length} Total Notifications
        </h2>
        
        ${Object.entries(notificationsByType).map(([type, typeNotifications]) => `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
              ${type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} (${typeNotifications.length})
            </h3>
            ${typeNotifications.slice(0, 3).map(notification => `
              <div style="border-left: 3px solid #8b5cf6; padding-left: 12px; margin-bottom: 12px;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  ${notification.content}
                </p>
                <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">
                  ${new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            `).join('')}
            ${typeNotifications.length > 3 ? `
              <p style="color: #6b7280; font-style: italic; margin-left: 12px; font-size: 14px;">
                ... and ${typeNotifications.length - 3} more
              </p>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin: 32px 0;">
        <a href="${baseUrl}/notifications" 
           style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          View All Notifications
        </a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>Best regards,<br>The 0unveiled Team</p>
        <p>You're receiving this weekly summary because you've set your email preference to weekly. 
           <a href="${baseUrl}/settings/notifications" style="color: #3b82f6;">Change your email preferences</a>
        </p>
      </div>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: '0unveiled <notifications@support.0unveiled.com>',
      to: summary.email,
      subject: `Your weekly summary - ${summary.unreadCount} unread notifications`,
      html: digestHtml,
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send weekly digest email' 
    }
  }
}

/**
 * Process all daily digest emails
 * This function should be called by a daily cron job
 */
export const processDailyDigests = async (): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> => {
  const summaries = await getUsersForDailyDigest()
  const results = { processed: 0, successful: 0, failed: 0, errors: [] as string[] }

  for (const summary of summaries) {
    results.processed++
    
    try {
      const result = await sendDailyDigestEmail(summary)
      
      if (result.success) {
        results.successful++
        logger.info(`Daily digest sent to ${summary.email}`)
      } else {
        results.failed++
        results.errors.push(`Failed to send to ${summary.email}: ${result.error}`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`Error processing ${summary.email}: ${error}`)
    }
  }

  return results
}

/**
 * Process all weekly digest emails
 * This function should be called by a weekly cron job
 */
export const processWeeklyDigests = async (): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> => {
  const summaries = await getUsersForWeeklyDigest()
  const results = { processed: 0, successful: 0, failed: 0, errors: [] as string[] }

  for (const summary of summaries) {
    results.processed++
    
    try {
      const result = await sendWeeklyDigestEmail(summary)
      
      if (result.success) {
        results.successful++
        logger.info(`Weekly digest sent to ${summary.email}`)
      } else {
        results.failed++
        results.errors.push(`Failed to send to ${summary.email}: ${result.error}`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`Error processing ${summary.email}: ${error}`)
    }
  }

  return results
}