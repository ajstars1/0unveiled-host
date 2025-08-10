import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const leaderboardQuerySchema = z.object({
  type: z.enum(["GENERAL", "TECH_STACK", "DOMAIN"]).default("GENERAL"),
  techStack: z.string().optional(),
  domain: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = leaderboardQuerySchema.parse({
      type: searchParams.get('type') || 'GENERAL',
      techStack: searchParams.get('techStack') || undefined,
      domain: searchParams.get('domain') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
      search: searchParams.get('search') || undefined,
    });

    // Forward request to the Express API
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const params = new URLSearchParams({
      type: query.type,
      limit: query.limit.toString(),
      offset: query.offset.toString(),
    });

    if (query.techStack) params.set('techStack', query.techStack);
    if (query.domain) params.set('domain', query.domain);
    if (query.search) params.set('search', query.search);

    const response = await fetch(`${baseUrl}/api/leaderboard?${params.toString()}`, {
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
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}