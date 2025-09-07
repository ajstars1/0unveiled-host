'use client'

import * as React from 'react'
import { startTransition } from 'react'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { BellRing, CheckCheck, Inbox, Loader2 } from "lucide-react"
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'
import type { Notification } from '@0unveiled/database'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/actions/notifications'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface NotificationDropdownProps {
  notifications: Notification[];
  userId: string;
}

export function NotificationDropdown({ notifications, userId }: NotificationDropdownProps) {
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Define the query keys used in the Header OUTSIDE the mutations
  const countQueryKey = ['notificationCount', userId];
  const listQueryKey = ['recentNotifications', userId];

  const markOneAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId: string) => {
      // Cancel ongoing queries for both keys
      await queryClient.cancelQueries({ queryKey: countQueryKey });
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      // Get previous data for both keys for potential rollback
      const previousCountData = queryClient.getQueryData<number>(countQueryKey);
      const previousListData = queryClient.getQueryData<Notification[]>(listQueryKey);

      // Optimistically update the COUNT cache
      queryClient.setQueryData<number>(countQueryKey, (oldCount) => {
        // Only decrease count if it was actually positive
        return typeof oldCount === 'number' && oldCount > 0 ? oldCount - 1 : 0;
      });

      // Optimistically update the LIST cache
      queryClient.setQueryData<Notification[]>(listQueryKey, (oldData) => {
        if (!oldData) return [];
        return oldData.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        // Note: Count update is handled separately above
      });

      // Return previous data for both keys
      return { previousCountData, previousListData };
    },
    onError: (err, notificationId, context) => {
      toast({ title: "Error", description: "Failed to mark as read.", variant: "destructive" });
      // Rollback both caches if necessary - Keys are now in scope
      if (context?.previousCountData !== undefined) {
        queryClient.setQueryData(countQueryKey, context.previousCountData);
      }
      if (context?.previousListData) {
        queryClient.setQueryData(listQueryKey, context.previousListData);
      }
    },
    onSettled: () => {
      // Invalidate both query keys - Keys are now in scope
      queryClient.invalidateQueries({ queryKey: countQueryKey });
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
        // Cancel ongoing queries for both keys
        await queryClient.cancelQueries({ queryKey: countQueryKey });
        await queryClient.cancelQueries({ queryKey: listQueryKey });

        // Get previous data for both keys for potential rollback
        const previousCountData = queryClient.getQueryData<number>(countQueryKey);
        const previousListData = queryClient.getQueryData<Notification[]>(listQueryKey);

        // Optimistically update the COUNT cache to 0
        queryClient.setQueryData<number>(countQueryKey, 0);

        // Optimistically update the LIST cache (mark all as read)
        queryClient.setQueryData<Notification[]>(listQueryKey, (oldData) => {
            if (!oldData) return [];
            return oldData.map(n => ({ ...n, isRead: true }));
        });

        // Return previous data for both keys
        return { previousCountData, previousListData };
    },
    onError: (err, variables, context) => {
        toast({ title: "Error", description: "Failed to mark all as read.", variant: "destructive" });
        // Rollback both caches - Keys are now in scope
        if (context?.previousCountData !== undefined) {
          queryClient.setQueryData(countQueryKey, context.previousCountData);
        }
        if (context?.previousListData) {
          queryClient.setQueryData(listQueryKey, context.previousListData);
        }
    },
    onSettled: () => {
        // Invalidate both query keys - Keys are now in scope
        queryClient.invalidateQueries({ queryKey: countQueryKey });
        queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  const isUpdatingOne = markOneAsReadMutation.isPending;
  const isUpdatingAll = markAllAsReadMutation.isPending;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkOneAsRead = (notificationId: string) => {
      const targetNotification = notifications.find(n => n.id === notificationId);
      if (!targetNotification || targetNotification.isRead || isUpdatingOne) {
          return;
      }
      startTransition(() => {
          markOneAsReadMutation.mutate(notificationId);
      });
  }

  const handleMarkAllAsRead = () => {
      if (unreadCount === 0 || isUpdatingAll) return;
      startTransition(() => {
          markAllAsReadMutation.mutate();
      });
  }

  return (
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel inset={true} className="flex items-center justify-between px-3 py-2">
        <span className="font-semibold">Notifications</span>
         {unreadCount > 0 && (
             <Button
                 variant="ghost"
                 size="sm"
                 className="text-xs h-auto p-0 text-primary hover:bg-transparent"
                 onClick={handleMarkAllAsRead}
                 disabled={isUpdatingAll}
             >
                 {isUpdatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark all read"}
             </Button>
         )}
      </DropdownMenuLabel>
  <DropdownMenuSeparator />
      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 px-4">
              <Inbox className="mx-auto h-10 w-10 mb-2"/>
              <p className="text-sm">No notifications yet.</p>
            </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              inset
              key={notification.id}
              className={cn(
                "flex items-start gap-3 data-highlighted:bg-muted/50 relative",
                notification.isRead && "text-muted-foreground",
                "p-0"
              )}
              asChild
              disabled={isUpdatingOne || isUpdatingAll}
            >
              <Link 
                href={notification.linkUrl || '#'}
                className="flex w-full p-3 cursor-pointer"
                onClick={() => {
                    if (!notification.isRead) {
                        handleMarkOneAsRead(notification.id);
                    }
                }}
              >
                {!notification.isRead && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"></span>
                )}
                <div className="shrink-0 pt-0.5 pl-3">
                  <BellRing className={cn("h-4 w-4", notification.isRead ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm leading-tight">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </ScrollArea>
  <DropdownMenuSeparator />
  <DropdownMenuItem inset asChild className="justify-center cursor-pointer">
        <Link href="/notifications">
          View All Notifications
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
} 