import { db } from "@0unveiled/database";
import { users, showcasedItems, projects, leaderboardScores, NewLeaderboardScore, leaderboardTypeEnum } from "@0unveiled/database/schema";
import { eq, and, desc } from "drizzle-orm";

const getTechStackAndDomain = (repo: any): { techStack: string | null, domain: string | null } => {
  const languages = repo.repository?.languages || {};
  const dominantLanguage = Object.keys(languages).reduce((a, b) => languages[a] > languages[b] ? a : b, null);

  let domain = null;
  if (['JavaScript', 'TypeScript', 'HTML', 'CSS'].includes(dominantLanguage)) {
    domain = 'FRONTEND';
  } else if (['Python', 'Go', 'Java', 'Ruby', 'PHP'].includes(dominantLanguage)) {
    domain = 'BACKEND';
  } else if (['Python', 'Jupyter Notebook'].includes(dominantLanguage)) {
    domain = 'AI_ML';
  }

  return { techStack: dominantLanguage, domain };
};

const calculateCruismScore = (repo: any): number => {
  const quality = repo.ai_insights?.overall_quality_score || 0;
  const influence = (repo.repository?.stargazers_count || 0) + (repo.repository?.forks_count || 0);
  const security = repo.security?.security_score || 0;
  const reliability = (repo.quality?.test_files_count || 0) - (repo.repository?.open_issues_count || 0);

  // Normalize influence score (example)
  const normalizedInfluence = Math.min(influence / 1000, 1) * 100; // Cap at 1000

  const cruism = (quality * 0.4) + (normalizedInfluence * 0.25) + (security * 0.15) + (reliability * 0.2);
  return cruism;
};

export const updateLeaderboards = async () => {
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const userShowcasedItems = await db
      .select()
      .from(showcasedItems)
      .where(eq(showcasedItems.userId, user.id));

    const techStackScores: { [key: string]: number[] } = {};
    const domainScores: { [key: string]: number[] } = {};

    for (const item of userShowcasedItems) {
      const score = calculateCruismScore(item.metadata);
      const { techStack, domain } = getTechStackAndDomain(item.metadata);

      if (techStack) {
        if (!techStackScores[techStack]) techStackScores[techStack] = [];
        techStackScores[techStack].push(score);
      }

      if (domain) {
        if (!domainScores[domain]) domainScores[domain] = [];
        domainScores[domain].push(score);
      }
    }

    for (const techStack in techStackScores) {
      const totalScore = techStackScores[techStack].reduce((acc, score) => acc + score, 0) / techStackScores[techStack].length;
      const newScore: NewLeaderboardScore = {
        userId: user.id,
        leaderboardType: 'TECH_STACK',
        score: Math.round(totalScore),
        rank: 0,
        updatedAt: new Date(),
        techStack,
      };
      await db.insert(leaderboardScores).values(newScore).onConflictDoUpdate({ target: [leaderboardScores.userId, leaderboardScores.leaderboardType, leaderboardScores.techStack], set: { score: newScore.score, updatedAt: newScore.updatedAt } });
    }

    for (const domain in domainScores) {
      const totalScore = domainScores[domain].reduce((acc, score) => acc + score, 0) / domainScores[domain].length;
      const newScore: NewLeaderboardScore = {
        userId: user.id,
        leaderboardType: 'DOMAIN',
        score: Math.round(totalScore),
        rank: 0,
        updatedAt: new Date(),
        domain,
      };
      await db.insert(leaderboardScores).values(newScore).onConflictDoUpdate({ target: [leaderboardScores.userId, leaderboardScores.leaderboardType, leaderboardScores.domain], set: { score: newScore.score, updatedAt: newScore.updatedAt } });
    }

    const scores = userShowcasedItems.map(item => calculateCruismScore(item.metadata));
    const totalScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;

    const newScore: NewLeaderboardScore = {
      userId: user.id,
      leaderboardType: 'GENERAL',
      score: Math.round(totalScore),
      rank: 0, // will be updated later
      updatedAt: new Date(),
    };

    await db.insert(leaderboardScores).values(newScore).onConflictDoUpdate({ target: [leaderboardScores.userId, leaderboardScores.leaderboardType], set: { score: newScore.score, updatedAt: newScore.updatedAt } });
  }

  // Update ranks
  const generalLeaderboard = await db.select().from(leaderboardScores).where(eq(leaderboardScores.leaderboardType, 'GENERAL')).orderBy(desc(leaderboardScores.score));

  for (let i = 0; i < generalLeaderboard.length; i++) {
    await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, generalLeaderboard[i].id));
  }

  // Update ranks for tech stack leaderboards
  const techStacks = await db.selectDistinct(leaderboardScores.techStack).from(leaderboardScores).where(eq(leaderboardScores.leaderboardType, 'TECH_STACK'));
  for (const { techStack } of techStacks) {
    const techLeaderboard = await db.select().from(leaderboardScores).where(and(eq(leaderboardScores.leaderboardType, 'TECH_STACK'), eq(leaderboardScores.techStack, techStack))).orderBy(desc(leaderboardScores.score));
    for (let i = 0; i < techLeaderboard.length; i++) {
      await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, techLeaderboard[i].id));
    }
  }

  // Update ranks for domain leaderboards
  const domains = await db.selectDistinct(leaderboardScores.domain).from(leaderboardScores).where(eq(leaderboardScores.leaderboardType, 'DOMAIN'));
  for (const { domain } of domains) {
    const domainLeaderboard = await db.select().from(leaderboardScores).where(and(eq(leaderboardScores.leaderboardType, 'DOMAIN'), eq(leaderboardScores.domain, domain))).orderBy(desc(leaderboardScores.score));
    for (let i = 0; i < domainLeaderboard.length; i++) {
      await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, domainLeaderboard[i].id));
    }
  }
};