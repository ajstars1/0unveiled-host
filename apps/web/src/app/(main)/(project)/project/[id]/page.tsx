import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Briefcase,
  ShieldCheck,
  Eye,
  Info,
  ListChecks,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { getProjectById, getCurrentUserApplicationsForProject, MemberSummary } from "@/data/projects"
import { getUserBySupabaseId } from "@/data/user"
import { notFound } from "next/navigation"

import { ProjectStatus, ProjectVisibility, MemberRole, ApplicationStatus, ProjectApplication, Role as UserRolePrisma } from "@prisma/client"
import { HtmlParser } from "@/components/global/html-parser"
import { Separator } from "@/components/ui/separator"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import ListApplicants from "./_components/listAppliedUsers"
import { Metadata } from "next"
import { formatDistanceToNow, format } from "date-fns"
import ProjectActionsClient from "@/components/project/project-actions-client"
import { db } from "@/lib/prisma"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id)
  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project does not exist or could not be loaded.",
      robots: "noindex, nofollow",
    }
  }

  return {
    title: project.title,
    description: project.publicSummary,
    alternates: {
      canonical: `/project/${id}`,
    },
    openGraph: {
      title: `${project.title} - 0Unveiled Project`,
      description: project.publicSummary,
      url: `https://0unveiled.com/project/${id}`,
      type: "article",
    },
  }
}

async function ProjectDetail({ params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  const [projectResult, authUserResult] = await Promise.all([
      getProjectById(id),
      supabase.auth.getUser()
  ]);

  const project = projectResult;
  const { data: { user: authUser } } = authUserResult;

  if (!project) {
    notFound();
  }

  const currentUserProfile = authUser ? await db.user.findUnique({ where: { supabaseId: authUser.id } }) : null;
  const currentUserId = currentUserProfile?.id;
  const isUserLoggedIn = !!authUser;

  const userApplications: Pick<ProjectApplication, 'id' | 'projectRoleId' | 'status'>[] = 
    (isUserLoggedIn && currentUserId ? await getCurrentUserApplicationsForProject(project.id) : []) ?? [];
  
  const applicationStatusMap = new Map<string, ApplicationStatus>();
  userApplications.forEach((app) => {
    if (app.projectRoleId) {
      applicationStatusMap.set(app.projectRoleId, app.status);
    }
  });

  const isOwner = project.ownerId === currentUserId;
  
  const visibleMembers = project.members.filter((member: MemberSummary) => member.user.username !== 'seed_user_1746410303039');
  const isMember = currentUserId ? visibleMembers.some((member: MemberSummary) => member.user.id === currentUserId) : false;

  const isAdminSeededOwner = project.owner.username === 'seed_user_1746410303039';
  
  const hasNonAdminLeader = project.members.some(
    (member: MemberSummary) => member.role === MemberRole.LEADER && member.user.id !== project.ownerId
  );

  const canUserAttemptClaim = !!(isUserLoggedIn && 
                             currentUserId &&
                             currentUserId !== project.ownerId &&
                             !project.members.some(m => m.user.id === currentUserId && m.role === MemberRole.LEADER));
  
  const isProjectClaimable = isAdminSeededOwner && !hasNonAdminLeader && canUserAttemptClaim;

  const isProjectLeader = currentUserId ? project.members.some(member => member.user.id === currentUserId && member.role === MemberRole.LEADER) : false;
  const canManageApplications = isOwner || isProjectLeader;
  const canViewDetailedDescription = isOwner || isMember || isProjectLeader;

  const getStatusClass = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return "bg-blue-100 text-blue-800 border-blue-300";
      case ProjectStatus.ACTIVE: return "bg-green-100 text-green-800 border-green-300";
      case ProjectStatus.ON_HOLD: return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case ProjectStatus.COMPLETED: return "bg-purple-100 text-purple-800 border-purple-300";
      case ProjectStatus.ARCHIVED: return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  const formatRole = (role: MemberRole) => {
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Link href="/projects" legacyBehavior> 
              <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                 <ArrowLeft className="h-4 w-4" /> Back to Projects
              </a>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {project.title}
              </h1>
               <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                     <AvatarImage src={project.owner.profilePicture || undefined} alt={project.owner.username || 'Owner'} />
                     <AvatarFallback>{project.owner.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  Created by 
                  {project.owner.username === 'seed_user_1746410303039' ? (
                    <span className="font-medium text-muted-foreground">Admin</span>
                  ) : (
                    <Link href={`/${project.owner.username}`} className="hover:underline font-medium text-primary">
                       {project.owner.username || 'Unknown User'}
                    </Link>
                  )}
               </div>
            </div>
            <div className="flex  items-center gap-2 mt-2 md:mt-0">
              <Badge variant="outline" className={`capitalize ${getStatusClass(project.status)}`}>
                 {project.status.toLowerCase().replace(/_/g, ' ')}
              </Badge>
              <ProjectActionsClient
                projectId={project.id}
                projectTitle={project.title}
                currentUserId={currentUserId}
                isOwner={isOwner}
                isMember={isMember}
                isProjectClaimable={isProjectClaimable}
                openRoles={(project.roles || []) as Array<import("@prisma/client").ProjectRole & { requiredSkills: Array<{ id: string; name: string; }> }>}
                isUserLoggedIn={isUserLoggedIn}
              />
              {isOwner && (
                <Link href={`/dashboard/projects/${project.id}/edit`} legacyBehavior>
                  <Button variant="outline" size="sm" className="ml-2 ">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Info className="h-5 w-5 text-blue-500"/> Public Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.publicSummary}</p>
                </CardContent>
             </Card>
             
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="roles">Open Roles</TabsTrigger>
                 {canManageApplications && (
                   <TabsTrigger value="applications">Applications</TabsTrigger>
                 )} 
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                 <Card>
                   <CardHeader>
                      <CardTitle>Details</CardTitle>
                   </CardHeader>
                   <CardContent>
                      {canViewDetailedDescription ? (
                         <HtmlParser html={project.htmlDescription || project.description} />
                      ) : (
                         <p className="italic text-muted-foreground">
                           Detailed description is only visible to project members.
                           {project.visibility === ProjectVisibility.PRIVATE && " This project is private."}
                         </p>
                      )}
                   </CardContent>
                 </Card>
                 
                  <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                           <ListChecks className="h-5 w-5 text-purple-500" /> General Skills Required
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                       {project.requiredSkills && project.requiredSkills.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                           {project.requiredSkills.map((skill) => (
                             <Badge key={skill.id} variant="secondary">
                               {skill.name}
                             </Badge>
                           ))}
                         </div>
                       ) : (
                         <p className="text-sm text-muted-foreground italic">No general skills specified for the project.</p>
                       )}
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="team">
                 <Card>
                   <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     {visibleMembers.length > 0 ? (
                       visibleMembers.map((member: MemberSummary) => (
                          <div key={member.user.id} className="flex items-center justify-between gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.user.profilePicture || undefined} alt={member.user.username || 'Member'} />
                                  <AvatarFallback>{member.user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/${member.user.username}`} className="font-semibold hover:underline">
                                     {member.user.username || 'Unknown User'}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">{member.user.headline || 'No headline'}</p>
                                </div>
                             </div>
                             <Badge variant={member.role === MemberRole.LEADER ? "default" : "secondary"}> 
                                {member.projectRole ? member.projectRole.title : formatRole(member.role)}
                             </Badge>
                          </div>
                         ))
                     ) : (
                         <p className="text-sm text-muted-foreground italic">No team members yet (besides the owner).</p>
                     )}
                   </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="roles">
                  <Card>
                     <CardHeader>
                        <CardTitle>Open Roles</CardTitle>
                        <CardDescription>Looking for collaborators? Apply for a role that matches your skills.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       {project.roles && project.roles.length > 0 ? (
                          project.roles.map((role) => {
                             const userApplicationStatus = applicationStatusMap.get(role.id);

                             return (
                               <div key={role.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                 <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start mb-2">
                                    <div className="grow">
                                      <h4 className="font-semibold text-lg">{role.title}</h4>
                                       {role.description && (
                                          <p className="text-sm text-muted-foreground mt-1 break-words">{role.description}</p>
                                       )}
                                    </div>
                                    <div className="md:ml-auto shrink-0 w-full md:w-auto">
                                    {isOwner ? (
                                          <Badge variant="secondary" className="w-full md:w-auto justify-center">Your Project</Badge>
                                     ) : isMember ? (
                                          <Badge variant="secondary" className="w-full md:w-auto justify-center">Already Member</Badge>
                                     ) : userApplicationStatus ? (
                                         <Badge 
                                            variant={userApplicationStatus === 'PENDING' ? 'secondary' : userApplicationStatus === 'ACCEPTED' ? 'default' : 'destructive'} 
                                              className="capitalize w-full md:w-auto justify-center"
                                         >
                                            {userApplicationStatus.toLowerCase()}
                                         </Badge>
                                     ) : (
                                        null
                                     )}
                                 </div>
                                 </div>
                                 <Separator className="my-3 md:my-2"/>
                                 <div className="flex flex-wrap gap-2">
                                    {role.requiredSkills && role.requiredSkills.length > 0 ? (
                                       role.requiredSkills.map((skill) => (
                                          <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                                       ))
                                    ) : (
                                       <p className="text-xs italic text-muted-foreground">No specific skills listed.</p>
                                    )}
                                 </div>
                               </div>
                            )
                          })
                       ) : (
                         <p className="text-sm text-muted-foreground italic">No specific open roles defined for this project yet.</p>
                       )}
                       {(!project.roles || project.roles.length === 0) && isProjectClaimable && !isOwner && !isMember &&(
                           <div className="mt-4">
                               <ProjectActionsClient
                                   projectId={project.id}
                                   projectTitle={project.title}
                                   currentUserId={currentUserId}
                                   isOwner={isOwner}
                                   isMember={isMember}
                                   isProjectClaimable={isProjectClaimable}
                                   openRoles={(project.roles || []) as Array<import("@prisma/client").ProjectRole & { requiredSkills: Array<{ id: string; name: string; }> }>}
                                   isUserLoggedIn={isUserLoggedIn}
                               />
                           </div>
                       )}
                     </CardContent>
                  </Card>
              </TabsContent>

               {canManageApplications && (
                 <TabsContent value="applications">
                    <ListApplicants projectId={project.id} /> 
                 </TabsContent>
               )} 
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                 <div className="flex items-center gap-2">
                     {project.visibility === ProjectVisibility.PUBLIC ? <Eye className="h-4 w-4 text-green-500" /> : <ShieldCheck className="h-4 w-4 text-orange-500" />}
                     <span>{project.visibility === ProjectVisibility.PUBLIC ? "Public" : "Private"} Project</span>
                 </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.startDate ? `Started ${format(new Date(project.startDate), "PPP")}` : "Start date not set"}
                  </span>
                </div>
                 {project.endDate && (
                    <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       <span>Est. End {format(new Date(project.endDate), "PPP")}</span>
                    </div>
                 )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{visibleMembers.length} Member(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{project.roles ? project.roles.length : 0} Open Role(s)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
