import { NextRequest, NextResponse } from 'next/server'
import { testEmailService } from '@/lib/email'

export async function GET() {
  try {
    const result = await testEmailService()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email service is configured correctly' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test email service' 
    }, { status: 500 })
  }
}