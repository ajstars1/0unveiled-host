import { Router } from "express";
import { db } from "@0unveiled/database";
import { leaderboardScores, users } from "@0unveiled/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const leaderboardQuerySchema = z.object({
  type: z.enum(["GENERAL", "TECH_STACK", "DOMAIN"]).default("GENERAL"),
  techStack: z.string().optional(),
  domain: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
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

export { router as leaderboardRoutes };
