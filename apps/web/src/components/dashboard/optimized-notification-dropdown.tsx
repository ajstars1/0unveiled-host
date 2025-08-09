'use client'

import * as React from 'react'
import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Eye, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Notification } from "@0unveiled/database"
import { useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/use-notification-mutations'

interface OptimizedNotificationDropdownProps {
  notifications: Notification[]
  userId: string
  className?: string
}

export function OptimizedNotificationDropdown({ 
  notifications, 
  userId, 
  className 
}: OptimizedNotificationDropdownProps) {
  const markAsReadMutation = useMarkNotificationAsRead(userId);
  const markAllAsReadMutation = useMarkAllNotificationsAsRead(userId);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsReadMutation.mutate();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION':
        return '🤝';
      case 'PROJECT':
        return '📋';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '📢';
    }
  };

  return (
    <DropdownMenuContent 
      className={cn("w-80", className)} 
      align="end" 
      forceMount
      sideOffset={8}
    >
      <DropdownMenuLabel className="flex items-center justify-between p-3" inset={false}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
          {hasUnread && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {unreadNotifications.length}
            </Badge>
          )}
        </div>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="h-6 px-2 text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </DropdownMenuLabel>
      
      <DropdownMenuSeparator className="" />

      {notifications.length === 0 ? (
        <div className="p-6 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 p-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg p-3 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !notification.isRead && "bg-muted/50"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <p className={cn(
                    "leading-snug",
                    !notification.isRead && "font-medium"
                  )}>
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { 
                      addSuffix: true 
                    })}
                  </p>
                  {notification.linkUrl && (
                    <Link 
                      href={notification.linkUrl}
                      className="inline-flex items-center text-xs text-primary hover:underline"
                    >
                      View details
                    </Link>
                  )}
                </div>

                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    disabled={markAsReadMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity"
                    title="Mark as read"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <DropdownMenuSeparator className="" />
      
      <DropdownMenuGroup>
        <DropdownMenuItem asChild className="" inset={false}>
          <Link href="/notifications" className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}
