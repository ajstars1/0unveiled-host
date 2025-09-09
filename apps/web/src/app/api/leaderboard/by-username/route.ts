import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboardDataByUsername } from '@/data/leaderboard'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')?.trim().toLowerCase()

  if (!username) {
    return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 })
  }

  const result = await getLeaderboardDataByUsername(username)
  if ('error' in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result }, { status: 200 })
}
