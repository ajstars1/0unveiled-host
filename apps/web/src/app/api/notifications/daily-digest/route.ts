import { NextRequest, NextResponse } from 'next/server'
import { processDailyDigests } from '@/lib/email-batch'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Check if this is an authorized request (for cron jobs)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'daily-digest-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  logger.info('Starting daily digest processing...')
    const results = await processDailyDigests()
    
  logger.info(`Daily digest results: ${results.successful}/${results.processed} successful`)
    
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
    logger.error('Daily digest processing error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process daily digests' 
    }, { status: 500 })
  }
}