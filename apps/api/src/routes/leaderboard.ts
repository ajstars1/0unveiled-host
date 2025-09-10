import { Router } from "express";
import { db } from "@0unveiled/database";
import { leaderboardScores, users } from "@0unveiled/database";
import { eq, and, desc, isNotNull, like, or, SQL, ne } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const leaderboardQuerySchema = z.object({
  type: z.enum(["GENERAL", "TECH_STACK", "DOMAIN"]).default("GENERAL"),
  techStack: z.string().optional(),
  domain: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = leaderboardQuerySchema.parse(req.query);

    let conditions = [
      eq(leaderboardScores.leaderboardType, query.type),
      // Only include onboarded users (with a username)
      isNotNull(users.username),
      ne(users.username, ""),
      eq(users.onboarded, true),
    ];

    if (query.type === "TECH_STACK" && query.techStack) {
      conditions.push(eq(leaderboardScores.techStack, query.techStack));
    } else if (query.type === "DOMAIN" && query.domain) {
      conditions.push(eq(leaderboardScores.domain, query.domain));
    }

    // Add search functionality
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      const searchConditions = [
        like(users.firstName, searchTerm),
        like(users.lastName, searchTerm),
        like(users.username, searchTerm)
      ].filter(Boolean) as SQL<unknown>[];
      
      if (searchConditions.length > 0) {
        const orCondition = or(...searchConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
      }
    }

    const data = await db
      .select({
        rank: leaderboardScores.rank,
        score: leaderboardScores.score,
        userId: leaderboardScores.userId, // Include userId to help with uniqueness
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
        },
      })
  .from(leaderboardScores)
  .innerJoin(users, eq(leaderboardScores.userId, users.id))
  .where(and(...conditions))
      .orderBy(desc(leaderboardScores.score), leaderboardScores.rank)
      .limit(query.limit)
      .offset(query.offset);

    // Ensure unique users (remove potential duplicates)
    // Define interfaces for type safety
    interface User {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      profilePicture: string | null;
    }

    interface LeaderboardItem {
      rank: number;
      score: number;
      userId: string;
      user: User;
    }

    interface LeaderboardItemWithoutUserId {
      rank: number;
      score: number;
      user: User;
    }

    const uniqueData = data.reduce((acc: LeaderboardItemWithoutUserId[], current: LeaderboardItem) => {
      const existingIndex = acc.findIndex(item => item.user.id === current.user.id);
      if (existingIndex === -1) {
        // Remove the userId field from the response
        const { userId, ...rest } = current;
        acc.push(rest);
      } else {
        // Keep the entry with the higher score if duplicate found
        if (current.score > acc[existingIndex].score) {
          const { userId, ...rest } = current;
          acc[existingIndex] = rest;
        }
      }
      return acc;
    }, [] as LeaderboardItemWithoutUserId[]);

    res.json({ success: true, data: uniqueData });
  } catch (error) {
    next(error);
  }
});

// Get available filter options
router.get("/options", async (req, res, next) => {
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

    // Define interfaces for type safety
    interface OptionsData {
      techStacks: string[];
      domains: string[];
    }

    interface OptionsResponse {
      success: boolean;
      data: OptionsData;
    }

    const filteredTechStacks: string[] = techStacks.map((t: { techStack: string | null }) => t.techStack).filter(Boolean) as string[];
    const filteredDomains: string[] = domains.map((d: { domain: string | null }) => d.domain).filter(Boolean) as string[];

    const response: OptionsResponse = {
      success: true,
      data: {
      techStacks: filteredTechStacks,
      domains: filteredDomains,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as leaderboardRoutes };
