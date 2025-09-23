import { db } from "@0unveiled/database";
import { users, showcasedItems, projects, leaderboardScores, NewLeaderboardScore, leaderboardTypeEnum, notifications, notificationTypeEnum, type User } from "@0unveiled/database";
import { eq, and, desc, isNotNull, ne, sql, inArray } from "drizzle-orm";
import { Resend } from "resend";

// Temporary: inline notification functions until workspace resolution is fixed
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email notification using Resend
 */
const sendEmailNotification = async (
  recipient: User,
  type: typeof notificationTypeEnum.enumValues[number],
  content: string,
  linkUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!recipient.email) {
    return { success: false, error: "Recipient has no email address" };
  }

  try {
    let subject: string;
    let htmlContent: string;

    // Customize email content based on notification type
    switch (type) {
      case 'LEADERBOARD_RANK_UPDATE':
        subject = "Your Leaderboard Rank Updated!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Leaderboard Update</h2>
            <p>${content}</p>
            ${linkUrl ? `<p><a href="${linkUrl}" style="background-color: #fb923c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Leaderboard</a></p>` : ""}
            <p style="color: #666; font-size: 12px;">You're receiving this because you have leaderboard notifications enabled.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">For any help, contact us at <a href="mailto:ayush@0unveiled.com" style="color: #fb923c;">ayush@0unveiled.com</a></p>
          </div>
        `;
        break;
      default:
        subject = "0Unveiled Notification";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Notification</h2>
            <p>${content}</p>
            ${linkUrl ? `<p><a href="${linkUrl}">View Details</a></p>` : ""}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">For any help, contact us at <a href="mailto:ayush@0unveiled.com" style="color: #fb923c;">ayush@0unveiled.com</a></p>
          </div>
        `;
    }

    const { data, error } = await resend.emails.send({
      from: "0Unveiled <notifications@support.0unveiled.com>",
      to: recipient.email,
      subject,
      html: htmlContent,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: "Failed to send email" };
  }
};

/**
 * Creates a notification for a specific user, respecting their preferences.
 * Also sends email notifications if the user has enabled them and forceSkipEmail is not true.
 */
const createNotification = async (
  userId: string,
  type: typeof notificationTypeEnum.enumValues[number],
  content: string,
  linkUrl?: string,
  forceSkipEmail?: boolean
): Promise<{ success: boolean; notification?: any; error?: string }> => {
  if (!userId || !type || !content) {
    return { success: false, error: 'Missing required notification data.' };
  }

  try {
    // 1. Fetch Recipient User's Settings including email preferences
    const recipient = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        emailFrequency: true,
        notifyMessages: true,
        notifyConnections: true,
        notifyProjects: true,
        notifyAchievements: true,
        notifyEvents: true,
      }
    });

    if (!recipient) {
      console.warn(`createNotification: Recipient user ${userId} not found.`);
      return { success: true };
    }

    // 2. Check Preference based on NotificationType
    let shouldCreateNotification = false;
    switch (type) {
      case 'NEW_MESSAGE':
        shouldCreateNotification = recipient.notifyMessages;
        break;
      case 'CONNECTION_REQUEST_RECEIVED':
      case 'CONNECTION_REQUEST_ACCEPTED':
        shouldCreateNotification = recipient.notifyConnections;
        break;
      case 'PROJECT_INVITE':
      case 'PROJECT_UPDATE':
      case 'APPLICATION_RECEIVED':
      case 'APPLICATION_STATUS_UPDATE':
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
        shouldCreateNotification = recipient.notifyProjects;
        break;
      case 'SYSTEM_ALERT':
      case 'NEW_FOLLOWER':
      case 'INTEGRATION_UPDATE':
      case 'LEADERBOARD_RANK_UPDATE':
      default:
        shouldCreateNotification = true;
    }

    // 3. Conditional Creation
    if (!shouldCreateNotification) {
      console.info(`Notification of type ${type} suppressed for user ${userId} due to preferences.`);
      return { success: true };
    }

    // --- Proceed with creation if check passed ---
    const [newNotification] = await db.insert(notifications).values({
      userId: userId,
      type: type,
      content: content,
      linkUrl: linkUrl,
      isRead: false,
    }).returning();

    // 4. Send email notification if enabled and not forced to skip
    if (!forceSkipEmail) {
      try {
        const emailResult = await sendEmailNotification(
          recipient,
          type,
          content,
          linkUrl
        );

        if (!emailResult.success && emailResult.error) {
          console.error(`Failed to send email notification: ${emailResult.error}`);
          // Don't fail the entire operation if email fails
        } else if (emailResult.messageId) {
          console.info(`Email notification sent successfully. Message ID: ${emailResult.messageId}`);
        }
      } catch (emailError) {
        console.error('Email notification error (non-blocking):', emailError);
        // Email failure shouldn't prevent notification creation
      }
    }

    return { success: true, notification: newNotification };

  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification.' };
  }
};

/**
 * Sends a leaderboard rank update notification to a user.
 */
const sendLeaderboardRankNotification = async (
  userId: string,
  newRank: number,
  leaderboardType: string,
  previousRank?: number
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !newRank || !leaderboardType) {
    return { success: false, error: 'Missing required leaderboard notification data.' };
  }

  try {
    // Skip notifications for ranks below top 100 to avoid spam
    if (newRank > 100 && (!previousRank || previousRank > 100)) {
      return { success: true }; // Not an error, just not sending
    }

    // Get user's current score to check if they qualify for email notifications
    const userScore = await db
      .select({ score: leaderboardScores.score })
      .from(leaderboardScores)
      .where(
        and(
          eq(leaderboardScores.userId, userId),
          eq(leaderboardScores.leaderboardType, 'GENERAL')
        )
      )
      .limit(1);

    const currentScore = userScore[0]?.score || 0;

    // Only send email notifications to users with score above 1000
    const shouldSendEmail = currentScore > 1000;

    let content: string;
    let linkUrl = 'https://0unveiled.com/leaderboard'; // Link to leaderboard page

    if (!previousRank) {
      // New to leaderboard
      content = `🎉 Welcome to the ${leaderboardType.toLowerCase()} leaderboard! Your current rank is #${newRank}.`;
    } else if (previousRank > newRank) {
      // Rank improved
      const improvement = previousRank - newRank;
      if (improvement === 1) {
        content = `🚀 Congratulations! You moved up 1 position on the ${leaderboardType.toLowerCase()} leaderboard. Your new rank is #${newRank}!`;
      } else {
        content = `🚀 Congratulations! You moved up ${improvement} positions on the ${leaderboardType.toLowerCase()} leaderboard. Your new rank is #${newRank}!`;
      }
    } else if (previousRank < newRank) {
      // Rank dropped
      const drop = newRank - previousRank;
      if (drop === 1) {
        content = `📉 Your rank on the ${leaderboardType.toLowerCase()} leaderboard has dropped to #${newRank} (down 1 position).`;
      } else {
        content = `📉 Your rank on the ${leaderboardType.toLowerCase()} leaderboard has dropped to #${newRank} (down ${drop} positions).`;
      }
    } else {
      // This shouldn't happen since we check for changes, but just in case
      console.warn(`Unexpected: sendLeaderboardRankNotification called with same rank ${newRank} for user ${userId}`);
      return { success: true };
    }

    // Create the notification using the createNotification function
    const result = await createNotification(
      userId,
      'LEADERBOARD_RANK_UPDATE',
      content,
      linkUrl,
      !shouldSendEmail // Skip email if user doesn't qualify based on score
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to create leaderboard notification.' };
    }

    console.info(`Leaderboard notification sent for ${leaderboardType} (rank: ${newRank}, score: ${currentScore})`);
    return { success: true };

  } catch (error) {
    console.error('Error sending leaderboard rank notification:', error);
    return { success: false, error: 'Failed to send leaderboard rank notification.' };
  }
};

interface RepositoryMetadata {
  repository?: {
    languages?: Record<string, number>;
    stargazers_count?: number;
    forks_count?: number;
    watchers_count?: number;
    open_issues_count?: number;
    language?: string;
    description?: string;
    has_readme?: boolean;
    license?: any;
  };
  languages?: Record<string, number>;
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
  open_issues_count?: number;
  language?: string;
  description?: string;
  topics?: string[];
  ai_insights?: any;
  security?: { security_score: number };
  quality?: any;
  code_metrics?: any;
  tech_stack?: any;
}

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
  
  const modernLanguages: { [key: string]: number } = {
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
  console.time('leaderboard-update-total');

  // Only process users who are onboarded (i.e., have a non-empty username)
  const allUsers = await db
    .select({
      id: users.id,
      username: users.username
    })
    .from(users)
    .where(and(isNotNull(users.username), ne(users.username, "")));

  console.log(`Processing ${allUsers.length} users for leaderboard update`);

  // Filter out seed users early
  interface UserBasic {
    id: string;
    username: string;
  }

  const validUsers: UserBasic[] = allUsers.filter((user: UserBasic) => user.username !== 'seed_user_1746410303039');
  console.log(`Filtered to ${validUsers.length} valid users (excluded seed users)`);

  if (validUsers.length === 0) {
    console.log('No valid users to process');
    return;
  }

  // Batch fetch all showcased items for all users at once (single query)
  console.time('fetch-showcased-items');
  const allShowcasedItems = await db
    .select({
      id: showcasedItems.id,
      userId: showcasedItems.userId,
      metadata: showcasedItems.metadata
    })
    .from(showcasedItems)
    .where(and(
      isNotNull(showcasedItems.metadata),
      inArray(showcasedItems.userId, validUsers.map(u => u.id))
    ));
  console.timeEnd('fetch-showcased-items');
  console.log(`Fetched ${allShowcasedItems.length} showcased items`);

  // Group items by user for efficient processing
  const itemsByUser = new Map<string, typeof allShowcasedItems>();
  for (const item of allShowcasedItems) {
    if (!itemsByUser.has(item.userId)) {
      itemsByUser.set(item.userId, []);
    }
    itemsByUser.get(item.userId)!.push(item);
  }

  // Pre-compute all scores to avoid redundant calculations
  console.time('calculate-scores');
  const scoreCache = new Map<string, { score: number; techStack: string | null; domain: string | null }>();

  for (const item of allShowcasedItems) {
    const cacheKey = item.id;
    if (!scoreCache.has(cacheKey)) {
      const score = calculateAdvancedScore(item.metadata);
      const { techStack, domain } = getTechStackAndDomain(item.metadata);
      scoreCache.set(cacheKey, { score, techStack, domain });
    }
  }
  console.timeEnd('calculate-scores');

  // Prepare bulk operations data
  const leaderboardInserts: NewLeaderboardScore[] = [];
  const leaderboardUpdates: Array<{ id: string; score: number; updatedAt: Date }> = [];

  console.time('process-users');
  for (const user of validUsers) {
    const userItems = itemsByUser.get(user.id) || [];

    if (userItems.length === 0) continue;

    // Calculate scores for this user
    const techStackScores: { [key: string]: number[] } = {};
    const domainScores: { [key: string]: number[] } = {};
    let generalScores: number[] = [];

    for (const item of userItems) {
      const cached = scoreCache.get(item.id)!;
      generalScores.push(cached.score);

      if (cached.techStack) {
        if (!techStackScores[cached.techStack]) techStackScores[cached.techStack] = [];
        techStackScores[cached.techStack].push(cached.score);
      }

      if (cached.domain) {
        if (!domainScores[cached.domain]) domainScores[cached.domain] = [];
        domainScores[cached.domain].push(cached.score);
      }
    }

    // Prepare GENERAL leaderboard entry
    const generalScore = generalScores.length > 0
      ? Math.round(generalScores.reduce((acc, score) => acc + score, 0) / generalScores.length)
      : 0;

    leaderboardInserts.push({
      userId: user.id,
      leaderboardType: 'GENERAL',
      score: generalScore,
      rank: 0,
      updatedAt: new Date(),
    });

    // Prepare TECH_STACK leaderboard entries
    for (const techStack in techStackScores) {
      const scores = techStackScores[techStack];
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length)
        : 0;

      leaderboardInserts.push({
        userId: user.id,
        leaderboardType: 'TECH_STACK',
        score: avgScore,
        rank: 0,
        updatedAt: new Date(),
        techStack,
      });
    }

    // Prepare DOMAIN leaderboard entries
    for (const domain in domainScores) {
      const scores = domainScores[domain];
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length)
        : 0;

      leaderboardInserts.push({
        userId: user.id,
        leaderboardType: 'DOMAIN',
        score: avgScore,
        rank: 0,
        updatedAt: new Date(),
        domain,
      });
    }
  }
  console.timeEnd('process-users');

  // Batch database operations
  console.time('batch-db-operations');

  // Use ON CONFLICT to handle upserts efficiently
  if (leaderboardInserts.length > 0) {
    // Insert all new scores, update existing ones
    await db.insert(leaderboardScores).values(leaderboardInserts)
      .onConflictDoUpdate({
        target: [
          leaderboardScores.userId,
          leaderboardScores.leaderboardType,
          leaderboardScores.techStack,
          leaderboardScores.domain
        ],
        set: {
          score: sql`${sql.placeholder('excluded_score')}`,
          updatedAt: sql`${sql.placeholder('excluded_updatedAt')}`
        }
      });
  }

  console.timeEnd('batch-db-operations');
  console.log(`Processed ${leaderboardInserts.length} leaderboard entries`);

  // Capture current ranks before updating them (for notifications)
  const [previousGeneralRanks, previousTechStackRanks, previousDomainRanks] = await Promise.all([
    db
      .select({
        userId: leaderboardScores.userId,
        rank: leaderboardScores.rank,
      })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, 'GENERAL'),
          isNotNull(users.username),
          ne(users.username, '')
        )
      ),
    db
      .select({
        userId: leaderboardScores.userId,
        techStack: leaderboardScores.techStack,
        rank: leaderboardScores.rank,
      })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, 'TECH_STACK'),
          isNotNull(leaderboardScores.techStack),
          isNotNull(users.username),
          ne(users.username, '')
        )
      ),
    db
      .select({
        userId: leaderboardScores.userId,
        domain: leaderboardScores.domain,
        rank: leaderboardScores.rank,
      })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, 'DOMAIN'),
          isNotNull(leaderboardScores.domain),
          isNotNull(users.username),
          ne(users.username, '')
        )
      ),
  ]);

  // Helper function to update ranks and send notifications
  const updateRanksAndNotify = async (
    leaderboardData: any[],
    leaderboardType: 'GENERAL' | 'TECH_STACK' | 'DOMAIN',
    getPreviousRank: (item: any) => number | undefined,
    getDisplayName: (item: any) => string
  ) => {
    const rankChanges: Array<{ userId: string; newRank: number; previousRank?: number; displayName: string }> = [];

    // Sort by score descending and assign ranks
    const sortedData = leaderboardData.sort((a, b) => b.score - a.score);

    for (let i = 0; i < sortedData.length; i++) {
      const newRank = i + 1;
      const previousRank = getPreviousRank(sortedData[i]);

      // Only track if rank actually changed
      if (previousRank !== newRank) {
        rankChanges.push({
          userId: sortedData[i].userId,
          newRank,
          previousRank,
          displayName: getDisplayName(sortedData[i])
        });
      }

      // Update rank in database
      await db.update(leaderboardScores)
        .set({ rank: newRank })
        .where(eq(leaderboardScores.id, sortedData[i].id));
    }

    // Send notifications for rank changes with rate limiting
    // Process in batches of 2 every second to respect Resend's rate limit
    const batchSize = 2;
    const delayBetweenBatches = 1000; // 1 second

    for (let i = 0; i < rankChanges.length; i += batchSize) {
      const batch = rankChanges.slice(i, i + batchSize);

      // Process batch
      const batchPromises = batch.map(({ userId, newRank, previousRank, displayName }) =>
        sendLeaderboardRankNotification(userId, newRank, displayName, previousRank)
          .catch(error => {
            console.error(`Failed to send ${leaderboardType} leaderboard notification for user ${userId}:`, error);
            return null; // Don't fail the entire operation
          })
      );

      await Promise.allSettled(batchPromises);

      // Wait before next batch (except for the last batch)
      if (i + batchSize < rankChanges.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
  };

  // Update GENERAL leaderboard ranks
  const generalLeaderboard = await db
    .select({
      id: leaderboardScores.id,
      score: leaderboardScores.score,
      userId: leaderboardScores.userId,
    })
    .from(leaderboardScores)
    .innerJoin(users, eq(leaderboardScores.userId, users.id))
    .where(
      and(
        eq(leaderboardScores.leaderboardType, 'GENERAL'),
        isNotNull(users.username),
        ne(users.username, '')
      )
    );

  await updateRanksAndNotify(
    generalLeaderboard,
    'GENERAL',
    (item) => previousGeneralRanks.find((p: { userId: string; rank: number }) => p.userId === item.userId)?.rank,
    () => 'GENERAL'
  );

  // Update TECH_STACK leaderboard ranks
  const techStackLeaderboard = await db
    .select({
      id: leaderboardScores.id,
      score: leaderboardScores.score,
      techStack: leaderboardScores.techStack,
      userId: leaderboardScores.userId,
    })
    .from(leaderboardScores)
    .innerJoin(users, eq(leaderboardScores.userId, users.id))
    .where(
      and(
        eq(leaderboardScores.leaderboardType, 'TECH_STACK'),
        isNotNull(leaderboardScores.techStack),
        isNotNull(users.username),
        ne(users.username, '')
      )
    );

  // Group by tech stack
  const techStackGroups: { [key: string]: any[] } = {};
  for (const item of techStackLeaderboard) {
    if (!techStackGroups[item.techStack!]) {
      techStackGroups[item.techStack!] = [];
    }
    techStackGroups[item.techStack!].push(item);
  }

  // Update ranks for each tech stack
  for (const techStack in techStackGroups) {
    await updateRanksAndNotify(
      techStackGroups[techStack],
      'TECH_STACK',
      (item) => previousTechStackRanks.find((p: { userId: string; techStack: string | null; rank: number }) =>
        p.userId === item.userId && p.techStack === techStack
      )?.rank,
      () => `${techStack} Tech Stack`
    );
  }

  // Update DOMAIN leaderboard ranks
  const domainLeaderboard = await db
    .select({
      id: leaderboardScores.id,
      score: leaderboardScores.score,
      domain: leaderboardScores.domain,
      userId: leaderboardScores.userId,
    })
    .from(leaderboardScores)
    .innerJoin(users, eq(leaderboardScores.userId, users.id))
    .where(
      and(
        eq(leaderboardScores.leaderboardType, 'DOMAIN'),
        isNotNull(leaderboardScores.domain),
        isNotNull(users.username),
        ne(users.username, '')
      )
    );

  // Group by domain
  const domainGroups: { [key: string]: any[] } = {};
  for (const item of domainLeaderboard) {
    if (!domainGroups[item.domain!]) {
      domainGroups[item.domain!] = [];
    }
    domainGroups[item.domain!].push(item);
  }

  // Update ranks for each domain
  for (const domain in domainGroups) {
    await updateRanksAndNotify(
      domainGroups[domain],
      'DOMAIN',
      (item) => previousDomainRanks.find((p: { userId: string; domain: string | null; rank: number }) =>
        p.userId === item.userId && p.domain === domain
      )?.rank,
      () => `${domain} Domain`
    );
  }
};