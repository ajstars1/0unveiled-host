"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, Plus } from "lucide-react"

const projects = [
  {
    id: "1",
    name: "AI-Powered Recipe Generator",
    status: "In Progress",
    progress: 65,
    role: "Team Lead",
    members: 4,
    dueDate: "2023-12-15",
  },
  {
    id: "2",
    name: "E-commerce Mobile App",
    status: "Planning",
    progress: 20,
    role: "Frontend Developer",
    members: 6,
    dueDate: "2024-02-28",
  },
  {
    id: "3",
    name: "Portfolio Website Redesign",
    status: "Completed",
    progress: 100,
    role: "Designer",
    members: 2,
    dueDate: "2023-10-30",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
    case "Planning":
      return "bg-amber-500/20 text-amber-700 dark:text-amber-400"
    case "Completed":
      return "bg-green-500/20 text-green-700 dark:text-green-400"
    default:
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
  }
}

export function ProjectsOverview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Projects Overview</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/my-projects">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription>Your active and recent projects</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {projects.map((project) => (
            <div key={project.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/app/projects/${project.id}/workspace`} className="font-medium hover:underline">
                  {project.name}
                </Link>
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Role: {project.role}</span>
                  <span className="text-muted-foreground">{project.members} members</span>
                </div>
                <span className="text-muted-foreground">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <Button className="w-full" asChild>
          <Link href="/app/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
