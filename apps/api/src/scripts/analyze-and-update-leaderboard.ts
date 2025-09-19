import { db } from "@0unveiled/database";
import { showcasedItems, users, accounts } from "@0unveiled/database";
import { eq, isNull, or, lt, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { updateLeaderboards } from "../services/leaderboard-service.js";

const ANALYZER_API_URL = "http://localhost:8000";

interface AnalysisResult {
  ai_insights?: { overall_quality_score: number };
  security?: { security_score: number };
  quality?: { test_files_count: number };
  repository?: {
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
  };
}

async function analyzeRepository(repoUrl: string, userToken: string): Promise<AnalysisResult | null> {
  try {
    // Extract owner/repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) {
      logger.warn(`Could not parse GitHub URL: ${repoUrl}`);
      return null;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, ""); // Remove .git suffix

    logger.info(`Analyzing ${owner}/${cleanRepo}...`);

    const response = await fetch(`${ANALYZER_API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner,
        repo: cleanRepo,
        access_token: userToken,
      }),
    });

    if (!response.ok) {
      logger.error(`Analysis failed for ${owner}/${cleanRepo}: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json() as AnalysisResult;
    logger.info(`✅ Successfully analyzed ${owner}/${cleanRepo}`);
    return result;

  } catch (error) {
    logger.error(`Error analyzing repository ${repoUrl}:`, error);
    return null;
  }
}

async function analyzeAndUpdateLeaderboard() {
  logger.info("🚀 Starting repository analysis and leaderboard update...");

  try {
    // Check if FastAPI service is running
    const healthCheck = await fetch(`${ANALYZER_API_URL}/health`);
    if (!healthCheck.ok) {
      logger.error("FastAPI analyzer service is not running on http://localhost:8000");
      logger.info("Please start it with: cd apps/github-analyzer-service && python run.py");
      return;
    }

    // Get repositories that need analysis along with user GitHub tokens
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const reposNeedingAnalysis = await db
      .select({
        id: showcasedItems.id,
        title: showcasedItems.title,
        url: showcasedItems.url,
        metadata: showcasedItems.metadata,
        userId: showcasedItems.userId,
        accessToken: accounts.accessToken,
      })
      .from(showcasedItems)
      .innerJoin(users, eq(showcasedItems.userId, users.id))
      .innerJoin(accounts, and(
        eq(accounts.userId, users.id),
        eq(accounts.provider, "github")
      ))
      .where(
        or(
          isNull(showcasedItems.lastSyncedAt),
          lt(showcasedItems.lastSyncedAt, cutoffDate)
        )
      );

    logger.info(`Found ${reposNeedingAnalysis.length} repositories needing analysis`);

    let analyzedCount = 0;
    let failedCount = 0;
    let noTokenCount = 0;

    for (const item of reposNeedingAnalysis) {
      if (!item.url) {
        logger.warn(`Skipping item ${item.title} - no URL`);
        continue;
      }

      if (!item.accessToken) {
        logger.warn(`Skipping item ${item.title} - no GitHub access token for user`);
        noTokenCount++;
        continue;
      }

      const analysisResult = await analyzeRepository(item.url, item.accessToken);
      
      if (analysisResult) {
        // Merge analysis results with existing metadata
        const updatedMetadata = {
          ...(item.metadata as any),
          ...analysisResult,
        };

        await db
          .update(showcasedItems)
          .set({
            metadata: updatedMetadata,
            lastSyncedAt: new Date(),
          })
          .where(eq(showcasedItems.id, item.id));

        analyzedCount++;
        logger.info(`Updated ${item.title} with analysis data`);
      } else {
        failedCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`Analysis complete: ${analyzedCount} successful, ${failedCount} failed, ${noTokenCount} no token`);

    if (analyzedCount > 0) {
      logger.info("Updating leaderboard scores...");
      await updateLeaderboards();
      logger.info("✅ Leaderboard scores updated successfully!");
    } else {
      logger.warn("No repositories were analyzed, skipping leaderboard update");
    }

  } catch (error) {
    logger.error("Error in analysis process:", error);
  }
}

// Run the script
analyzeAndUpdateLeaderboard()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error("Script failed:", error);
    process.exit(1);
  });

export { analyzeAndUpdateLeaderboard };