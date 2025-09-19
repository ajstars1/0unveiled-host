import { NextRequest, NextResponse } from 'next/server'
import { sendEmailNotification } from '@/lib/email'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Check if this is an authorized request (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'test-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, content, linkUrl, userEmail, firstName } = await request.json()

    if (!type || !content || !userEmail || !firstName) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, content, userEmail, firstName' 
      }, { status: 400 })
    }

    const result = await sendEmailNotification({
      to: userEmail,
      firstName,
      notificationType: type,
      content,
      linkUrl
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Test email sent successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    logger.error('Test email error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test email' 
    }, { status: 500 })
  }
}