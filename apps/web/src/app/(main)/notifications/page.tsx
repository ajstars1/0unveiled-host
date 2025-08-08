'use client'

import * as React from 'react'
import { useState, useEffect, startTransition } from 'react'
import { getUserNotifications } from '@/actions/notifications'
import type { Notification } from '@0unveiled/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, BellRing, CheckCheck, Inbox } from "lucide-react"
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'

// Import mark as read actions
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/actions/notifications'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false); // State for mark as read operations
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedNotifications = await getUserNotifications()
        if (fetchedNotifications) {
          setNotifications(fetchedNotifications)
        } else {
          // Handle case where user is not logged in or error occurred during fetch
          setError('Could not load notifications. Please try again later.')
          setNotifications([])
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
        setError('An unexpected error occurred while fetching notifications.')
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkOneAsRead = async (notificationId: string) => {
    setIsUpdating(true);
    const originalNotifications = [...notifications];
    // Optimistically update UI
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));

    startTransition(async () => {
      try {
        const result = await markNotificationAsRead(notificationId);
        if (!result.success) {
          toast({ title: "Error", description: result.error || "Failed to mark as read.", variant: "destructive" });
          setNotifications(originalNotifications); // Revert optimistic update
        }
        // No success toast needed; revalidation should update header count
      } catch (err) {
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        setNotifications(originalNotifications); // Revert optimistic update
      } finally {
        setIsUpdating(false);
      }
    });
  }

  const handleMarkAllAsRead = async () => {
    const originalNotifications = [...notifications];
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return; // No unread notifications

    setIsUpdating(true);
    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    startTransition(async () => {
      try {
        const result = await markAllNotificationsAsRead();
        if (!result.success) {
          toast({ title: "Error", description: result.error || "Failed to mark all as read.", variant: "destructive" });
          setNotifications(originalNotifications); // Revert optimistic update
        }
      } catch (err) {
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        setNotifications(originalNotifications); // Revert optimistic update
      } finally {
        setIsUpdating(false);
      }
    });
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <BellRing className="h-6 w-6"/> Notifications
          </CardTitle>
          <CardDescription className="">
            Manage your notifications and stay updated.
          </CardDescription>
        </div>
        <Button
          className=""
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isLoading || isUpdating || unreadCount === 0} // Disable while loading or updating
        >
          {isUpdating && unreadCount > 0 ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="mr-2 h-4 w-4"/>
          )}
          Mark All Read
        </Button>
      </CardHeader>
      <CardContent className="">
        <ScrollArea className="h-[60vh] pr-4 -mr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-10">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <Inbox className="mx-auto h-12 w-12 mb-4"/>
              <p className="font-medium">No notifications yet!</p>
              <p className="text-sm">Check back later for updates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border",
                    notification.isRead ? "bg-background text-muted-foreground" : "bg-muted/50"
                  )}>
                    <div className="shrink-0 pt-1">
                      {/* TODO: Add icons based on notification type */}
                      <BellRing className={cn("h-5 w-5", notification.isRead ? "text-muted-foreground" : "text-primary")} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {/* TODO: Potentially format title based on type */} 
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      {notification.linkUrl && (
                        <Link href={notification.linkUrl} passHref>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                    {!notification.isRead && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 h-8 w-8 p-0"
                        onClick={() => handleMarkOneAsRead(notification.id)}
                        title="Mark as read"
                        disabled={isUpdating} // Disable while updating
                      >
                        <CheckCheck className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                  {index < notifications.length - 1 && <Separator className=""/>}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 