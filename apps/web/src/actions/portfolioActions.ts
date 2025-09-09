"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { cookies } from "next/headers"
// import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { db } from "@/lib/drizzle"
import { 
  showcasedItems, 
  skills, 
  accounts,
  users,
  experience,
  education,
  type ShowcasedItem,
  type Skill
} from "@0unveiled/database"
import { eq, and, desc, asc } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBySupabaseId, getUserByUsername } from "@/data/user"
import { getRepoCodeContents } from "@/actions/github"

// Type for GitHub repo data
interface GithubRepoDataType {
  id: string
  name: string
  description: string | null
  html_url: string
  languages_url: string
  languages?: Record<string, number>
}

// define a type for the data we expect from the github API file content endpoint
interface GitHubFile {
  path: string;
  type: 'blob' | 'tree'; // 'blob' for files and 'tree' for directories
  content?: string;
}

export async function fetchRepoCode(repo: any, username?: string): Promise<{ code: string } | { error: string }> {
  console.log(`Starting code fetch for: ${repo}`);
  const repoFullName = repo;
  let userId: string | undefined;
  try {
    if (!username) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return { error: "User not authenticated." };
      const dbUser = await getUserBySupabaseId(user.id);
      if (!dbUser) return { error: "User not found in database." };
      userId = dbUser.id;
    } else {
      const user = await getUserByUsername(username);
      userId = user?.id;
      if (!user) return { error: "User not found." };
    }
    // Use github.ts action instead of fetch API
    const result = await getRepoCodeContents(repoFullName, userId!);
    if ("error" in result) return { error: result.error };
    return { code: result.code };
  } catch (error) {
    console.error(`Error in fetchRepoCode for ${repoFullName}:`, error);
    return { error: "An unexpected error occurred while fetching repository code." };
  }
}

// yype for showcasedItem with skills
export type ShowcasedItemWithSkills = {
  id: string
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  provider: string
  roleInItem: string | null
  isPinned: boolean
  externalId: string;
  skills: { id: string; name: string }[]
}

// Helper to get current user ID
async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user.id
}

// Add a portfolio item manually
export async function addPortfolioItem(formData: FormData) {
  try {
    const userId = await getCurrentUserId()

    const title = formData.get("title") as string
    const roleInItem = formData.get("roleInItem") as string
    const description = formData.get("description") as string
    const url = (formData.get("url") as string) || "#"
    const imageUrl = (formData.get("imageUrl") as string) || null
    const skillsInput = formData.get("skills") as string

    if (!title || !roleInItem || !description) {
      return { error: "Missing required fields" }
    }

    // Parse skills from JSON string
    const skillNames = JSON.parse(skillsInput) as string[]

    // Create the showcased item
    const [showcasedItem] = await db.insert(showcasedItems).values({
      userId,
      title,
      roleInItem,
      description,
      url,
      imageUrl,
      provider: 'CUSTOM',
      externalId: `custom-${Date.now()}`,
    }).returning();

    // Process skills - since skills relation was removed, we'll skip this
    // TODO: If skills functionality is needed, implement a different approach

    // Fetch the complete item (without skills since relation was removed)
    const completeItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, showcasedItem.id),
    });

    // Revalidate paths and tags
    revalidatePath("/benchmark/add-projects")
    revalidateTag('user-benchmark')
    // Invalidate leaderboard caches for this user
    revalidateTag(`leaderboard:user:${userId}`)
    revalidateTag(`leaderboard:rank:${userId}:GENERAL::`)
    // Invalidate general leaderboard caches
    revalidateTag('leaderboard:type:GENERAL:::50')
    revalidateTag('leaderboard:type:GENERAL:::100')
    return completeItem
  } catch (error) {
    console.error("Error adding portfolio item:", error)
    return { error: "Failed to add portfolio item" }
  }
}

// Import a GitHub repository as a showcased item
export async function importGithubShowcasedItem(repoData: GithubRepoDataType) {
  try {
    const userId = await getCurrentUserId()

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

    // Process languages as skills - since skills relation was removed, we'll skip this
    // TODO: If skills functionality is needed, implement a different approach

    // Fetch the complete item (without skills since relation was removed)
    const completeItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, showcasedItem.id),
    });

    // Revalidate paths and tags
    revalidatePath("/benchmark/add-projects")
    revalidateTag('user-benchmark')
    // Invalidate leaderboard caches for this user
    revalidateTag(`leaderboard:user:${userId}`)
    revalidateTag(`leaderboard:rank:${userId}:GENERAL::`)
    // Invalidate general leaderboard caches
    revalidateTag('leaderboard:type:GENERAL:::50')
    revalidateTag('leaderboard:type:GENERAL:::100')
    return completeItem
  } catch (error) {
    console.error("Error importing GitHub showcased item:", error)
    return { error: "Failed to import GitHub repository" }
  }
}

// Update a portfolio item
export async function updatePortfolioItem(itemId: string, formData: FormData) {
  try {
    const userId = await getCurrentUserId()

    // Check if the item belongs to the user
    const existingItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, itemId),
    });

    if (!existingItem) {
      return { error: "Item not found" }
    }

    if (existingItem.userId !== userId) {
      return { error: "Not authorized to update this item" }
    }

    const title = formData.get("title") as string
    const roleInItem = formData.get("roleInItem") as string
    const description = formData.get("description") as string
    const url = (formData.get("url") as string) || "#"
    const imageUrl = (formData.get("imageUrl") as string) || null
    const isPinned = formData.get("isPinned") === "true"
    const skillsInput = formData.get("skills") as string

    if (!title || !roleInItem || !description) {
      return { error: "Missing required fields" }
    }

    // Parse skills from JSON string
    const skillNames = JSON.parse(skillsInput) as string[]

    // Update the showcased item
    const [updatedItem] = await db.update(showcasedItems)
      .set({
        title,
        roleInItem,
        description,
        url,
        imageUrl,
        isPinned,
      })
      .where(eq(showcasedItems.id, itemId))
      .returning();

    // Remove existing skill connections - since skills relation was removed, we'll skip this
    // TODO: If skills functionality is needed, implement a different approach

    // Process skills - since skills relation was removed, we'll skip this
    // TODO: If skills functionality is needed, implement a different approach

    // Fetch the complete item (without skills since relation was removed)
    const completeItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, itemId),
    });

    // Revalidate paths and tags
    revalidatePath("/benchmark/add-projects")
    revalidateTag('user-benchmark')
    // Invalidate leaderboard caches for this user
    revalidateTag(`leaderboard:user:${userId}`)
    revalidateTag(`leaderboard:rank:${userId}:GENERAL::`)
    // Invalidate general leaderboard caches
    revalidateTag('leaderboard:type:GENERAL:::50')
    revalidateTag('leaderboard:type:GENERAL:::100')
    return completeItem
  } catch (error) {
    console.error("Error updating portfolio item:", error)
    return { error: "Failed to update portfolio item" }
  }
}

// Delete a portfolio item
export async function deletePortfolioItem(itemId: string) {
  try {
    const userId = await getCurrentUserId()

    // Check if the item belongs to the user
    const existingItem = await db.query.showcasedItems.findFirst({
      where: eq(showcasedItems.id, itemId)
    });

    if (!existingItem) {
      return { error: "Item not found" }
    }

    if (existingItem.userId !== userId) {
      return { error: "Not authorized to delete this item" }
    }

    // Delete the item
    await db.delete(showcasedItems)
      .where(eq(showcasedItems.id, itemId));

    // Revalidate paths and tags
    revalidatePath("/benchmark/add-projects")
    revalidateTag('user-benchmark')
    // Invalidate leaderboard caches for this user
    revalidateTag(`leaderboard:user:${userId}`)
    revalidateTag(`leaderboard:rank:${userId}:GENERAL::`)
    // Invalidate general leaderboard caches
    revalidateTag('leaderboard:type:GENERAL:::50')
    revalidateTag('leaderboard:type:GENERAL:::100')
    return { success: true }
  } catch (error) {
    console.error("Error deleting portfolio item:", error)
    return { error: "Failed to delete portfolio item" }
  }
}

// fetch user portfolio items for benchmark
export async function fetchUserPortfolioForBenchmark(limit = 4) {
  try {

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return { error: "User not authenticated." };
    }
    const dbUser = await getUserBySupabaseId(user.id);
    if (!dbUser) {
      return { error: "User not found in database." };
    }
    if (!dbUser.username) {
      return { error: "User does not have a username set." };
    }
    const userId = dbUser.id;

    const items = await db.query.showcasedItems.findMany({
      where: eq(showcasedItems.userId, userId),
      orderBy: [
        desc(showcasedItems.isPinned),
        asc(showcasedItems.order),
        desc(showcasedItems.showcasedAt)
      ],
      limit: limit,
    });

    return items
  } catch (error) {
    console.error("Error fetching portfolio:", error)
    return []
  }
}

// Fetch public user profile
export async function fetchPublicUserProfile(username: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        bio: true,
        headline: true,
        location: true,
        websiteUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
      },
      with: {
        experience: {
          orderBy: desc(experience.startDate),
        },
        education: {
          orderBy: desc(education.startDate),
        },
      },
    });

    if (!user) {
      return { user: null, showcasedItems: [], experience: [], education: [] }
    }

    const userShowcasedItems = await db.query.showcasedItems.findMany({
      where: eq(showcasedItems.userId, user.id),
      orderBy: [
        desc(showcasedItems.isPinned),
        asc(showcasedItems.order),
        desc(showcasedItems.showcasedAt)
      ],
    });

    return {
      user: {
        ...user,
      },
      showcasedItems: userShowcasedItems,
    }
  } catch (error) {
    console.error("Error fetching public profile:", error)
    return { user: null, showcasedItems: [], experience: [], education: [] }
  }
}

// server action for fetching username
export async function getCurrentAuthenticatedUserUsername(): Promise<{ username: string | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user:currentUser } } = await supabase.auth.getUser();
    console.log("Current user:", currentUser);
    if (!currentUser?.id) {
      return { username: null, error: "User not authenticated." };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, currentUser.id),
      columns: {
        username: true
      }
    });

    if (!user) {
      return { username: null, error: "User not found" };
    }
    if (!user.username) {
      return { username: null, error: "Username not set for this user. Please update your profile." };
    }

    return { username: user.username };
  } catch (error) {
    console.error("Error fetching current user username:", error);
    return { username: null, error: "Failed to fetch username due to a server issue." };
  }
}

export async function fetchUserGithubRepos() {
  try {
    // 1 get the current users internal ID
    const userId = await getCurrentUserId();

    // 2 find the users gitHub account record to get the access token
    const githubAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.provider, 'github')
      ),
    });

    // 3 if no token is found the user hasnt connected their gitHub account
    if (!githubAccount || !githubAccount.accessToken) {
      return { connected: false, repos: [] };
    }

    // 4 use the access token to fetch repositories from the GitHub API
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

    // 5 return the fetched repositories
    return { connected: true, repos: repos };

  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { connected: false, repos: [], error: "A server error occurred." };
  }
}
