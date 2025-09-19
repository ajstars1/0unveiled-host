import { Router } from "express";
import { z } from "zod";
import { supabaseGitHubService } from "../services/supabase-github.js";

const router = Router();

// Validation schemas
const repositoryQuerySchema = z.object({
  type: z.enum(["all", "owner", "member"]).optional(),
  sort: z.enum(["created", "updated", "pushed", "full_name"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  per_page: z.coerce.number().min(1).max(100).optional(),
  page: z.coerce.number().min(1).optional(),
});

// ===== SUPABASE-BASED ROUTES =====

/**
 * GET /github/supabase/user/:userId
 * Get GitHub user info for authenticated user (via Supabase)
 */
router.get("/supabase/user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Check if user has GitHub connected
    const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
    if (!hasGitHub) {
      return res.status(404).json({
        success: false,
        error: "GitHub not connected for this user",
      });
    }

    const userInfo = await supabaseGitHubService.getUserGitHubInfo(userId);

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /github/supabase/repositories/:userId
 * Get user's repositories via Supabase
 */
router.get("/supabase/repositories/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const query = repositoryQuerySchema.parse(req.query);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Check if user has GitHub connected
    const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
    if (!hasGitHub) {
      return res.status(404).json({
        success: false,
        error: "GitHub not connected for this user",
      });
    }

    const repositories = await supabaseGitHubService.getUserRepositories(
      userId,
      query,
    );

    res.json({
      success: true,
      data: repositories,
      count: repositories.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /github/supabase/repositories/:userId/:owner/:repo
 * Get detailed repository information via Supabase
 */
router.get(
  "/supabase/repositories/:userId/:owner/:repo",
  async (req, res, next) => {
    try {
      const { userId, owner, repo } = req.params;

      if (!userId || !owner || !repo) {
        return res.status(400).json({
          success: false,
          error: "User ID, owner, and repository name are required",
        });
      }

      // Check if user has GitHub connected
      const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
      if (!hasGitHub) {
        return res.status(404).json({
          success: false,
          error: "GitHub not connected for this user",
        });
      }

      const repoDetails = await supabaseGitHubService.getRepositoryDetails(
        userId,
        owner,
        repo,
      );

      res.json({
        success: true,
        data: repoDetails,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /github/supabase/debug/:userId
 * Debug user's GitHub connection
 */
router.get("/supabase/debug/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Check raw connection status
    const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
    const token = await supabaseGitHubService.getGitHubTokenFromSession(userId);

    // Also get all identities to see what exists
    const debugInfo = await supabaseGitHubService.debugUserIdentities(userId);

    res.json({
      success: true,
      data: {
        userId,
        hasGitHub,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        identities: debugInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /github/supabase/status/:userId
 * Check GitHub connection status for user
 */
router.get("/supabase/status/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
    const isValid = hasGitHub
      ? await supabaseGitHubService.validateUserGitHubToken(userId)
      : false;

    res.json({
      success: true,
      data: {
        connected: hasGitHub,
        valid: isValid,
        status: hasGitHub ? (isValid ? "active" : "expired") : "disconnected",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /github/supabase/analyze/:userId/:owner/:repo
 * Analyze a specific repository using Supabase-stored GitHub token
 */
router.post(
  "/supabase/analyze/:userId/:owner/:repo",
  async (req, res, next) => {
    try {
      const { userId, owner, repo } = req.params;
      const { max_files } = req.body;

      if (!userId || !owner || !repo) {
        return res.status(400).json({
          success: false,
          error: "User ID, owner, and repository name are required",
        });
      }

      // Check if user has GitHub connected
      const hasGitHub = await supabaseGitHubService.hasGitHubConnected(userId);
      if (!hasGitHub) {
        return res.status(404).json({
          success: false,
          error: "GitHub not connected for this user",
        });
      }

      // Get GitHub token from Supabase
      const githubToken =
        await supabaseGitHubService.getGitHubTokenFromSession(userId);
      if (!githubToken) {
        return res.status(401).json({
          success: false,
          error: "No valid GitHub token found for user",
        });
      }

      // Call FastAPI analyzer service
      const analyzerServiceUrl =
        process.env.ANALYZER_SERVICE_URL || "http://localhost:8000";

      const analysisResponse = await fetch(
        `${analyzerServiceUrl}/api/auth/analyze-repository`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: githubToken,
            owner,
            repo,
            max_files: max_files || 200,
          }),
        },
      );

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse
          .json()
          .catch(() => ({ detail: "Analysis service unavailable" }));
        throw new Error(
          typeof errorData === "object" && errorData !== null && "detail" in errorData
            ? (errorData as { detail?: string }).detail || "Repository analysis failed"
            : "Repository analysis failed"
        );
      }

      const analysisData = await analysisResponse.json();

      res.json({
        success: true,
        data: analysisData,
      });
    } catch (error) {
      next(error);
    }
  },
);

export { router as githubRoutes };
