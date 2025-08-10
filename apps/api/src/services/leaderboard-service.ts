import { db } from "@0unveiled/database";
import { users, showcasedItems, projects, leaderboardScores, NewLeaderboardScore, leaderboardTypeEnum } from "@0unveiled/database/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

const getTechStackAndDomain = (repo: any): { techStack: string | null, domain: string | null } => {
  // Handle both old and new metadata formats
  // New format: repo.repository.languages
  // Old format: repo.languages directly on repo
  const languages = repo.repository?.languages || repo.languages || {};
  
  if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) {
    return { techStack: null, domain: null };
  }
  
  const dominantLanguage = Object.keys(languages).reduce((a, b) => languages[a] > languages[b] ? a : b, '');

  let domain = null;
  if (['JavaScript', 'TypeScript', 'HTML', 'CSS'].includes(dominantLanguage)) {
    domain = 'FRONTEND';
  } else if (['Python', 'Go', 'Java', 'Ruby', 'PHP', 'C#', 'Rust'].includes(dominantLanguage)) {
    domain = 'BACKEND';
  } else if (['Python', 'Jupyter Notebook', 'R'].includes(dominantLanguage)) {
    domain = 'AI_ML';
  }

  return { techStack: dominantLanguage || null, domain };
};

const calculateCruismScore = (repo: any): number => {
  // Handle both old and new metadata formats
  // New format: repo.ai_insights, repo.repository, repo.security, repo.quality
  // Old format: repo.stargazers_count, repo.forks_count, etc. directly on repo
  
  const quality = repo.ai_insights?.overall_quality_score || 0;
  
  // For influence, try both formats
  const stars = repo.repository?.stargazers_count || repo.stargazers_count || 0;
  const forks = repo.repository?.forks_count || repo.forks_count || 0;
  const influence = stars + forks;
  
  const security = repo.security?.security_score || 0;
  
  // For reliability, try both formats
  const testFiles = repo.quality?.test_files_count || 0;
  const openIssues = repo.repository?.open_issues_count || repo.open_issues_count || 0;
  const reliability = Math.max(0, testFiles - openIssues); // Ensure non-negative
  
  // Normalize influence score (cap at 1000 for better scoring distribution)
  const normalizedInfluence = Math.min(influence / 1000, 1) * 100;

  // Calculate CRUISM score with weights and scale up to avoid rounding to 0
  const cruism = (quality * 0.4) + (normalizedInfluence * 0.25) + (security * 0.15) + (reliability * 0.2);
  
  // Scale up by 100 to preserve decimal places when rounded
  return Math.max(0, Math.round(cruism * 100)); // Score will be in range 0-10000 instead of 0-100
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
      const scores = techStackScores[techStack];
      const totalScore = scores.length > 0 ? scores.reduce((acc, score) => acc + score, 0) / scores.length : 0;
      const newScore: NewLeaderboardScore = {
        userId: user.id,
        leaderboardType: 'TECH_STACK',
        score: Math.round(totalScore || 0),
        rank: 0,
        updatedAt: new Date(),
        techStack,
      };
      // Check if record exists
      const existing = await db
        .select()
        .from(leaderboardScores)
        .where(
          and(
            eq(leaderboardScores.userId, user.id),
            eq(leaderboardScores.leaderboardType, 'TECH_STACK'),
            eq(leaderboardScores.techStack, techStack)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(leaderboardScores)
          .set({ score: newScore.score, updatedAt: newScore.updatedAt })
          .where(eq(leaderboardScores.id, existing[0].id));
      } else {
        await db.insert(leaderboardScores).values(newScore);
      }
    }

    for (const domain in domainScores) {
      const scores = domainScores[domain];
      const totalScore = scores.length > 0 ? scores.reduce((acc, score) => acc + score, 0) / scores.length : 0;
      const newScore: NewLeaderboardScore = {
        userId: user.id,
        leaderboardType: 'DOMAIN',
        score: Math.round(totalScore || 0),
        rank: 0,
        updatedAt: new Date(),
        domain,
      };
      // Check if record exists
      const existing = await db
        .select()
        .from(leaderboardScores)
        .where(
          and(
            eq(leaderboardScores.userId, user.id),
            eq(leaderboardScores.leaderboardType, 'DOMAIN'),
            eq(leaderboardScores.domain, domain)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(leaderboardScores)
          .set({ score: newScore.score, updatedAt: newScore.updatedAt })
          .where(eq(leaderboardScores.id, existing[0].id));
      } else {
        await db.insert(leaderboardScores).values(newScore);
      }
    }

    const scores = userShowcasedItems.map(item => calculateCruismScore(item.metadata));
    const totalScore = scores.length > 0 ? scores.reduce((acc, score) => acc + score, 0) / scores.length : 0;

    const newScore: NewLeaderboardScore = {
      userId: user.id,
      leaderboardType: 'GENERAL',
      score: Math.round(totalScore || 0),
      rank: 0, // will be updated later
      updatedAt: new Date(),
    };

    // Check if record exists
    const existing = await db
      .select()
      .from(leaderboardScores)
      .where(
        and(
          eq(leaderboardScores.userId, user.id),
          eq(leaderboardScores.leaderboardType, 'GENERAL')
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(leaderboardScores)
        .set({ score: newScore.score, updatedAt: newScore.updatedAt })
        .where(eq(leaderboardScores.id, existing[0].id));
    } else {
      await db.insert(leaderboardScores).values(newScore);
    }
  }

  // Update ranks
  const generalLeaderboard = await db.select().from(leaderboardScores).where(eq(leaderboardScores.leaderboardType, 'GENERAL')).orderBy(desc(leaderboardScores.score));

  for (let i = 0; i < generalLeaderboard.length; i++) {
    await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, generalLeaderboard[i].id));
  }

  // Update ranks for tech stack leaderboards
  const techStackLeaderboards = await db
    .select()
    .from(leaderboardScores)
    .where(
      and(
        eq(leaderboardScores.leaderboardType, 'TECH_STACK'),
        isNotNull(leaderboardScores.techStack)
      )
    )
    .orderBy(desc(leaderboardScores.score));

  // Group by tech stack and update ranks
  const techStackGroups: { [key: string]: any[] } = {};
  for (const item of techStackLeaderboards) {
    if (!techStackGroups[item.techStack!]) {
      techStackGroups[item.techStack!] = [];
    }
    techStackGroups[item.techStack!].push(item);
  }

  for (const techStack in techStackGroups) {
    const group = techStackGroups[techStack].sort((a, b) => b.score - a.score);
    for (let i = 0; i < group.length; i++) {
      await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, group[i].id));
    }
  }

  // Update ranks for domain leaderboards
  const domainLeaderboards = await db
    .select()
    .from(leaderboardScores)
    .where(
      and(
        eq(leaderboardScores.leaderboardType, 'DOMAIN'),
        isNotNull(leaderboardScores.domain)
      )
    )
    .orderBy(desc(leaderboardScores.score));

  // Group by domain and update ranks
  const domainGroups: { [key: string]: any[] } = {};
  for (const item of domainLeaderboards) {
    if (!domainGroups[item.domain!]) {
      domainGroups[item.domain!] = [];
    }
    domainGroups[item.domain!].push(item);
  }

  for (const domain in domainGroups) {
    const group = domainGroups[domain].sort((a, b) => b.score - a.score);
    for (let i = 0; i < group.length; i++) {
      await db.update(leaderboardScores).set({ rank: i + 1 }).where(eq(leaderboardScores.id, group[i].id));
    }
  }
};