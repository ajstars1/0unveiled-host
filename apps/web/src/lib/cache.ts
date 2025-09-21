import { unstable_cache } from 'next/cache';
import { getUserByUsername, getAIVerifiedSkillsByUsername, getCurrentUser } from "@/data/user";
import { getLeaderboardDataByUsername } from "@/data/leaderboard";

// Cache configuration
const CACHE_TAGS = {
  USER_PROFILE: 'user-profile',
  AI_SKILLS: 'ai-skills',
  LEADERBOARD: 'leaderboard',
  CURRENT_USER: 'current-user',
} as const;

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  USER_PROFILE: 600, // 10 minutes
  AI_SKILLS: 900, // 15 minutes
  LEADERBOARD: 300, // 5 minutes
  CURRENT_USER: 300, // 5 minutes
} as const;

// Cached user profile fetch
export const getCachedUserProfile = unstable_cache(
  async (username: string, currentUserId?: string) => {
    return getUserByUsername(username, currentUserId);
  },
  ['user-profile'],
  {
    revalidate: CACHE_DURATIONS.USER_PROFILE,
    tags: [CACHE_TAGS.USER_PROFILE],
  }
);

// Cached AI skills fetch
export const getCachedAISkills = unstable_cache(
  async (username: string) => {
    return getAIVerifiedSkillsByUsername(username);
  },
  ['ai-skills'],
  {
    revalidate: CACHE_DURATIONS.AI_SKILLS,
    tags: [CACHE_TAGS.AI_SKILLS],
  }
);

// Cached leaderboard data fetch
export const getCachedLeaderboardData = unstable_cache(
  async (username: string) => {
    return getLeaderboardDataByUsername(username);
  },
  ['leaderboard'],
  {
    revalidate: CACHE_DURATIONS.LEADERBOARD,
    tags: [CACHE_TAGS.LEADERBOARD],
  }
);

// Cached current user fetch
export const getCachedCurrentUser = unstable_cache(
  async () => {
    return getCurrentUser();
  },
  ['current-user'],
  {
    revalidate: CACHE_DURATIONS.CURRENT_USER,
    tags: [CACHE_TAGS.CURRENT_USER],
  }
);

// Optimized user profile data with size limits
export const getCachedUserProfileData = unstable_cache(
  async (username: string) => {
    try {
      const currentUser = await getCachedCurrentUser();
      
      const [user, aiSkills, leaderboard] = await Promise.all([
        getCachedUserProfile(username, currentUser?.id),
        getCachedAISkills(username),
        getCachedLeaderboardData(username),
      ]);

      // Optimize data to reduce cache size
      const optimizedUser = user ? {
        ...user,
        // Limit showcased items to reduce size
        showcasedItems: (user.showcasedItems || []).slice(0, 10),
        // Limit projects to reduce size
        projectsOwned: (user.projectsOwned || []).slice(0, 5),
        projectsMemberOf: (user.projectsMemberOf || []).slice(0, 5),
        // Limit skills to reduce size
        skills: (user.skills || []).slice(0, 20),
        // Limit experience and education
        experience: (user.experience || []).slice(0, 5),
        education: (user.education || []).slice(0, 3),
      } : null;

      // Optimize AI skills to reduce size
      const optimizedAISkills = aiSkills ? {
        languages: (aiSkills.languages || []).slice(0, 10),
        frameworks: (aiSkills.frameworks || []).slice(0, 10),
        libraries: (aiSkills.libraries || []).slice(0, 10),
        tools: (aiSkills.tools || []).slice(0, 10),
        databases: (aiSkills.databases || []).slice(0, 5),
        cloud: (aiSkills.cloud || []).slice(0, 5),
        totalSkills: aiSkills.totalSkills,
        lastVerified: aiSkills.lastVerified,
      } : null;

      return {
        user: optimizedUser,
        aiSkills: optimizedAISkills,
        leaderboard,
        currentUser,
      };
    } catch (error) {
      console.error('Cache error for user profile data:', error);
      // Fallback to non-cached data
      return await getCachedUserProfileDataFallback(username);
    }
  },
  ['user-profile-data-optimized'],
  {
    revalidate: CACHE_DURATIONS.USER_PROFILE,
    tags: [CACHE_TAGS.USER_PROFILE, CACHE_TAGS.AI_SKILLS, CACHE_TAGS.LEADERBOARD],
  }
);

// Fallback function without caching for large data
export const getCachedUserProfileDataFallback = async (username: string) => {
  try {
    const currentUser = await getCurrentUser();
    
    const [user, aiSkills, leaderboard] = await Promise.all([
      getUserByUsername(username, currentUser?.id),
      getAIVerifiedSkillsByUsername(username),
      getLeaderboardDataByUsername(username),
    ]);

    // Optimize data to reduce size
    const optimizedUser = user ? {
      ...user,
      showcasedItems: (user.showcasedItems || []).slice(0, 10),
      projectsOwned: (user.projectsOwned || []).slice(0, 5),
      projectsMemberOf: (user.projectsMemberOf || []).slice(0, 5),
      skills: (user.skills || []).slice(0, 20),
      experience: (user.experience || []).slice(0, 5),
      education: (user.education || []).slice(0, 3),
    } : null;

    const optimizedAISkills = aiSkills ? {
      languages: (aiSkills.languages || []).slice(0, 10),
      frameworks: (aiSkills.frameworks || []).slice(0, 10),
      libraries: (aiSkills.libraries || []).slice(0, 10),
      tools: (aiSkills.tools || []).slice(0, 10),
      databases: (aiSkills.databases || []).slice(0, 5),
      cloud: (aiSkills.cloud || []).slice(0, 5),
      totalSkills: aiSkills.totalSkills,
      lastVerified: aiSkills.lastVerified,
    } : null;

    return {
      user: optimizedUser,
      aiSkills: optimizedAISkills,
      leaderboard,
      currentUser,
    };
  } catch (error) {
    console.error('Fallback error for user profile data:', error);
    throw error;
  }
};

// Cache invalidation helpers
export const invalidateUserCache = (username: string) => {
  // This would be called when user data is updated
  // In a real implementation, you'd use revalidateTag from next/cache
  // console.log(`Invalidating cache for user: ${username}`);
};
