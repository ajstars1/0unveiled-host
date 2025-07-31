"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, BadgeProps } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, CheckSquare, AlertCircle, Edit, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getProjectById } from "@/data/projects"
import { ProjectStatus } from "@0unveiled/database/schema"
import { Skeleton } from "@/components/ui/skeleton"

type ProjectData = NonNullable<Awaited<ReturnType<typeof getProjectById>>>;

interface SkillSummary {
  id: string;
  name: string;
}

interface ProjectOverviewProps {
  project: ProjectData;
  isLoading?: boolean;
  isOwner?: boolean;
}

const getStatusVariant = (status: ProjectStatus): BadgeProps["variant"] => {
  switch (status) {
    case ProjectStatus.ACTIVE: return "default";
    case ProjectStatus.PLANNING: return "secondary";
    case ProjectStatus.ON_HOLD: return "destructive";
    case ProjectStatus.COMPLETED: return "secondary";
    case ProjectStatus.ARCHIVED: return "outline-solid";
    default: return "secondary";
  }
};

export function ProjectOverview({ project, isLoading, isOwner }: ProjectOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-1" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!project) {
    return <Card><CardContent>Project data not available.</CardContent></Card>;
  }

  const projectId = project.id;
  const workspaceLink = `/dashboard/projects/${projectId}/workspace/kanban`;
  const publicLink = `/project/${projectId}`;
  const editLink = `/dashboard/projects/${projectId}/edit`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{project.title}</CardTitle>
            <CardDescription className="mt-2">{project.publicSummary || project.description || "No description provided."}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Edit Button - Only shown to Owner */}
            {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link href={editLink}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Link>
            </Button>
            )}
            <Button size="sm" asChild>
              <Link href={workspaceLink}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Workspace
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant={getStatusVariant(project.status)} className="capitalize">
            {project.status.toLowerCase().replace('_', ' ')}
          </Badge>
          {project.requiredSkills?.map((skill: SkillSummary) => (
            <Badge key={skill.id} variant="outline">
              {skill.name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Timeline: </span>
                  <span>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Due Date: </span>
                  <span>{new Date(project.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {project.members && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Team Size: </span>
                  <span>{project.members.length} member(s)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href={publicLink}>View Public Project Page</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
