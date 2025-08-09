'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount, getRecentNotifications } from '@/actions/optimized-notifications';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for marking a single notification as read with optimistic updates
 */
export function useMarkNotificationAsRead(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notificationCount', userId] });
      await queryClient.cancelQueries({ queryKey: ['recentNotifications', userId] });

      // Snapshot the previous values
      const previousCount = queryClient.getQueryData(['notificationCount', userId]);
      const previousNotifications = queryClient.getQueryData(['recentNotifications', userId]);

      // Optimistically update count
      queryClient.setQueryData(['notificationCount', userId], (old: number) => 
        Math.max(0, (old || 0) - 1)
      );

      // Optimistically update notifications
      queryClient.setQueryData(['recentNotifications', userId], (old: any[]) => 
        old?.map(n => n.id === notificationId ? { ...n, isRead: true } : n) || []
      );

      return { previousCount, previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Revert optimistic updates
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['notificationCount', userId], context.previousCount);
      }
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(['recentNotifications', userId], context.previousNotifications);
      }
      
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notificationCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['recentNotifications', userId] });
    },
  });
}

/**
 * Hook for marking all notifications as read with optimistic updates
 */
export function useMarkAllNotificationsAsRead(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notificationCount', userId] });
      await queryClient.cancelQueries({ queryKey: ['recentNotifications', userId] });

      // Snapshot the previous values
      const previousCount = queryClient.getQueryData(['notificationCount', userId]);
      const previousNotifications = queryClient.getQueryData(['recentNotifications', userId]);

      // Optimistically update count to 0
      queryClient.setQueryData(['notificationCount', userId], 0);

      // Optimistically mark all notifications as read
      queryClient.setQueryData(['recentNotifications', userId], (old: any[]) => 
        old?.map(n => ({ ...n, isRead: true })) || []
      );

      return { previousCount, previousNotifications };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['notificationCount', userId], context.previousCount);
      }
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(['recentNotifications', userId], context.previousNotifications);
      }
      
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notificationCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['recentNotifications', userId] });
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });
}

/**
 * Hook for prefetching notification data
 */
export function usePrefetchNotifications(userId: string) {
  const queryClient = useQueryClient();

  const prefetchNotificationCount = () => {
    queryClient.prefetchQuery({
      queryKey: ['notificationCount', userId],
      queryFn: () => getUnreadNotificationCount(),
      staleTime: 15000,
    });
  };

  const prefetchRecentNotifications = () => {
    queryClient.prefetchQuery({
      queryKey: ['recentNotifications', userId],
      queryFn: () => getRecentNotifications(5),
      staleTime: 30000,
    });
  };

  return {
    prefetchNotificationCount,
    prefetchRecentNotifications,
  };
}
