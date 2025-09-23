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
      // Exclude seed/test users from leaderboard
      ne(users.username, "seed_user_1746410303039"),
    ];

    if (query.type === "TECH_STACK" && query.techStack) {
      conditions.push(eq(leaderboardScores.techStack, query.techStack));
    } else if (query.type === "DOMAIN" && query.domain) {
      conditions.push(eq(leaderboardScores.domain, query.domain));
    }

    // Add search functionality with optimized query
    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      // Use a more efficient search by combining conditions
      const searchCondition = or(
        like(users.firstName, searchTerm),
        like(users.lastName, searchTerm),
        like(users.username, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Single optimized query with proper ordering and pagination
    const data = await db
      .select({
        rank: leaderboardScores.rank,
        score: leaderboardScores.score,
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
      .orderBy(desc(leaderboardScores.score), desc(leaderboardScores.rank))
      .limit(query.limit)
      .offset(query.offset);

    // Remove duplicates more efficiently using a Map
    const uniqueUsers = new Map<string, typeof data[0]>();

    for (const item of data) {
      const userId = item.user.id;
      const existing = uniqueUsers.get(userId);

      // Keep the entry with the higher score if duplicate found
      if (!existing || item.score > existing.score) {
        uniqueUsers.set(userId, item);
      }
    }

    const uniqueData = Array.from(uniqueUsers.values());

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
          ne(users.username, "seed_user_1746410303039"),
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
          ne(users.username, "seed_user_1746410303039"),
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
