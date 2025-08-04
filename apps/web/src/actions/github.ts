"use server"

import { db } from "@0unveiled/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBySupabaseId } from "@/data/user";
import { accounts, showcasedItems } from "@0unveiled/database";
import { eq, and } from "drizzle-orm";
import { Octokit, App } from "octokit";
import { RequestParameters } from "@octokit/types";

// Interface matching the frontend component's expectation
interface GithubRepoFrontend {
  id: string // GitHub repo ID
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
  isImported?: boolean
  private: boolean
}

/**
 * Fetches the authenticated user's GitHub repositories using GitHub App Installation Auth.
 */
export const fetchUserGithubRepos = async (): Promise<{ error?: string; data?: GithubRepoFrontend[] }> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.error("fetchUserGithubRepos Auth Error:", authError);
    return { error: "Unauthorized: Could not get user session." };
  }

  const dbUser = await getUserBySupabaseId(authUser.id);
  if (!dbUser) {
    return { error: "Unauthorized: User profile not found." };
  }

  // --- Get GitHub App Installation Details ---
  const githubAccounts = await db.select().from(accounts)
    .where(and(eq(accounts.userId, dbUser.id), eq(accounts.provider, 'github')));
  const githubAccount = githubAccounts[0];

  if (!githubAccount?.installationId) {
    return { error: "GitHub App not installed or not linked. Please connect GitHub via profile settings." };
  }
  const installationId = parseInt(githubAccount.installationId, 10);
  if (isNaN(installationId)) {
    console.error(`Invalid installationId found for user ${dbUser.id}: ${githubAccount.installationId}`);
    return { error: "Invalid GitHub App installation data." };
  }

  // --- Get GitHub App Credentials from Env ---
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\n/g, '\n');

  if (!appId || !privateKey) {
    console.error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY environment variables.");
    return { error: "Server configuration error: GitHub App credentials missing." };
  }

  try {
    // --- Authenticate as GitHub App Installation ---
    const app = new App({
      appId: appId,
      privateKey: privateKey,
    });

    const octokit = await app.getInstallationOctokit(installationId);

    // --- Fetch Repositories using Installation Token ---
    const githubApiResponse = await octokit.request('GET /installation/repositories', {
      per_page: 100,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' },
    });

    const userRepos = githubApiResponse.data.repositories;

    // --- Format Repositories (similar to before) ---
    const importedItems = await db.select({ externalId: showcasedItems.externalId })
      .from(showcasedItems)
      .where(and(
        eq(showcasedItems.userId, dbUser.id),
        eq(showcasedItems.provider, "GITHUB")
      ));
    const importedRepoIds = new Set(importedItems.map(item => item.externalId));

    const formattedRepos: GithubRepoFrontend[] = userRepos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
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
      isImported: importedRepoIds.has(repo.id.toString()),
      private: repo.private,
    }));

    return { data: formattedRepos };

  } catch (error: any) {
    console.error("Error fetching GitHub repos via App Installation:", error);
    if (error.status === 401) {
      return { error: "GitHub App authentication failed (401). Please try reconnecting GitHub." };
    } else if (error.status === 404) {
      return { error: "GitHub App installation not found (404). Please try reconnecting GitHub." };
    } else if (error.status === 403) {
      return { error: "GitHub App does not have permission to access repositories (403). Please check installation settings." };
    }
    return { error: `Failed to fetch repositories from GitHub: ${error.message}` };
  }
};

/**
 * Initiates the GitHub OAuth flow for connecting a GitHub account.
 */
export const initiateGithubOAuth = async (): Promise<{ error?: string; redirectUrl?: string }> => {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback/github`,
        scopes: 'repo read:user user:email'
      }
    });

    if (error) throw error;
    
    if (!data?.url) {
      return { error: "Failed to generate GitHub authorization URL" };
    }
    
    return { redirectUrl: data.url };
  } catch (error: any) {
    console.error("Error initiating GitHub OAuth:", error);
    return { error: error.message || "Failed to initiate GitHub connection" };
  }
};

/**
 * Exchanges the GitHub OAuth code for an access token and saves it.
 * Called from the API callback route (potentially still used by Supabase flow).
 */
export const saveGithubToken = async (code: string, userId: string): Promise<{ success?: boolean; error?: string }> => {
  // For Supabase OAuth flow, we don't need to manually exchange the code
  // Supabase handles this for us in the auth callback
  
  try {
    // Verify user exists in database
    // Drizzle: select user by supabaseId
    const dbUsers = await db.select().from(accounts)
      .where(and(eq(accounts.provider, 'github'), eq(accounts.userId, userId)));
    const dbUser = dbUsers[0];

    if (!dbUser) {
      console.error(`GitHub OAuth Error: Drizzle user with Supabase ID ${userId} not found.`);
      return { error: "User profile not found. Please ensure you are fully signed up/logged in before connecting GitHub." };
    }

    // Get the GitHub account from the supabaseId
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { error: "Could not verify authentication status." };
    }
    
    // Find GitHub identity in user's identities
    const githubIdentity = authUser.identities?.find(identity => 
      identity.provider === 'github'
    );
    
    if (!githubIdentity) {
      return { error: "GitHub identity not found in user account. The OAuth connection may have failed." };
    }

    // Manual upsert: check if account exists, then update or insert
    const existingAccounts = await db.select().from(accounts)
      .where(and(
        eq(accounts.provider, 'github'),
        eq(accounts.providerAccountId, githubIdentity.id)
      ));
    if (existingAccounts.length > 0) {
      // Update
      await db.update(accounts)
        .set({ userId: dbUser.userId })
        .where(and(
          eq(accounts.provider, 'github'),
          eq(accounts.providerAccountId, githubIdentity.id)
        ));
    } else {
      // Insert
      await db.insert(accounts).values({
        userId: dbUser.userId,
        provider: 'github',
        providerAccountId: githubIdentity.id,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        scope: null,
        tokenType: null,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error processing GitHub OAuth:", error);
    return { error: `An unexpected error occurred during GitHub authentication: ${error.message}` };
  }
};

/**
 * Imports selected GitHub repositories as ShowcasedItems.
 */
export const importUserGithubRepos = async (repoIds: string[]): Promise<{ success?: boolean; error?: string }> => {
  // --- Get Authenticated User ---
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) return { error: "Unauthorized" };
  const dbUser = await getUserBySupabaseId(authUser.id);
  if (!dbUser) return { error: "User profile not found." };

  // --- Get GitHub App Installation Details ---
  const githubAccounts = await db.select().from(accounts)
    .where(and(eq(accounts.userId, dbUser.id), eq(accounts.provider, 'github')));
  const githubAccount = githubAccounts[0];
  if (!githubAccount?.installationId) {
    return { error: "GitHub App not installed or linked. Please connect GitHub." };
  }
  const installationId = parseInt(githubAccount.installationId, 10);
  if (isNaN(installationId)) {
    return { error: "Invalid GitHub App installation data." };
  }

  // --- Get GitHub App Credentials from Env ---
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\n/g, '\n');
  if (!appId || !privateKey) {
    console.error("Missing GitHub App credentials for import.");
    return { error: "Server configuration error: Cannot import repos." };
  }

  let octokit: Octokit;
  try {
    // --- Authenticate as GitHub App Installation ---
    const app = new App({
      appId: appId,
      privateKey: privateKey,
    });
    octokit = await app.getInstallationOctokit(installationId);
  } catch (authError: any) {
    console.error("Error authenticating GitHub App for import:", authError);
    return { error: `GitHub App authentication failed: ${authError.message}` };
  }

  // --- Import Logic (using installation-authenticated octokit) ---
  const errors: string[] = [];

  for (const repoId of repoIds) {
    try {
      // Fetch main repo details using the installation token
      const { data: repo } = await octokit.request('GET /repositories/{repo_id}', {
        repo_id: parseInt(repoId, 10),
        headers: { 'X-GitHub-Api-Version': '2022-11-28' },
      });

      // --- Fetch additional data (using the same installation token) ---
      let languages: Record<string, number> = {};
      let commitCount: number | null = null; 

      // Fetch repo languages
      try {
        const langResponse = await octokit.request('GET /repositories/{repo_id}/languages', {
          repo_id: repo.id, 
          headers: { 'X-GitHub-Api-Version': '2022-11-28' },
        });
        languages = langResponse.data;
      } catch (langError: any) {
        console.warn(`Could not fetch languages for repo ID ${repoId} (${repo.name}):`, langError.message);
      }

      // Fetch repo commits 
      try {
        const commitResponse = await octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner: repo.owner.login,
          repo: repo.name,
          per_page: 100, 
          headers: { 'X-GitHub-Api-Version': '2022-11-28' },
        });
        commitCount = commitResponse.data.length;
      } catch (commitError: any) {
        console.warn(`Could not fetch commits for repo ID ${repoId} (${repo.name}):`, commitError.message);
      }

      // Prepare metadata
      const metadata: any = {
        languages: languages,
        homepage: repo.homepage || null, 
        language: repo.language, 
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        topics: repo.topics,
        ownerLogin: repo.owner.login,
        ownerAvatarUrl: repo.owner.avatar_url,
        private: repo.private,
        commitCount: commitCount, 
      };

      // Manual upsert for showcasedItems
      const existing = await db.select().from(showcasedItems)
        .where(and(
          eq(showcasedItems.userId, dbUser.id),
          eq(showcasedItems.provider, "GITHUB"),
          eq(showcasedItems.externalId, repo.id.toString())
        ));
      if (existing.length > 0) {
        // Update
        await db.update(showcasedItems)
          .set({
            title: repo.name,
            description: repo.description || null,
            url: repo.html_url,
            imageUrl: repo.owner.avatar_url || null,
            metadata: metadata,
            lastSyncedAt: new Date(),
          })
          .where(and(
            eq(showcasedItems.userId, dbUser.id),
            eq(showcasedItems.provider, "GITHUB"),
            eq(showcasedItems.externalId, repo.id.toString())
          ));
      } else {
        // Insert
        await db.insert(showcasedItems).values({
          userId: dbUser.id,
          provider: "GITHUB",
          externalId: repo.id.toString(),
          title: repo.name,
          description: repo.description || null,
          url: repo.html_url,
          imageUrl: repo.owner.avatar_url || null,
          metadata: metadata,
          showcasedAt: new Date(),
          lastSyncedAt: new Date(),
        });
      }
    } catch (error: any) {
      console.error(`Failed to import repo ID ${repoId}:`, error);
      errors.push(`Repo ID ${repoId}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Failed to import ${errors.length} out of ${repoIds.length} repositories. Errors: ${errors.join(', ')}`;
    return { success: repoIds.length > errors.length, error: errorMessage };
  }

  return { success: true };
};

/**
 * Disconnects the user's GitHub account by deleting the Account record.
 */
export const disconnectUserGithub = async (): Promise<{ success?: boolean; error?: string }> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) return { error: "Unauthorized" };
  const dbUser = await getUserBySupabaseId(authUser.id);
  if (!dbUser) return { error: "User profile not found." };

  try {
    // Get all accounts for the user
    const userAccounts = await db.select().from(accounts)
      .where(eq(accounts.userId, dbUser.id));

    // Check if the user has a password set (check for 'email' provider in identities)
    const hasPassword = authUser.identities?.some(id => id.provider === 'email');

    // Find the GitHub account to potentially disconnect
    const githubAccount = userAccounts.find((acc: any) => acc.provider === 'github');

    if (!githubAccount) {
      return { error: "GitHub account not found or already disconnected." };
    }

    // Prevent disconnection if GitHub is the only linked account AND no password is set
    if (userAccounts.length === 1 && userAccounts[0].provider === 'github' && !hasPassword) {
      return { error: "Cannot disconnect GitHub as it is your only login method. Please add another login method (like Google) or set a password first." };
    }

    // Delete the GitHub account
    await db.delete(accounts)
      .where(eq(accounts.id, githubAccount.id));

    // Optionally: Also delete related ShowcasedItems if desired

    return { success: true };
  } catch (error: any) {
    console.error("Error disconnecting GitHub account:", error);
    return { error: `Failed to disconnect GitHub account: ${error.message}` };
  }
};

/**
 * Returns the URL for installing the GitHub App.
 */
export const getGithubAppInstallationUrl = async (): Promise<{ error?: string; redirectUrl?: string }> => {
  const installationUrl = "https://github.com/apps/0unveiled-github-sync/installations/new";
  return { redirectUrl: installationUrl };
};

/**
 * Saves the GitHub App installation ID to the user's GitHub Account record.
 */
export const saveGithubInstallation = async (
  installationId: string,
  setupAction: string | null
): Promise<{ success?: boolean; error?: string }> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { error: "Unauthorized: Could not get user session for saving installation." };
  }

  const dbUser = await getUserBySupabaseId(authUser.id);
  if (!dbUser) {
    return { error: "User profile not found." };
  }

  try {
    // Find GitHub account
    const githubAccounts = await db.select().from(accounts)
      .where(and(eq(accounts.userId, dbUser.id), eq(accounts.provider, 'github')));
    const githubAccount = githubAccounts[0];

    if (githubAccount) {
      await db.update(accounts)
        .set({
          installationId: installationId.toString(),
        })
        .where(eq(accounts.id, githubAccount.id));
      return { success: true };
    } else {
      // Create a basic account record to store the installation ID
      await db.insert(accounts).values({
        userId: dbUser.id,
        provider: 'github',
        providerAccountId: `installation_${installationId}`,
        installationId: installationId.toString(),
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        scope: `setup_action:${setupAction || 'unknown'}`,
        tokenType: null,
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("Error saving GitHub App installation ID:", error);
    return { error: `Failed to save GitHub installation details: ${error.message}` };
  }
};

/**
 * Fetches and combines relevant code files from a GitHub repo using Octokit (App Installation Auth).
 * @param repoFullName e.g. "owner/repo"
 * @param userId the internal user ID (for finding installation)
 */
export async function getRepoCodeContents(repoFullName: string, userId: string): Promise<{ code: string } | { error: string }> {
  try {
    // 1. Find the user's GitHub App installation
    const githubAccounts = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')));
    const githubAccount = githubAccounts[0];
    if (!githubAccount?.installationId) {
      return { error: "GitHub App not installed or linked. Please connect GitHub." };
    }
    const installationId = parseInt(githubAccount.installationId, 10);
    if (isNaN(installationId)) {
      return { error: "Invalid GitHub App installation data." };
    }
    // 2. Get App credentials
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!appId || !privateKey) {
      return { error: "Server configuration error: GitHub App credentials missing." };
    }
    // 3. Authenticate as installation
    const app = new App({ appId, privateKey });
    const octokit = await app.getInstallationOctokit(installationId);
    // 4. Get repo details (to get default branch)
    const [owner, repo] = repoFullName.split("/");
    const repoResp = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
    const defaultBranch = repoResp.data.default_branch;
    // 5. Get file tree for default branch
    const treeResp = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      owner, repo, tree_sha: defaultBranch, recursive: '1'
    });
    const tree = treeResp.data.tree;
    // 6. Filter relevant files
    const filesToFetch = tree.filter((file: any) =>
      file.type === 'blob' && (
        /\.(js|jsx|ts|tsx|py|go|java|rb|php|md|json|html|css|scss|yml|yaml)$/i.test(file.path) ||
        /(dockerfile|readme|license)/i.test(file.path)
      )
    ).slice(0, 25);
    if (filesToFetch.length === 0) {
      console.warn(`[getRepoCodeContents] No relevant code files found in tree for ${repoFullName}`);
      return { error: "No relevant code files were found to analyze in this repository." };
    }
    // 7. Fetch and decode file contents
    const fileContents = await Promise.all(filesToFetch.map(async (file: any) => {
      try {
        const fileResp = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner, repo, path: file.path
        });
        const fileDataArr = Array.isArray(fileResp.data) ? fileResp.data : [fileResp.data];
        for (const fileData of fileDataArr) {
          if (fileData && typeof fileData === 'object' && 'content' in fileData && fileData.content) {
            const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
            return `\n\n--- FILE: ${file.path} ---\n\n${decoded}`;
          }
        }
        console.warn(`[getRepoCodeContents] No content found for file: ${file.path}`);
      } catch (e) {
        return `// Error fetching ${file.path}`;
      }
      return '';
    }));
    const combinedCode = fileContents.join('');
    return { code: combinedCode };
  } catch (error: any) {
    return { error: `Failed to fetch repo code: ${error.message}` };
  }
}