'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getUnreadNotificationCount, getRecentNotifications } from '@/actions/optimized-notifications';

/**
 * Hook to prefetch and warm up notification data
 * This runs in the background to ensure fast data access
 */
export function useNotificationPreloader(userId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    // Prefetch notification count
    queryClient.prefetchQuery({
      queryKey: ['notificationCount', userId],
      queryFn: () => getUnreadNotificationCount(),
      staleTime: 15000,
    });

    // Prefetch recent notifications  
    queryClient.prefetchQuery({
      queryKey: ['recentNotifications', userId],
      queryFn: () => getRecentNotifications(5),
      staleTime: 30000,
    });

    // Set up periodic background refresh
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['notificationCount', userId],
        refetchType: 'none' // Don't trigger immediate refetch, just mark as stale
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [userId, enabled, queryClient]);

  return { queryClient };
}

/**
 * Performance monitoring hook for notifications
 */
export function useNotificationPerformance() {
  const queryClient = useQueryClient();

  const getMetrics = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const notificationQueries = queries.filter(query => 
      query.queryKey[0] === 'notificationCount' || 
      query.queryKey[0] === 'recentNotifications'
    );

    return {
      totalQueries: notificationQueries.length,
      staleQueries: notificationQueries.filter(q => q.isStale()).length,
      fetchingQueries: notificationQueries.filter(q => q.state.fetchStatus === 'fetching').length,
      cacheHitRate: notificationQueries.length > 0 
        ? (notificationQueries.filter(q => !q.isStale()).length / notificationQueries.length) * 100 
        : 0
    };
  };

  return { getMetrics };
}
