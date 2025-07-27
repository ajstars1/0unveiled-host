"use server"

import { db } from "@/lib/drizzle"
import { showcasedItems, skills, showcasedItemSkills, accounts } from "@0unveiled/database"
import { eq, and } from "drizzle-orm"

// Type for GitHub repo data
interface GithubRepoDataType {
  id: string
  name: string
  description: string | null
  html_url: string
  languages_url: string
  languages?: Record<string, number>
}

// Type for GitHub file content
interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  content?: string;
}

/**
 * Fetches code content from a GitHub repository
 * @param repoFullName - The full repository name (e.g., "username/repo")
 * @param userId - The user ID for authentication
 * @returns Object containing code content or error
 */
export const getRepoCodeContents = async (
  repoFullName: string,
  userId: string
): Promise<{ code: string } | { error: string }> => {
  try {
    // Get user's GitHub access token
    const githubAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.provider, 'github')
      ),
    });

    if (!githubAccount || !githubAccount.accessToken) {
      return { error: "GitHub account not connected or access token not found." };
    }

    // Fetch repository files from GitHub API
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/main?recursive=1`, {
      headers: {
        Authorization: `Bearer ${githubAccount.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      return { error: `Failed to fetch repository structure: ${response.statusText}` };
    }

    const treeData = await response.json();
    const files = treeData.tree.filter((item: any) => item.type === 'blob' && item.path.endsWith('.js') || item.path.endsWith('.ts') || item.path.endsWith('.jsx') || item.path.endsWith('.tsx'));

    if (files.length === 0) {
      return { error: "No code files found in the repository." };
    }

    // Fetch content for each file
    const fileContents = await Promise.all(
      files.slice(0, 10).map(async (file: any) => {
        const contentResponse = await fetch(file.url, {
          headers: {
            Authorization: `Bearer ${githubAccount.accessToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          return {
            path: file.path,
            content: Buffer.from(contentData.content, 'base64').toString('utf-8')
          };
        }
        return null;
      })
    );

    const validContents = fileContents.filter(Boolean);
    const combinedCode = validContents.map((file: any) => `// ${file.path}\n${file.content}`).join('\n\n');

    return { code: combinedCode };

  } catch (error) {
    console.error("Error fetching GitHub repo code:", error);
    return { error: "Failed to fetch repository code." };
  }
}

/**
 * Fetches user's GitHub repositories
 * @param userId - The user ID
 * @returns Object containing repositories or error
 */
export const fetchUserGithubRepos = async (userId: string) => {
  try {
    // Find the user's GitHub account record to get the access token
    const githubAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.provider, 'github')
      ),
    });

    // If no token is found, the user hasn't connected their GitHub account
    if (!githubAccount || !githubAccount.accessToken) {
      return { connected: false, repos: [] };
    }

    // Use the access token to fetch repositories from the GitHub API
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
      headers: {
        Authorization: `Bearer ${githubAccount.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch GitHub repos:", await response.text());
      return { connected: true, repos: [], error: "Failed to fetch repositories from GitHub. You may need to reconnect your account." };
    }

    const repos = await response.json();
    return { connected: true, repos: repos };

  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { connected: false, repos: [], error: "A server error occurred." };
  }
}

/**
 * Imports a GitHub repository as a showcased item
 * @param repoData - GitHub repository data
 * @param userId - The user ID
 * @returns Object containing the created showcased item or error
 */
export const importGithubShowcasedItem = async (
  repoData: GithubRepoDataType,
  userId: string
) => {
  try {
    // Create the showcased item
    const [showcasedItem] = await db.insert(showcasedItems).values({
      userId,
      title: repoData.name,
      description: repoData.description,
      url: repoData.html_url,
      provider: 'GITHUB',
      externalId: repoData.id.toString(),
      roleInItem: "Developer", // Default role
    }).returning();

    // Process languages as skills
    if (repoData.languages) {
      for (const language of Object.keys(repoData.languages)) {
        // Find or create the skill
        let skill = await db.query.skills.findFirst({
          where: eq(skills.name, language)
        });

        if (!skill) {
          const [newSkill] = await db.insert(skills).values({
            name: language
          }).returning();
          skill = newSkill;
        }

        // Connect skill to showcased item
        await db.insert(showcasedItemSkills).values({
          showcasedItemId: showcasedItem.id,
          skillId: skill.id,
        });
      }
    }

    // Fetch the complete item with skills
    const completeItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, showcasedItem.id),
      with: {
        skills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return completeItem;
  } catch (error) {
    console.error("Error importing GitHub showcased item:", error);
    return { error: "Failed to import GitHub repository." };
  }
}