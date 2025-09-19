import { NextRequest, NextResponse } from 'next/server'
import { processWeeklyDigests } from '@/lib/email-batch'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Check if this is an authorized request (for cron jobs)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'weekly-digest-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  logger.info('Starting weekly digest processing...')
    const results = await processWeeklyDigests()
    
  logger.info(`Weekly digest results: ${results.successful}/${results.processed} successful`)
    
    return NextResponse.json({
      success: true,
      results: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors
      }
    })
  } catch (error) {
    logger.error('Weekly digest processing error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process weekly digests' 
    }, { status: 500 })
  }
}