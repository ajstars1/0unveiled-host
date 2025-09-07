"use client"

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, UserPlus, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProjectById, MemberSummary } from "@/data/projects"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Use frontend-safe MemberRole from data layer to avoid importing server-only types
import type { MemberRole } from "@/data/projects";

interface ProjectTeamProps {
  projectId: string
  fullView?: boolean
}

export function ProjectTeam({ projectId, fullView = false }: ProjectTeamProps) {
  const formatRole = (role: MemberRole) => {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }

  const { data: projectData, isLoading, isError } = useQuery({
      queryKey: ['projectDetails', projectId],
      queryFn: () => getProjectById(projectId),
      staleTime: 5 * 60 * 1000,
  });

  const team = projectData?.members?.filter((member: MemberSummary) => member.user.username !== 'seed_user_1746410303039') as MemberSummary[] | undefined;

  if (isLoading) {
     if (fullView) {
        return (
          <Card className="">
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-28 hidden sm:block" /> 
              </div>
            </CardHeader>
            <CardContent className="">
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2 border-b last:border-b-0">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-1/2" /> 
                        </div>
                         <Skeleton className="h-4 w-1/4 hidden md:block" /> 
                         <Skeleton className="h-8 w-8" /> 
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
     } else {
        return (
          <Card className="">
            <CardHeader className="">
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-start gap-4 p-3 border-b last:border-b-0">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="flex-1 space-y-1.5">
                     <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" /> 
                   </div>
                 </div>
               ))}
             </CardContent>
          </Card>
        );
     }
  }

   if (isError || !projectData) {
     return (
       <Card className="">
         <CardHeader className="">
            <CardTitle className="">Project Team</CardTitle>
         </CardHeader>
         <CardContent className="">
             <Alert variant="destructive" className="">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle className="">Error</AlertTitle>
               <AlertDescription className="">Could not load team members.</AlertDescription>
             </Alert>
         </CardContent>
       </Card>
     );
   }

  if (fullView) {
    return (
      <Card className="">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="">Project Team</CardTitle>
              <CardDescription className="">All team members</CardDescription>
            </div>
            <Button size="sm" className="" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="">
          <Table className="">
            <TableHeader className="">
              <TableRow className="">
                <TableHead className="">Member</TableHead>
                <TableHead className="">Role</TableHead>
                <TableHead className="">Skills</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {team && team.length > 0 ? team.map((member) => {
                  const user = member.user;
                  const initials = (user.username?.charAt(0) ?? 'U').toUpperCase();
                  const memberName = user.username || 'Unknown User';
                  const roleDisplay =  member.projectRole ? member.projectRole.title : formatRole(member.role)
                  const userSkills = user.skills ?? [];
                  
                  return (
                      <TableRow key={user.id} className="">
                      <TableCell className="">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage className="" src={user.profilePicture || undefined} alt={memberName} />
                            <AvatarFallback className="">{initials}</AvatarFallback>
                          </Avatar>
                          <Link href={`/${memberName}`} className="font-medium truncate hover:underline">
                            {memberName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">{roleDisplay}</TableCell>
                      <TableCell className="">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {userSkills.length > 0 ? (
                              userSkills.slice(0, 3).map((skill) => (
                               <Badge key={skill.id} variant="secondary" className="text-xs whitespace-nowrap">
                                 {skill.name}
                               </Badge>
                             ))
                          ) : (
                            <span className="text-xs italic text-muted-foreground">-</span>
                          )}
                          {userSkills.length > 3 && (
                               <Badge variant="outline" className="text-xs">+{userSkills.length - 3}</Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={`Message ${memberName}`}>
                          <Mail className="h-4 w-4" />
                          <span className="sr-only">Message {memberName}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
              }) : (
                  <TableRow className="">
                      <TableCell colSpan={4} className="h-24 text-center">
                           No team members found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className=''>
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="">Project Team</CardTitle>
            <CardDescription className="">Members working on this project</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="">
        <div>
          {team && team.length > 0 ? team.slice(0, 3).map((member, index) => {
             const user = member.user;
             const initials = (user.username?.charAt(0) ?? 'U').toUpperCase();
             const memberName = user.username || 'Unknown User';
             const roleDisplay =  member.projectRole ? member.projectRole.title : formatRole(member.role)
             return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-start gap-4 p-3",
                    (index < team.slice(0, 3).length - 1) ? "border-b" : ""
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage className="" src={user.profilePicture || undefined} alt={memberName} />
                    <AvatarFallback className="">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link href={`/${memberName}`} className="font-medium hover:underline">
                      {memberName}
                    </Link>
                    <p className="text-sm capitalize text-muted-foreground">{roleDisplay}</p>
                  </div>
                </div>
            );
          }) : (
             <div className="text-center py-8 text-muted-foreground">No team members yet.</div>
          )}

          {team && team.length > 3 && (
            <Button variant="outline" className="w-full mt-3" size="sm" asChild>
               <Link href={`/dashboard/projects/${projectId}?tab=team`}>
                 <Plus className="mr-2 h-4 w-4" />
                 View All Team Members
               </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}