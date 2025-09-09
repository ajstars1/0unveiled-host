"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus, PlusCircle, FileEdit, Download, Share2 } from "lucide-react"

const actions = [
  {
    title: "Edit Profile",
    description: "Update your personal information",
    icon: FileEdit,
    href: "/profile/edit",
    variant: "default" as const,
  },
  {
    title: "Create Project",
    description: "Start a new collaboration",
    icon: PlusCircle,
    href: "/app/projects/new",
  variant: "outline" as const,
  },
  {
    title: "Find Collaborators",
    description: "Connect with other users",
    icon: UserPlus,
    href: "/app/profiles",
  variant: "outline" as const,
  },
  {
    title: "Export Resume",
    description: "Download your profile as PDF",
    icon: Download,
    href: "#",
  variant: "outline" as const,
  },
  {
    title: "Share Profile",
    description: "Get a shareable link",
    icon: Share2,
    href: "#",
  variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="w-full justify-start text-left h-auto py-3"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-4 w-4 mr-3" />
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
