"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, UserPlus, Eye, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const activities = [
  {
    id: "1",
    type: "profile_view",
    user: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SC",
    },
    time: "2 hours ago",
    message: "viewed your profile",
    icon: Eye,
  },
  {
    id: "2",
    type: "project_like",
    user: {
      name: "Michael Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MJ",
    },
    time: "Yesterday",
    message: "liked your AI Recipe Generator project",
    icon: ThumbsUp,
  },
  {
    id: "3",
    type: "connection",
    user: {
      name: "Emily Rodriguez",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "ER",
    },
    time: "2 days ago",
    message: "sent you a connection request",
    icon: UserPlus,
    actionable: true,
  },
  {
    id: "4",
    type: "message",
    user: {
      name: "David Kim",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "DK",
    },
    time: "3 days ago",
    message: "sent you a message about collaboration",
    icon: MessageSquare,
  },
  {
    id: "5",
    type: "event",
    user: {
      name: "Tech Meetup Group",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "TM",
    },
    time: "1 week ago",
    message: "invited you to 'Frontend Development Workshop'",
    icon: Calendar,
    actionable: true,
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Stay updated with your latest interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className={cn(
                "flex items-start gap-4 p-3",
                index < activities.length - 1 && "border-b"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.user.name}</span>
                  <activity.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{activity.message}</span>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {activity.actionable && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Ignore
                  </Button>
                  <Button size="sm">{activity.type === "connection" ? "Accept" : "View"}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
