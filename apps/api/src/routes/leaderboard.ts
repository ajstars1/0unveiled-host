import { Router } from "express";
import { db } from "@0unveiled/database";
import { leaderboardScores, users } from "@0unveiled/database/schema";
import { eq, and, desc, isNotNull, like, or } from "drizzle-orm";
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

    let conditions = [eq(leaderboardScores.leaderboardType, query.type)];

    if (query.type === "TECH_STACK" && query.techStack) {
      conditions.push(eq(leaderboardScores.techStack, query.techStack));
    } else if (query.type === "DOMAIN" && query.domain) {
      conditions.push(eq(leaderboardScores.domain, query.domain));
    }

    // Add search functionality
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.username, searchTerm)
        )
      );
    }

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
      .where(and(...conditions))
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .orderBy(desc(leaderboardScores.score))
      .limit(query.limit)
      .offset(query.offset);

    res.json({ success: true, data });
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
      .where(
        and(
          eq(leaderboardScores.leaderboardType, "TECH_STACK"),
          isNotNull(leaderboardScores.techStack)
        )
      );

    // Get distinct domains
    const domains = await db
      .selectDistinct({ domain: leaderboardScores.domain })
      .from(leaderboardScores)
      .where(
        and(
          eq(leaderboardScores.leaderboardType, "DOMAIN"),
          isNotNull(leaderboardScores.domain)
        )
      );

    res.json({
      success: true,
      data: {
        techStacks: techStacks.map(t => t.techStack).filter(Boolean),
        domains: domains.map(d => d.domain).filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as leaderboardRoutes };
