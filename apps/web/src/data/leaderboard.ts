'use server'

import { db } from "@/lib/drizzle"
import { unstable_cache } from 'next/cache'
import {
  leaderboardScores,
  users,
  type LeaderboardScore,
  type User,
  leaderboardTypeEnum
} from "@0unveiled/database"
import { eq, and, desc, asc, isNotNull, ne } from "drizzle-orm"

// Type for leaderboard score with user information
export type LeaderboardScoreWithUser = LeaderboardScore & {
  user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'profilePicture' | 'headline'>
}

/**
 * Fetches leaderboard scores for a specific user by their user ID.
 * @param userId - The ID of the user
 * @returns Array of leaderboard scores with user info or error
 */
export const getLeaderboardScoresByUserId = async (userId: string) => {
  try {
    if (!userId) {
      return { error: 'User ID is required' }
    }

        // Cache per-user leaderboard snapshot for a short period.
    const cacheKey = `leaderboard:user:${userId}`
    const cachedFn = unstable_cache(
      async () => {
        const scores = await db
          .select({
            id: leaderboardScores.id,
            userId: leaderboardScores.userId,
            leaderboardType: leaderboardScores.leaderboardType,
            score: leaderboardScores.score,
            rank: leaderboardScores.rank,
            techStack: leaderboardScores.techStack,
            domain: leaderboardScores.domain,
            updatedAt: leaderboardScores.updatedAt,
            user: {
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              lastName: users.lastName,
              profilePicture: users.profilePicture,
              headline: users.headline,
            },
          })
          .from(leaderboardScores)
          .innerJoin(users, eq(leaderboardScores.userId, users.id))
          .where(eq(leaderboardScores.userId, userId))
          .orderBy(asc(leaderboardScores.rank), desc(leaderboardScores.score));

        return scores as LeaderboardScoreWithUser[]
      },
      [cacheKey],
      { revalidate: 300, tags: [cacheKey] }
    )

    const scores = await cachedFn()

    return { success: true, scores: scores as LeaderboardScoreWithUser[] }
  } catch (error) {
    console.error('Error fetching leaderboard scores by user ID:', error)
    return { error: 'Failed to fetch leaderboard scores' }
  }
}

/**
 * Fetches leaderboard scores for a specific user by their username.
 * @param username - The username of the user
 * @returns Array of leaderboard scores with user info or error
 */
export const getLeaderboardScoresByUsername = async (username: string) => {
  try {
  if (!username) {
      return { error: 'Username is required' }
    }

  const userId = await getUserIdByUsernameCached(username)

  if (!userId) return { error: 'User not found' }

    // Then fetch their leaderboard scores
  const result = await getLeaderboardScoresByUserId(userId)
    return result
  } catch (error) {
    console.error('Error fetching leaderboard scores by username:', error)
    return { error: 'Failed to fetch leaderboard scores' }
  }
}

/**
 * Fetches leaderboard scores for a specific type (GENERAL, TECH_STACK, DOMAIN).
 * @param type - The leaderboard type
 * @param techStack - Optional tech stack filter (required if type is TECH_STACK)
 * @param domain - Optional domain filter (required if type is DOMAIN)
 * @param limit - Optional limit for number of results (default: 50)
 * @returns Array of leaderboard scores with user info or error
 */
export const getLeaderboardByType = async (
  type: typeof leaderboardTypeEnum.enumValues[number],
  techStack?: string,
  domain?: string,
  limit: number = 50
) => {
  try {
    // Enforce required filters for specific leaderboard types
    if (type === 'TECH_STACK' && !techStack) {
      return { error: 'Tech stack is required for TECH_STACK leaderboard' }
    }
    if (type === 'DOMAIN' && !domain) {
      return { error: 'Domain is required for DOMAIN leaderboard' }
    }

    const pageSize = Math.min(Math.max(limit ?? 50, 1), 100)

    // Use direct query instead of relations to avoid the referencedTable error
    let whereCondition = and(
      eq(leaderboardScores.leaderboardType, type),
      isNotNull(users.username),
      ne(users.username, ""),
      eq(users.onboarded, true)
    )

    if (type === 'TECH_STACK' && techStack) {
      whereCondition = and(whereCondition, eq(leaderboardScores.techStack, techStack))
    } else if (type === 'DOMAIN' && domain) {
      whereCondition = and(whereCondition, eq(leaderboardScores.domain, domain))
    }

    const scores = await db
      .select({
        id: leaderboardScores.id,
        userId: leaderboardScores.userId,
        leaderboardType: leaderboardScores.leaderboardType,
        score: leaderboardScores.score,
        rank: leaderboardScores.rank,
        techStack: leaderboardScores.techStack,
        domain: leaderboardScores.domain,
        updatedAt: leaderboardScores.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          headline: users.headline,
        },
      })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(whereCondition)
      .orderBy(asc(leaderboardScores.rank), desc(leaderboardScores.score))
      .limit(pageSize);

    // Defense-in-depth: only return entries for users with a username
    const filtered = (scores || []).filter((s: any) => !!s.user?.username && s.user.username.trim() !== '')
    return { success: true, scores: filtered }
  } catch (error) {
    console.error('Error fetching leaderboard by type:', error)
    return { error: 'Failed to fetch leaderboard' }
  }
}

/**
 * Fetches the general leaderboard (top users overall).
 * @param limit - Optional limit for number of results (default: 50)
 * @returns Array of leaderboard scores with user info or error
 */
export const getGeneralLeaderboard = async (limit: number = 50) => {
  return getLeaderboardByType('GENERAL', undefined, undefined, limit)
}

/**
 * Fetches leaderboard scores for a specific tech stack.
 * @param techStack - The tech stack to filter by
 * @param limit - Optional limit for number of results (default: 50)
 * @returns Array of leaderboard scores with user info or error
 */
export const getTechStackLeaderboard = async (techStack: string, limit: number = 50) => {
  if (!techStack) {
    return { error: 'Tech stack is required' }
  }
  return getLeaderboardByType('TECH_STACK', techStack, undefined, limit)
}

/**
 * Fetches leaderboard scores for a specific domain.
 * @param domain - The domain to filter by
 * @param limit - Optional limit for number of results (default: 50)
 * @returns Array of leaderboard scores with user info or error
 */
export const getDomainLeaderboard = async (domain: string, limit: number = 50) => {
  if (!domain) {
    return { error: 'Domain is required' }
  }
  return getLeaderboardByType('DOMAIN', undefined, domain, limit)
}

/**
 * Gets a user's rank and score for a specific leaderboard type.
 * @param userId - The ID of the user
 * @param type - The leaderboard type
 * @param techStack - Optional tech stack filter
 * @param domain - Optional domain filter
 * @returns User's rank and score or error
 */
export const getUserRankInLeaderboard = async (
  userId: string,
  type: typeof leaderboardTypeEnum.enumValues[number],
  techStack?: string,
  domain?: string
) => {
  try {
    if (!userId) {
      return { error: 'User ID is required' }
    }
    if (type === 'TECH_STACK' && !techStack) {
      return { error: 'Tech stack is required for TECH_STACK leaderboard' }
    }
    if (type === 'DOMAIN' && !domain) {
      return { error: 'Domain is required for DOMAIN leaderboard' }
    }

    const key = `leaderboard:rank:${userId}:${type}:${techStack ?? ''}:${domain ?? ''}`
    const cachedFn = unstable_cache(
      async () => {
        let whereCondition = and(
          eq(leaderboardScores.userId, userId),
          eq(leaderboardScores.leaderboardType, type)
        )

        if (type === 'TECH_STACK' && techStack) {
          whereCondition = and(whereCondition, eq(leaderboardScores.techStack, techStack))
        } else if (type === 'DOMAIN' && domain) {
          whereCondition = and(whereCondition, eq(leaderboardScores.domain, domain))
        }

        const score = await db.query.leaderboardScores.findFirst({
          where: whereCondition,
          columns: {
            id: true,
            userId: true,
            leaderboardType: true,
            score: true,
            rank: true,
            updatedAt: true,
            techStack: true,
            domain: true,
          },
        })

        return score ?? null
      },
      [key],
      { revalidate: 300, tags: [key] }
    )

    const score = await cachedFn()

    if (!score) {
      return { error: 'User not found in this leaderboard' }
    }

    return {
      success: true,
      rank: score.rank,
      score: score.score,
      leaderboardScore: score
    }
  } catch (error) {
    console.error('Error fetching user rank in leaderboard:', error)
    return { error: 'Failed to fetch user rank' }
  }
}

/**
 * Gets a user's leaderboard data (score and rank) by user ID for the GENERAL leaderboard.
 * @param userId - The ID of the user
 * @returns User's score and rank or error
 */
export const getLeaderboardDataByUserId = async (userId: string) => {
  return getUserRankInLeaderboard(userId, 'GENERAL')
}

/**
 * Gets a user's leaderboard data (score and rank) by username for the GENERAL leaderboard.
 * @param username - The username of the user
 * @returns User's score and rank or error
 */
export const getLeaderboardDataByUsername = async (username: string) => {
  try {
    if (!username) {
      return { error: 'Username is required' }
    }

    const userId = await getUserIdByUsernameCached(username)

    if (!userId) {
      return { error: 'User not found' }
    }

    // Then get their leaderboard data
    return getLeaderboardDataByUserId(userId)
  } catch (error) {
    console.error('Error fetching leaderboard data by username:', error)
    return { error: 'Failed to fetch leaderboard data' }
  }
}

// Helper: cached lookup for userId by username
const getUserIdByUsernameCached = async (username: string): Promise<string | null> => {
  const uname = username.trim().toLowerCase()
  if (!uname) return null

  const key = `user:by-username:${uname}`
  const cachedFn = unstable_cache(
    async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.username, uname),
        columns: { id: true },
      })
      return user?.id ?? null
    },
    [key],
    { revalidate: 600, tags: [key] }
  )

  return cachedFn()
}