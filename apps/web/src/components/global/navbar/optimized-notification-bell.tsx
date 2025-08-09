'use client'

import * as React from 'react'
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Notification } from "@0unveiled/database"
import { OptimizedNotificationDropdown } from "@/components/dashboard/optimized-notification-dropdown"
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getNotificationSummaryForClient, getUnreadNotificationCount } from '@/actions/optimized-notifications'

interface OptimizedNotificationBellProps {
  userId: string;
  initialCount: number;
  initialNotifications: Notification[];
}

export function OptimizedNotificationBell({ 
  userId, 
  initialCount, 
  initialNotifications 
}: OptimizedNotificationBellProps) {

  // Query for notification count with optimized caching
  const { data: countData, isLoading: isLoadingCount } = useQuery({
    queryKey: ['notificationCount', userId], 
    queryFn: async () => {
        const count = await getUnreadNotificationCount();
        return count; 
    },
    initialData: initialCount, 
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 15000, // Consider fresh for 15 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData, 
    enabled: !!userId,
  });

  // Query for recent notifications with optimized caching
  const { data: recentNotificationsResult, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recentNotifications', userId], 
    queryFn: async () => {
      const summary = await getNotificationSummaryForClient(5);
      return summary?.notifications ?? []; 
    },
    initialData: initialNotifications, 
    refetchInterval: 60000, // 60 seconds
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });

  // Use the count from the query for the badge
  const displayNotificationCount = !isLoadingCount && countData !== undefined 
                                    ? countData 
                                    : initialCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-accent" 
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {(displayNotificationCount ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full animate-pulse"
            >
              {isLoadingCount ? '...' : (displayNotificationCount > 9 ? '9+' : displayNotificationCount)}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Use the optimized dropdown */}
      <OptimizedNotificationDropdown 
        notifications={recentNotificationsResult ?? initialNotifications}
        userId={userId}
      />
    </DropdownMenu>
  );
}
