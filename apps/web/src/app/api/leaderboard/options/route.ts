import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Forward request to the Express API
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${baseUrl}/api/leaderboard/options`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leaderboard options API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard options' },
      { status: 500 }
    );
  }
}