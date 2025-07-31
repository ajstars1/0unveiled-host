'use client'

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, BadgeProps } from "@/components/ui/badge"
import { Eye, Lock, Users, Clock, Inbox, Briefcase, ChevronRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import type { DashboardData } from "@/data/dashboard"
import { ProjectStatus, ProjectVisibility, MemberRole } from "@0unveiled/database/schema"

// Define the props interface
interface MyProjectsCardProps {
  projects: DashboardData['projects'];
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
}

const getRoleDisplay = (role: MemberRole) => {
    return role === MemberRole.LEADER ? "Owner" : "Member";
}

export function MyProjectsCard({ projects }: MyProjectsCardProps) {
  return (
    <Card>
      <CardHeader>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                 <Briefcase className="h-5 w-5" />
                 <CardTitle>My Projects</CardTitle>
            </div>
             <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/projects">
                     View All Projects
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
             </Button>
         </div>
        <CardDescription>A quick overview of projects you&apos;re involved in.</CardDescription>
      </CardHeader>
      <CardContent>
        {projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div 
                 key={project.id} 
                 className={cn(
                    "flex items-center justify-between gap-4 p-3 transition-colors",
                    index < projects.length - 1 && "border-b"
                 )}
              >
                <div className="grow space-y-1 overflow-hidden">
                    <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                        <p className="font-medium truncate" title={project.title}>{project.title}</p>
                    </Link>
                  <p className="text-xs text-muted-foreground">
                    Owned by @{project.owner.username || "unknown"} • Your Role: {getRoleDisplay(project.userRole)}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusVariant(project.status)} className="capitalize text-xs">
                       {project.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger>
                           <Badge variant="outline" className="px-1.5 py-0">
                              {project.visibility === ProjectVisibility.PUBLIC ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                           </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="text-xs">{project.visibility === ProjectVisibility.PUBLIC ? "Public Project" : "Private Project"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                   {/* Show application count only if user is LEADER */} 
                  {project.userRole === MemberRole.LEADER && project.pendingApplicationCount > 0 && (
                      <TooltipProvider delayDuration={100}>
                           <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`/project/${project.id}?tab=applications`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <Inbox className="h-3 w-3" />
                                        <span>{project.pendingApplicationCount}</span>
                                    </Link>
                                </TooltipTrigger>
                               <TooltipContent>
                                  <p className="text-xs">{project.pendingApplicationCount} pending application(s)</p>
                               </TooltipContent>
                           </Tooltip>
                      </TooltipProvider>
                  )}
                   <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                   </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[150px] flex-col items-center justify-center text-center text-sm text-muted-foreground border rounded-md">
            <Briefcase className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p>You are not currently part of any projects.</p>
            <Button variant="link" size="sm" asChild className="mt-1">
                <Link href="/projects">Explore Projects</Link>
            </Button>
          </div>
        )}
      </CardContent>
      {/* Optional Footer */} 
      {/* <CardFooter>
           <p className="text-xs text-muted-foreground">Footer information if needed.</p>
      </CardFooter> */}
    </Card>
  )
} 