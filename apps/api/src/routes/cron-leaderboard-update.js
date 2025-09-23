import { updateLeaderboards } from '../../services/leaderboard-service.js';

export default async function handler(req, res) {
  // Only allow POST requests from Vercel Cron
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Vercel Cron request (optional but recommended)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.info('🕐 Vercel cron: Starting leaderboard update...');
    await updateLeaderboards();
    console.info('✅ Vercel cron: Leaderboard update completed successfully');

    res.status(200).json({
      success: true,
      message: 'Leaderboard update completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Vercel cron: Leaderboard update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Leaderboard update failed',
      timestamp: new Date().toISOString()
    });
  }
}
