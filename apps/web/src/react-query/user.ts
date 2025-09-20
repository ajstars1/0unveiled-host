import { useQuery, useSuspenseQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getUserByUsername, getAIVerifiedSkillsByUsername, getCurrentUser } from "@/data/user";
import { getLeaderboardDataByUsername } from "@/data/leaderboard";

// Query keys for consistent caching
export const userKeys = {
  all: ["user"] as const,
  profile: (username: string) => ["user", "profile", username] as const,
  aiSkills: (username: string) => ["user", "ai-skills", username] as const,
  leaderboard: (username: string) => ["user", "leaderboard", username] as const,
  current: () => ["user", "current"] as const,
} as const;

// Types for better type safety
export type UserProfileData = Awaited<ReturnType<typeof getUserByUsername>>;
export type AISkillsData = Awaited<ReturnType<typeof getAIVerifiedSkillsByUsername>>;
export type LeaderboardData = Awaited<ReturnType<typeof getLeaderboardDataByUsername>>;

// Server action wrappers for client-side queries
async function fetchUserProfile(username: string, currentUserId?: string) {
  "use server";
  return getUserByUsername(username, currentUserId);
}

async function fetchAISkills(username: string) {
  "use server";
  return getAIVerifiedSkillsByUsername(username);
}

async function fetchLeaderboardData(username: string) {
  "use server";
  return getLeaderboardDataByUsername(username);
}

async function fetchCurrentUser() {
  "use server";
  return getCurrentUser();
}

// Hook for user profile data with aggressive caching
export function useUserProfile(username: string, currentUserId?: string) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => fetchUserProfile(username, currentUserId),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
  });
}

// Suspense version for immediate rendering
export function useUserProfileSuspense(username: string, currentUserId?: string) {
  return useSuspenseQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => fetchUserProfile(username, currentUserId),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for AI skills data
export function useAISkills(username: string) {
  return useQuery({
    queryKey: userKeys.aiSkills(username),
    queryFn: () => fetchAISkills(username),
    staleTime: 1000 * 60 * 15, // 15 minutes (AI skills change less frequently)
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

// Hook for leaderboard data
export function useLeaderboardData(username: string) {
  return useQuery({
    queryKey: userKeys.leaderboard(username),
    queryFn: () => fetchLeaderboardData(username),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

// Hook for current user
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Combined hook for all user data with parallel fetching
export function useUserData(username: string) {
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id;

  const profileQuery = useUserProfile(username, currentUserId);
  const aiSkillsQuery = useAISkills(username);
  const leaderboardQuery = useLeaderboardData(username);

  return {
    currentUser: currentUserQuery.data,
    profile: profileQuery.data,
    aiSkills: aiSkillsQuery.data,
    leaderboard: leaderboardQuery.data,
    isLoading: profileQuery.isLoading || aiSkillsQuery.isLoading || leaderboardQuery.isLoading,
    isError: profileQuery.isError || aiSkillsQuery.isError || leaderboardQuery.isError,
    error: profileQuery.error || aiSkillsQuery.error || leaderboardQuery.error,
    refetch: () => {
      profileQuery.refetch();
      aiSkillsQuery.refetch();
      leaderboardQuery.refetch();
    },
  };
}

// Prefetch hook for initial data loading
export function usePrefetchUserData(username: string) {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: userKeys.profile(username),
      queryFn: () => fetchUserProfile(username),
      staleTime: 1000 * 60 * 10,
    });
    
    queryClient.prefetchQuery({
      queryKey: userKeys.aiSkills(username),
      queryFn: () => fetchAISkills(username),
      staleTime: 1000 * 60 * 15,
    });
    
    queryClient.prefetchQuery({
      queryKey: userKeys.leaderboard(username),
      queryFn: () => fetchLeaderboardData(username),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, username]);
}
