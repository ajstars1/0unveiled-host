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
import type { Notification } from "@0unveiled/database/schema"
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown" // Re-use the existing dropdown
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getNotificationSummaryForClient, getUnreadNotificationCount } from '@/actions/notifications'

interface NotificationBellProps {
  userId: string; // Required for queries
  initialCount: number;
  initialNotifications: Notification[];
}

export function NotificationBell({ userId, initialCount, initialNotifications }: NotificationBellProps) {

  // --- Query for TOTAL Notification Count (for Badge) --- 
  const { data: countData, isLoading: isLoadingCount } = useQuery({
    // Use a consistent query key as in Header
    queryKey: ['notificationCount', userId], 
    queryFn: async () => {
        const count = await getUnreadNotificationCount();
        return count; 
    },
    initialData: initialCount, 
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, 
    enabled: !!userId, // Enable only if userId is available
  });

  // --- Query for RECENT Notifications (for Dropdown) --- 
  const { data: recentNotificationsResult, isLoading: isLoadingRecent } = useQuery({
    // Use a consistent query key as in Header
    queryKey: ['recentNotifications', userId], 
    queryFn: async () => {
      const summary = await getNotificationSummaryForClient(5);
      return summary?.notifications ?? []; 
    },
    initialData: initialNotifications, 
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    enabled: !!userId, // Enable only if userId is available
  });

  // No need to filter here as we don't know the active chat channel

  // --- Use the count from the query for the badge --- 
  const displayNotificationCount = !isLoadingCount && countData !== undefined 
                                    ? countData 
                                    : initialCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {(displayNotificationCount ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
            >
              {/* Use query result for badge display */}
              {isLoadingCount ? '...' : (displayNotificationCount > 9 ? '9+' : displayNotificationCount)}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Render the existing dropdown, passing the RECENT notifications */}
      <NotificationDropdown 
        notifications={recentNotificationsResult ?? initialNotifications} // Use fetched data or initial
        userId={userId}
      />
    </DropdownMenu>
  );
} 