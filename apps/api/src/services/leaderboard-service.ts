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

const calculateAdvancedScore = (repo: any): number => {
  // New AI-powered scoring algorithm using comprehensive metrics
  // Handle both full AI analysis and legacy basic data
  
  // 1. AI Insights Score (40% weight) - Gemini's comprehensive analysis
  const aiInsightsScore = calculateAIInsightsScore(repo);
  
  // 2. Impact & Influence Score (25% weight) - Community engagement and reach
  const impactScore = calculateImpactScore(repo);
  
  // 3. Technical Excellence Score (20% weight) - Code quality, architecture, security
  const technicalScore = calculateTechnicalExcellenceScore(repo);
  
  // 4. Professional Relevance Score (15% weight) - Modern stack, industry alignment
  const relevanceScore = calculateProfessionalRelevanceScore(repo);
  
  // Weighted final score (0-100 scale)
  const finalScore = (
    (aiInsightsScore * 0.40) + 
    (impactScore * 0.25) + 
    (technicalScore * 0.20) + 
    (relevanceScore * 0.15)
  );
  
  // Scale to 0-10000 range for database storage and better precision
  return Math.max(0, Math.round(finalScore * 100));
};

const calculateAIInsightsScore = (repo: any): number => {
  const ai = repo.ai_insights;
  if (!ai) return calculateBasicQualityScore(repo); // Fallback for repos without AI analysis
  
  let score = 0;
  
  // Gemini's overall quality assessment (50 points max)
  score += Math.min(50, ai.overall_quality_score || 0);
  
  // Project maturity and development stage (20 points max)
  const maturityBonus = getMaturityBonus(ai.project_maturity, ai.development_stage);
  score += maturityBonus;
  
  // AI-assessed strengths and quality factors (20 points max)
  const strengthsBonus = Math.min(20, (ai.strengths?.length || 0) * 4);
  score += strengthsBonus;
  
  // Architecture and maintainability assessment (10 points max)
  const architectureBonus = ai.best_practices_adherence ? Math.min(10, ai.best_practices_adherence / 10) : 0;
  score += architectureBonus;
  
  return Math.min(100, score);
};

const calculateImpactScore = (repo: any): number => {
  const stars = repo.repository?.stargazers_count || repo.stargazers_count || 0;
  const forks = repo.repository?.forks_count || repo.forks_count || 0;
  const watchers = repo.repository?.watchers_count || repo.watchers_count || 0;
  const openIssues = repo.repository?.open_issues_count || repo.open_issues_count || 0;
  
  // Weighted influence calculation
  const influence = (stars * 3) + (forks * 5) + (watchers * 1);
  
  // Community engagement (having issues shows active usage)
  const engagementBonus = Math.min(15, openIssues * 0.5);
  
  // Logarithmic scaling for influence (rewards significant projects more)
  const influenceScore = influence > 0 ? Math.min(85, Math.log10(influence + 1) * 15) : 0;
  
  return Math.min(100, influenceScore + engagementBonus);
};

const calculateTechnicalExcellenceScore = (repo: any): number => {
  let score = 0;
  
  // Security score (30 points max)
  const security = repo.security?.security_score || 0;
  score += Math.min(30, security * 0.3);
  
  // Code quality metrics (40 points max)
  if (repo.quality) {
    const quality = repo.quality;
    score += Math.min(15, (quality.docstring_coverage || 0) * 0.15);
    score += Math.min(15, quality.architecture_score || 0 * 0.15);
    score += Math.min(10, (quality.test_to_code_ratio || 0) * 20);
  }
  
  // Code complexity and maintainability (30 points max)
  if (repo.code_metrics) {
    const metrics = repo.code_metrics;
    const maintainabilityPoints = Math.min(15, (metrics.maintainability_index || 0) * 0.15);
    const complexityPenalty = Math.max(0, 15 - (metrics.cyclomatic_complexity || 0));
    score += maintainabilityPoints + complexityPenalty;
  } else {
    // Basic fallback for repos without detailed metrics
    score += 20; // Assume reasonable baseline
  }
  
  return Math.min(100, score);
};

const calculateProfessionalRelevanceScore = (repo: any): number => {
  let score = 0;
  
  // Modern technology stack (50 points max)
  if (repo.tech_stack) {
    score += Math.min(25, (repo.tech_stack.modernness_score || 0) * 0.25);
    score += Math.min(15, (repo.tech_stack.total_technologies || 0) * 2);
    score += Math.min(10, (repo.tech_stack.frameworks?.length || 0) * 2);
  } else {
    // Fallback: assess based on primary language
    score += getLanguageModernityScore(repo.language || repo.repository?.language);
  }
  
  // Industry alignment and career impact (30 points max)
  if (repo.ai_insights?.industry_alignment) {
    score += Math.min(15, repo.ai_insights.industry_alignment.length * 3);
  }
  if (repo.ai_insights?.career_impact === 'high') score += 15;
  else if (repo.ai_insights?.career_impact === 'medium') score += 10;
  else if (repo.ai_insights?.career_impact === 'low') score += 5;
  
  // Repository completeness (20 points max)
  score += repo.repository?.description || repo.description ? 5 : 0;
  score += repo.repository?.has_readme ? 5 : 0;
  score += repo.repository?.license ? 5 : 0;
  score += repo.topics?.length > 0 ? 5 : 0;
  
  return Math.min(100, score);
};

// Helper functions
const getMaturityBonus = (maturity: string, stage: string): number => {
  let bonus = 0;
  
  if (maturity === 'mature') bonus += 12;
  else if (maturity === 'developing') bonus += 8;
  else if (maturity === 'experimental') bonus += 4;
  
  if (stage === 'production') bonus += 8;
  else if (stage === 'mvp') bonus += 6;
  else if (stage === 'prototype') bonus += 3;
  
  return bonus;
};

const getLanguageModernityScore = (language: string): number => {
  if (!language) return 15;
  
  const modernLanguages = {
    'TypeScript': 25, 'Rust': 25, 'Go': 24, 'Swift': 23, 'Kotlin': 22,
    'Python': 21, 'JavaScript': 20, 'Java': 18, 'C#': 17, 'Ruby': 16,
    'PHP': 14, 'C++': 13, 'C': 12
  };
  
  return modernLanguages[language] || 15;
};

const calculateBasicQualityScore = (repo: any): number => {
  // Fallback scoring for repositories without AI analysis
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const hasDescription = !!(repo.description);
  const hasTopics = (repo.topics?.length || 0) > 0;
  
  let score = 30; // Base score
  score += Math.min(25, Math.log10(stars + 1) * 8);
  score += Math.min(20, Math.log10(forks + 1) * 10);
  score += hasDescription ? 15 : 0;
  score += hasTopics ? 10 : 0;
  
  return Math.min(100, score);
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
      const score = calculateAdvancedScore(item.metadata);
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

    const scores = userShowcasedItems.map(item => calculateAdvancedScore(item.metadata));
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