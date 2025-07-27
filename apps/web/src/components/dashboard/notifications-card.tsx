"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, MessageSquare, UserPlus, Briefcase, MailCheck, AlertTriangle, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'
import { NotificationType } from "@prisma/client"
import { cn } from "@/lib/utils"

import type { DashboardData } from "@/data/dashboard"

interface NotificationsCardProps {
  notifications: DashboardData['notifications']
}

// Define type for a single notification from DashboardData
type NotificationItemData = DashboardData['notifications'][number];

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return MessageSquare
    case NotificationType.NEW_FOLLOWER:
        return UserPlus
    case NotificationType.PROJECT_INVITE:
        return Briefcase
    case NotificationType.PROJECT_UPDATE:
    case NotificationType.INTEGRATION_UPDATE:
        return GitBranch
    case NotificationType.APPLICATION_RECEIVED:
    case NotificationType.APPLICATION_STATUS_UPDATE:
        return MailCheck
    case NotificationType.SYSTEM_ALERT:
      return AlertTriangle
    default:
      return Bell
  }
}

// Separate component for the item content to avoid prop drilling issues
const NotificationContent = ({ notification }: { notification: NotificationItemData }) => {
  const Icon = getNotificationIcon(notification.type)
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })

  return (
    <div className={cn(
        "flex gap-3 items-start p-3 rounded-lg transition-colors", 
        notification.isRead && "opacity-70"
    )}>
      <div
        className="shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center"
      >
        <Icon className={cn("h-4 w-4", notification.isRead ? "text-muted-foreground" : "text-primary")} />
      </div>
      <div className="grow space-y-0.5">
        <p className="text-sm font-medium leading-tight">{notification.content}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <div className="mt-1 shrink-0 h-2 w-2 rounded-full bg-sky-500" title="Unread"></div>
      )}
    </div>
  )
}

export function NotificationsCard({ notifications }: NotificationsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </div>
        <CardDescription>Your {notifications.length > 0 ? `most recent unread notifications` : 'recent notifications'}</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification, index) => {
               const itemWrapperClass = cn(
                   "block",
                   index < notifications.length - 1 && "border-b"
               );
               return notification.linkUrl ? (
                   <Link key={notification.id} href={notification.linkUrl} className={itemWrapperClass}>
                       <NotificationContent notification={notification} />
                   </Link>
               ) : (
                   <div key={notification.id} className={itemWrapperClass}>
                       <NotificationContent notification={notification} />
                   </div>
               );
            })}
          </div>
        ) : (
          <div className="flex h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
            <p>No unread notifications.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
