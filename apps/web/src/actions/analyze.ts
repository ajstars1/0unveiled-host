'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBySupabaseId, getUserByUserId } from "@/data/user";
import { fetchUserGithubRepos } from "@/actions/github";
import { db } from "@0unveiled/database";
import { accounts } from "@0unveiled/database";
import { eq, and } from "drizzle-orm";

interface RepositoryActionResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export async function getRepositoriesAction(userId: string): Promise<RepositoryActionResult> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Validate current user authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const currentDbUser = await getUserBySupabaseId(authUser.id);
    if (!currentDbUser) {
      return { success: false, error: 'Current user profile not found' };
    }

    // Get the target user
    const targetUser = await getUserByUserId(userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if target user has GitHub connected
    const githubAccount = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')))
      .limit(1);

    if (!githubAccount || githubAccount.length === 0) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not connected their GitHub account` 
      };
    }

    const githubAccountData = githubAccount[0];

    if (!githubAccountData?.installationId) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not completed GitHub App installation` 
      };
    }

    const installationId = parseInt(githubAccountData.installationId, 10);
    if (isNaN(installationId)) {
      return { 
        success: false, 
        error: 'Invalid GitHub App installation data for target user' 
      };
    }

    // Use the same GitHub App authentication logic as in fetchUserGithubRepos
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (!appId || !privateKey) {
      return { success: false, error: "Server configuration error: GitHub App credentials missing." };
    }

    // Authenticate as GitHub App Installation for the target user
    const { App } = await import("octokit");
    const app = new App({
      appId: appId,
      privateKey: privateKey,
    });

    const octokit = await app.getInstallationOctokit(installationId);

    // Fetch repositories using Installation Token
    const githubApiResponse = await octokit.request('GET /installation/repositories', {
      per_page: 100,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' },
    });

    const userRepos = githubApiResponse.data.repositories;

    // Format repositories to match the expected interface
    const formattedRepos = userRepos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      full_name: repo.full_name, // Use the full_name from GitHub API
      description: repo.description || '',
      html_url: repo.html_url,
      updated_at: repo.updated_at || new Date().toISOString(),
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      language: repo.language,
      topics: repo.topics || [],
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      isImported: false, // We can check this later if needed
      private: repo.private,
    }));

    return { 
      success: true, 
      data: formattedRepos 
    };

  } catch (error: any) {
    console.error('Error fetching repositories:', error);
    
    // Provide more specific error messages based on GitHub API errors
    if (error.status === 401) {
      return { success: false, error: "GitHub App authentication failed. Please try reconnecting GitHub." };
    } else if (error.status === 404) {
      return { success: false, error: "GitHub App installation not found. Please reinstall the GitHub App." };
    } else if (error.status === 403) {
      return { success: false, error: "GitHub App does not have permission to access repositories. Please check installation settings." };
    }
    
    return { 
      success: false, 
      error: `Failed to fetch repositories: ${error.message || 'Unknown error'}` 
    };
  }
}

export async function analyzeRepositoryAction(
  userId: string, 
  owner: string, 
  repoName: string,
  maxFiles: number = 50
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate current user authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const currentDbUser = await getUserBySupabaseId(authUser.id);
    if (!currentDbUser) {
      return { success: false, error: 'Current user profile not found' };
    }

    // Get the target user
    const targetUser = await getUserByUserId(userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if target user has GitHub connected
    const githubAccount = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')))
      .limit(1);

    if (!githubAccount || githubAccount.length === 0) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not connected their GitHub account` 
      };
    }

    const githubAccountData = githubAccount[0];

    if (!githubAccountData?.installationId) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not completed GitHub App installation` 
      };
    }

    const installationId = parseInt(githubAccountData.installationId, 10);
    if (isNaN(installationId)) {
      return { 
        success: false, 
        error: 'Invalid GitHub App installation data for target user' 
      };
    }

    // Use GitHub App authentication to get installation token
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (!appId || !privateKey) {
      return { success: false, error: "Server configuration error: GitHub App credentials missing." };
    }

    // Authenticate as GitHub App Installation for the target user
    const { App } = await import("octokit");
    const app = new App({
      appId: appId,
      privateKey: privateKey,
    });

    const octokit = await app.getInstallationOctokit(installationId);

    // Get the installation access token for the Python service
    const tokenResponse = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    // Call the Python FastAPI analyzer service
    const analyzerServiceUrl = process.env.ANALYZER_SERVICE_URL || 'http://localhost:8080';
    
    const analysisPayload = {
      access_token: tokenResponse.data.token,
      owner: owner,
      repo: repoName,
      max_files: maxFiles
    };

    console.log(`Calling analyzer service at ${analyzerServiceUrl}/api/auth/analyze-repository`);

    const response = await fetch(`${analyzerServiceUrl}/api/auth/analyze-repository`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(analysisPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Analyzer service error (${response.status}):`, errorText);
      
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'Analysis endpoint not found. Please check if the analyzer service is running properly.' 
        };
      } else if (response.status === 401 || response.status === 403) {
        return { 
          success: false, 
          error: 'GitHub access token is invalid or expired. Please reconnect your GitHub account.' 
        };
      } else {
        return { 
          success: false, 
          error: `Analysis service error: ${errorText || 'Unknown error'}` 
        };
      }
    }

    const analysisResult = await response.json();

    if (!analysisResult.success) {
      return { 
        success: false, 
        error: analysisResult.detail || 'Analysis failed' 
      };
    }

    // Return the comprehensive analysis data from the Python service
    return {
      success: true,
      data: analysisResult
    };

  } catch (error: any) {
    console.error(`Error analyzing repository ${owner}/${repoName}:`, error);
    
    // Handle network/connection errors
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Analyzer service is not available. Please try again later.'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}
