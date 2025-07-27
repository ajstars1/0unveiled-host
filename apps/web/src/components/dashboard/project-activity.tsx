"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GitCommit, MessageSquare, FileEdit, CheckSquare, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectActivityProps {
  projectId: string
}

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  // Mock activity data - in a real app, this would be fetched based on projectId
  const activities = [
    {
      id: "1",
      type: "commit",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      time: "2 hours ago",
      message: "Added responsive design for mobile view",
      icon: GitCommit,
    },
    {
      id: "2",
      type: "comment",
      user: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "SC",
      },
      time: "Yesterday",
      message: "Left a comment on 'API Integration'",
      icon: MessageSquare,
    },
    {
      id: "3",
      type: "edit",
      user: {
        name: "Michael Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      time: "2 days ago",
      message: "Updated project description and requirements",
      icon: FileEdit,
    },
    {
      id: "4",
      type: "task",
      user: {
        name: "Emily Rodriguez",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "ER",
      },
      time: "3 days ago",
      message: "Completed task: 'Setup database schema'",
      icon: CheckSquare,
    },
    {
      id: "5",
      type: "join",
      user: {
        name: "David Kim",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "DK",
      },
      time: "1 week ago",
      message: "Joined the project as Frontend Developer",
      icon: Plus,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and actions on this project</CardDescription>
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
