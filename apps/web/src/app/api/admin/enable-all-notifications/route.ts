import { NextRequest } from 'next/server'
import { db } from '@/lib/drizzle'
import logger from '@/lib/logger'
import { users } from '@0unveiled/database'

// POST /api/admin/enable-all-notifications
// Guarded by CRON_SECRET header. Forces all users' notification toggles to true
// and sets emailFrequency to IMMEDIATE. Users can later change settings.
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-cron-secret') || req.headers.get('X-Cron-Secret')
    if (!process.env.CRON_SECRET || !secret || secret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const result = await db.update(users)
      .set({
        notifyMessages: true,
        notifyConnections: true,
        notifyProjects: true,
        notifyAchievements: true,
        notifyEvents: true,
        // Ensure immediate emails are enabled globally; users can opt out later
        emailFrequency: 'IMMEDIATE' as any,
        updatedAt: new Date(),
      });

    return new Response(JSON.stringify({ success: true, updated: 'all', info: 'All users updated to enable notifications and IMMEDIATE emails.' }), { status: 200 })
  } catch (error) {
    logger.error('enable-all-notifications error:', error)
    return new Response(JSON.stringify({ error: 'Failed to update users' }), { status: 500 })
  }
}
