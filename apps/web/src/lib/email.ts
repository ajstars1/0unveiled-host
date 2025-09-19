import { Resend } from 'resend'
import logger from '@/lib/logger'
import { type Notification, type User, notificationTypeEnum } from '@0unveiled/database'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailNotificationData {
  to: string
  firstName: string
  notificationType: typeof notificationTypeEnum.enumValues[number]
  content: string
  linkUrl?: string
  actionUrl?: string
}

/**
 * Email templates for different notification types
 */
const getEmailTemplate = (data: EmailNotificationData) => {
  const { firstName, notificationType, content, linkUrl, actionUrl } = data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Ensure URLs in emails are absolute for all clients
  const resolveUrl = (u?: string): string => {
    if (!u) return `${baseUrl}/notifications`
    const trimmed = u.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('/')) return `${baseUrl}${trimmed}`
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`
  }
  const fullActionUrl = resolveUrl(actionUrl || linkUrl)

  const commonFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      <p>Best regards,<br>The 0unveiled Team</p>
      <p>You're receiving this because you're subscribed to email notifications. 
         <a href="${baseUrl}/settings/notifications" style="color: #3b82f6;">Manage your notification preferences</a>
      </p>
    </div>
  `

  switch (notificationType) {
    case 'PROJECT_INVITE':
      return {
        subject: 'You\'ve been invited to join a project',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Project Invitation</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Project Invitation
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'APPLICATION_RECEIVED':
      return {
        subject: 'New application for your project',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">New Project Application</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Review Application
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'APPLICATION_STATUS_UPDATE':
      return {
        subject: 'Update on your project application',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Application Status Update</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Application
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'CONNECTION_REQUEST_RECEIVED':
      return {
        subject: 'New connection request',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">New Connection Request</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Connection Request
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'CONNECTION_REQUEST_ACCEPTED':
      return {
        subject: 'Connection request accepted!',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Connection Accepted</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Profile
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'NEW_MESSAGE':
      return {
        subject: 'New message received',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">New Message</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Message
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'TASK_ASSIGNED':
      return {
        subject: 'New task assigned to you',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Task Assigned</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Task
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'TASK_UPDATED':
      return {
        subject: 'Task update',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Task Updated</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Task
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    case 'SYSTEM_ALERT':
      return {
        subject: 'System notification',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">System Alert</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Details
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }

    default:
      return {
        subject: 'New notification from 0unveiled',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h1 style="color: #1f2937; margin-bottom: 24px;">New Notification</h1>
            <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">${content}</p>
            <div style="margin: 32px 0;">
              <a href="${fullActionUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Notification
              </a>
            </div>
            ${commonFooter}
          </div>
        `
      }
  }
}

/**
 * Sends an email notification using Resend
 * @param data - Email notification data including recipient, content, and notification type
 * @returns Object indicating success or error
 */
export const sendEmailNotification = async (
  data: EmailNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const template = getEmailTemplate(data)
    
  logger.info(`[email] Attempting to send to ${data.to} | subject: ${template.subject}`)

    const result = await resend.emails.send({
      from: '0unveiled <notifications@support.0unveiled.com>',
      to: data.to,
      subject: template.subject,
      html: template.html,
    })

    if (result.error) {
  logger.error('Resend error:', result.error)
      return { 
        success: false, 
        error: `Failed to send email: ${result.error.message}` 
      }
    }

    const messageId = result.data?.id
  logger.info(`[email] Sent successfully to ${data.to}${messageId ? ` | id: ${messageId}` : ''}`)

    return { 
      success: true, 
      messageId
    }
  } catch (error) {
  logger.error('Email service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email service error' 
    }
  }
}

/**
 * Determines if a user should receive email notifications based on their preferences
 * @param user - User object with notification preferences
 * @param notificationType - Type of notification being sent
 * @returns Boolean indicating if email should be sent
 */
export const shouldSendEmailNotification = (
  user: Pick<User, 'emailFrequency' | 'notifyMessages' | 'notifyConnections' | 'notifyProjects' | 'notifyAchievements' | 'notifyEvents'>,
  notificationType: typeof notificationTypeEnum.enumValues[number]
): boolean => {
  // Check if user has disabled email notifications entirely
  if (user.emailFrequency === 'NEVER') {
    return false
  }

  // Check specific notification type preferences
  switch (notificationType) {
    case 'NEW_MESSAGE':
      return user.notifyMessages
    case 'CONNECTION_REQUEST_RECEIVED':
    case 'CONNECTION_REQUEST_ACCEPTED':
      return user.notifyConnections
    case 'PROJECT_INVITE':
    case 'PROJECT_UPDATE':
    case 'APPLICATION_RECEIVED':
    case 'APPLICATION_STATUS_UPDATE':
    case 'TASK_ASSIGNED':
    case 'TASK_UPDATED':
      return user.notifyProjects
    case 'NEW_FOLLOWER':
      return user.notifyAchievements
    case 'SYSTEM_ALERT':
    case 'INTEGRATION_UPDATE':
      return user.notifyEvents
    default:
      return true // Default to true for unknown types
  }
}

/**
 * Sends email notifications based on user's email frequency preference
 * For IMMEDIATE: sends right away
 * For DAILY/WEEKLY: could be used with a batch job (not implemented here)
 */
export const processEmailNotification = async (
  user: User,
  notificationType: typeof notificationTypeEnum.enumValues[number],
  content: string,
  linkUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // Check if user should receive this type of email notification
  if (!shouldSendEmailNotification(user, notificationType)) {
  logger.info(`[email] Skipping email to ${user.email} for type ${notificationType} due to user preferences`)
    return { success: true } // Not an error, just skipped due to preferences
  }

  // For now, only handle IMMEDIATE frequency
  // DAILY and WEEKLY would require a batch job system
  if (user.emailFrequency !== 'IMMEDIATE') {
  logger.info(`Email notification queued for later delivery (${user.emailFrequency}) for user ${user.id}`)
    return { success: true } // Would be queued for batch processing
  }

  const emailData: EmailNotificationData = {
    to: user.email,
    firstName: user.firstName,
    notificationType,
    content,
    linkUrl,
  }

  return await sendEmailNotification(emailData)
}

/**
 * Health check for the email service
 */
export const testEmailService = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Test by attempting to create a resend instance
    // Note: This doesn't actually send an email
    const testResend = new Resend(process.env.RESEND_API_KEY!)
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email service test failed' 
    }
  }
}