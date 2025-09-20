import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { leaderboardScores, users } from '@0unveiled/database';
import { eq, and, isNotNull, ne } from 'drizzle-orm';

// Define interfaces for type safety
interface OptionsData {
  techStacks: string[];
  domains: string[];
}

interface OptionsResponse {
  success: boolean;
  data: OptionsData;
}

export async function GET() {
  try {
    // Get distinct tech stacks
    const techStacks = await db
      .selectDistinct({ techStack: leaderboardScores.techStack })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, "TECH_STACK"),
          isNotNull(leaderboardScores.techStack),
          isNotNull(users.username),
          ne(users.username, ""),
          eq(users.onboarded, true)
        )
      );

    // Get distinct domains
    const domains = await db
      .selectDistinct({ domain: leaderboardScores.domain })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, "DOMAIN"),
          isNotNull(leaderboardScores.domain),
          isNotNull(users.username),
          ne(users.username, ""),
          eq(users.onboarded, true)
        )
      );

    const filteredTechStacks: string[] = techStacks.map((t: { techStack: string | null }) => t.techStack).filter(Boolean) as string[];
    const filteredDomains: string[] = domains.map((d: { domain: string | null }) => d.domain).filter(Boolean) as string[];

    const response: OptionsResponse = {
      success: true,
      data: {
        techStacks: filteredTechStacks,
        domains: filteredDomains,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Leaderboard options API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard options' },
      { status: 500 }
    );
  }
}