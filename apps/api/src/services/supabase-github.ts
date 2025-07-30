import { createClient } from "@supabase/supabase-js";
import { Octokit } from "@octokit/rest";
import { logger } from "../lib/logger.js";
import pg from "pg";

interface SupabaseGitHubConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export class SupabaseGitHubService {
  private supabase: any = null;
  private config: SupabaseGitHubConfig | null = null;

  private initialize() {
    if (this.config && this.supabase) {
      return; // Already initialized
    }

    // Try using anon key first, then fall back to service role key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    this.config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseServiceKey: serviceKey || anonKey,
    };

    logger.info(
      `Using Supabase key: ${this.config.supabaseServiceKey ? "configured" : "missing"}`,
    );

    if (!this.config.supabaseUrl || !this.config.supabaseServiceKey) {
      logger.warn(
        "Supabase configuration not found - Supabase GitHub features will not work",
      );
      return;
    }

    this.supabase = createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceKey,
    );

    logger.info("Supabase GitHub service initialized");
  }

  /**
   * Get GitHub access token from Supabase session
   */
  async getGitHubTokenFromSession(
    customUserId: string,
  ): Promise<string | null> {
    try {
      this.initialize();

      if (!this.supabase) {
        logger.warn("Supabase not configured - cannot get GitHub token");
        return null;
      }

      logger.info(`Searching for GitHub token for user ID: ${customUserId}`);

      // Try Supabase API first, then fall back to direct database connection
      let data, error;

      try {
        const result = await this.supabase
          .from("Account")
          .select("accessToken")
          .eq("userId", customUserId)
          .eq("provider", "github")
          .single();

        data = result.data;
        error = result.error;
      } catch (e) {
        error = e;
      }

      if (error || !data?.accessToken) {
        logger.warn(
          `Supabase queries failed, trying direct PostgreSQL connection...`,
        );

        // Last resort: Direct PostgreSQL connection
        try {
          const directDbUrl =
            process.env.DIRECT_URL || process.env.DATABASE_URL;
          if (directDbUrl) {
            logger.info("Attempting direct PostgreSQL connection...");

            const { Client } = pg;
            const client = new Client({ connectionString: directDbUrl });

            await client.connect();

            const result = await client.query(
              'SELECT "accessToken" FROM "Account" WHERE "userId" = $1 AND "provider" = $2 LIMIT 1',
              [customUserId, "github"],
            );

            await client.end();

            if (result.rows.length > 0 && result.rows[0].accessToken) {
              logger.info(
                `Successfully found GitHub token via direct PostgreSQL connection`,
              );
              return result.rows[0].accessToken;
            } else {
              logger.warn(
                `No GitHub token found in direct PostgreSQL query for user ${customUserId}`,
              );
            }
          } else {
            logger.warn("No direct database URL configured");
          }
        } catch (e) {
          logger.error(`Direct PostgreSQL connection failed: ${e}`);
        }

        logger.warn(
          `No GitHub token found for user ${customUserId} after all attempts`,
        );
        return null;
      }

      const token = data.accessToken;
      logger.info(`Successfully found GitHub token for user ${customUserId}`);
      return token;
    } catch (error) {
      logger.error("Failed to get GitHub token from users table:", error);
      return null;
    }
  }

  /**
   * Get user's GitHub information using Supabase stored token
   */
  async getUserGitHubInfo(customUserId: string) {
    try {
      const token = await this.getGitHubTokenFromSession(customUserId);
      if (!token) {
        throw new Error("No GitHub token found for user");
      }

      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();

      logger.info(`Fetched GitHub info for user ${customUserId}`);
      return data;
    } catch (error) {
      logger.error(
        `Failed to get GitHub info for user ${customUserId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's repositories using Supabase stored token
   */
  async getUserRepositories(
    customUserId: string,
    options: {
      type?: "all" | "owner" | "member";
      sort?: "created" | "updated" | "pushed" | "full_name";
      direction?: "asc" | "desc";
      per_page?: number;
      page?: number;
    } = {},
  ) {
    try {
      const token = await this.getGitHubTokenFromSession(customUserId);
      if (!token) {
        throw new Error("No GitHub token found for user");
      }

      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        type: options.type || "owner",
        sort: options.sort || "updated",
        direction: options.direction || "desc",
        per_page: options.per_page || 100,
        page: options.page || 1,
      });

      logger.info(
        `Fetched ${data.length} repositories for user ${customUserId}`,
      );
      return data;
    } catch (error) {
      logger.error(
        `Failed to get repositories for user ${customUserId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(userId: string, owner: string, repo: string) {
    try {
      const token = await this.getGitHubTokenFromSession(userId);
      if (!token) {
        throw new Error("No GitHub token found for user");
      }

      const octokit = new Octokit({ auth: token });

      // Get repository info
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      // Get languages
      const { data: languages } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      // Get contributors
      let contributors: any[] = [];
      try {
        const { data: contributorData } =
          await octokit.rest.repos.listContributors({
            owner,
            repo,
            per_page: 10,
          });
        contributors = contributorData;
      } catch (error) {
        logger.warn(
          `Could not fetch contributors for ${owner}/${repo}:`,
          error,
        );
      }

      logger.info(`Fetched details for repository ${owner}/${repo}`);
      return {
        repository: repoData,
        languages,
        contributors,
      };
    } catch (error) {
      logger.error(
        `Failed to get repository details for ${owner}/${repo}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(
    userId: string,
    owner: string,
    repo: string,
    options: {
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    } = {},
  ) {
    try {
      const token = await this.getGitHubTokenFromSession(userId);
      if (!token) {
        throw new Error("No GitHub token found for user");
      }

      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        since: options.since,
        until: options.until,
        per_page: options.per_page || 100,
        page: options.page || 1,
      });

      logger.info(`Fetched ${data.length} commits for ${owner}/${repo}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get commits for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get Supabase auth user ID from custom user ID
   */
  async getSupabaseUserIdFromCustomId(
    customUserId: string,
  ): Promise<string | null> {
    try {
      this.initialize();

      if (!this.supabase) {
        logger.warn("Supabase not configured - cannot get user ID mapping");
        return null;
      }

      // Look up the user in your custom users table to get their supabaseId
      // Try different possible table structures
      let data, error;

      // First try the User table (with correct capitalization)
      const userResult = await this.supabase
        .from("User")
        .select("supabaseId, supabase_id")
        .eq("id", customUserId)
        .single();

      data = userResult.data;
      error = userResult.error;

      if (error || (!data?.supabaseId && !data?.supabase_id)) {
        logger.warn(
          `No Supabase ID found for custom user ${customUserId}:`,
          error,
        );
        return null;
      }

      // Return either supabaseId or supabase_id depending on your schema
      return data.supabaseId || data.supabase_id;
    } catch (error) {
      logger.error("Failed to get Supabase user ID mapping:", error);
      return null;
    }
  }

  /**
   * Check if user has GitHub connected
   */
  async hasGitHubConnected(userId: string): Promise<boolean> {
    try {
      const token = await this.getGitHubTokenFromSession(userId);
      return token !== null;
    } catch (error) {
      logger.error(
        `Failed to check GitHub connection for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Validate GitHub token for user
   */
  async validateUserGitHubToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getGitHubTokenFromSession(userId);
      if (!token) {
        return false;
      }

      const octokit = new Octokit({ auth: token });
      await octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      logger.warn(`GitHub token validation failed for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Debug method to get all identities for a user
   */
  async debugUserIdentities(userId: string) {
    try {
      this.initialize();

      if (!this.supabase) {
        return { error: "Supabase not configured" };
      }

      // Get all identities for this user
      const { data: identities, error } = await this.supabase
        .from("auth.identities")
        .select("*")
        .eq("user_id", userId);

      // Also check if there are any auth.users entries
      const { data: users, error: userError } = await this.supabase
        .from("auth.users")
        .select("*")
        .eq("id", userId);

      return {
        identities: identities || [],
        identitiesError: error,
        users: users || [],
        usersError: userError,
      };
    } catch (error) {
      logger.error("Failed to debug user identities:", error);
      return { error: error.message };
    }
  }
}

export const supabaseGitHubService = new SupabaseGitHubService();
