import {
  Github,
  Linkedin,
  Globe,
  MapPin,
  Briefcase as BriefcaseIcon,
  GraduationCap,
  Building,
  CalendarDays,
  Twitter,
  Dribbble,
  Eye,
  Pin,
  List,
  Edit,
  Star,
  Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { getUserByUsername, getCurrentUser } from "@/data/user"
import { getAIVerifiedSkillsByUsername } from "@/data/user"
import { notFound } from "next/navigation"
import { formatShortDate } from "@/lib/utils"
import { Metadata } from "next"
import { PortfolioCard } from "@/components/profile/portfolio-card"
import { ProfileActions } from "@/components/profile/profile-actions"
import { ProfileAnalyzer } from "@/components/profile/profile-analyzer"
import { AIVerifiedSkills } from "@/components/profile/ai-verified-skills"

import { fetchRepoCode } from "@/actions/portfolioActions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  
  // Filter out non-username routes (favicon.ico, robots.txt, etc.)
  if (username.includes('.') || username.startsWith('_') || username === 'api') {
    notFound()
  }
  
  // Fetch currentUser first to get the ID for the profile fetch
  const currentUser = await getCurrentUser()
  const user = await getUserByUsername(username, currentUser?.id) // Pass current user ID

  if (!user) {
    notFound()
  }

  const fullName = `${user.firstName} ${user.lastName || ''}`.trim()
  const pageTitle = `${fullName}'s Profile | 0Unveiled`
  const description = user.headline || user.bio || `Check out ${fullName}'s profile, projects, and skills on 0Unveiled.`
  const ogImageUrl = user.profilePicture || "/og-image.png"


  return {
    title: pageTitle,
    description: description,
    alternates: {
      canonical: `/${username}`,
    },
    openGraph: {
      title: pageTitle,
      description: description,
      url: `https://0unveiled.com/${username}`,
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${fullName}'s Profile Picture`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [ogImageUrl],
    },
  }
}

async function ProfileDetail({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Filter out non-username routes (favicon.ico, robots.txt, etc.)
  if (username.includes('.') || username.startsWith('_') || username === 'api') {
    notFound()
  }

  // Fetch currentUser first
  const currentUser = await getCurrentUser()
  // Pass currentUser.id to getUserByUsername
  const user = await getUserByUsername(username, currentUser?.id)

  if (!user) {
    notFound()
  }
  if(user.username === 'seed_user_1746410303039') {
    notFound()
  }

  // Fetch AI-verified skills
  const aiVerifiedSkills = await getAIVerifiedSkillsByUsername(username);

  // isOwnProfile can also be determined by connectionStatus === 'SELF'
  // const isOwnProfile = !!currentUser && currentUser.id === user.id
  const isOwnProfile = user.connectionStatus === 'SELF'

  const fullName = `${user.firstName} ${user.lastName || ''}`.trim()

  const topSkills = user.skills?.slice(0, 10) || []
  const allSkills = user.skills || []

  const allPortfolioItems = user.showcasedItems || []
  const pinnedPortfolioItems = allPortfolioItems.filter(item => item.isPinned)

  const currentProjects = [
    ...(user.projectsOwned?.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING')
      .map(p => ({ ...p, role: 'Founder', type: 'ownedProject' })) || []),
    ...(user.projectsMemberOf?.filter(m => m.project && (m.project.status === 'ACTIVE' || m.project.status === 'PLANNING'))
      .map(m => ({ ...m.project, role: m.role || 'Member', type: 'memberProject' })) || [])
  ].filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-secondary/10 text-foreground">
      <div className="h-40 md:h-48 w-full bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 relative">
         <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
        <Card className="mb-6 shadow-lg border border-border/10 overflow-visible">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 relative">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-md mt-[-48px] md:mt-[-60px] shrink-0">
              <AvatarImage className={''} src={user.profilePicture ?? undefined} alt={`${fullName}'s profile picture`} />
              <AvatarFallback className="text-4xl">
                {user.firstName?.charAt(0) || ''}
                {user.lastName?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left w-full md:w-auto">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{fullName}</h1>
              {user.username && <p className="text-sm text-muted-foreground -mt-1">@{user.username}</p>}

              {user.headline && (
                <p className="text-lg text-primary mt-1 font-medium">{user.headline}</p>
              )}
              {!user.headline && user.experience?.[0]?.current && (
                <p className="text-lg text-primary mt-1 font-medium">
                  {user.experience[0].jobTitle} at {user.experience[0].companyName}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {user.college && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="h-4 w-4 shrink-0 text-primary/80"/>
                    <span>{user.college}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0"/>
                    <span>{user.location}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center md:justify-start flex-wrap gap-1 mt-3">
                {user.githubUrl && <Link href={user.githubUrl} target="_blank" rel="noopener noreferrer" passHref><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8"><Github className="h-4 w-4" /></Button></Link>}
                {user.linkedinUrl && <Link href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" passHref><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8"><Linkedin className="h-4 w-4" /></Button></Link>}
                {user.twitterUrl && <Link href={user.twitterUrl} target="_blank" rel="noopener noreferrer" passHref><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8"><Twitter className="h-4 w-4" /></Button></Link>}
                {user.dribbbleUrl && <Link href={user.dribbbleUrl} target="_blank" rel="noopener noreferrer" passHref><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8"><Dribbble className="h-4 w-4" /></Button></Link>}
                {user.websiteUrl && <Link href={user.websiteUrl} target="_blank" rel="noopener noreferrer" passHref><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8"><Globe className="h-4 w-4" /></Button></Link>}
              </div>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0 md:ml-auto shrink-0 items-center">
              {isOwnProfile ? (
                <>
                <ProfileAnalyzer username={username} isOwnProfile={isOwnProfile} />
               {/* <Link href="/benchmark/analyzing" passHref>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-primary hover:bg-primary/10"
                  
                >
                  <Code2 className="h-4 w-4 mr-1.5" /> Analyze Portfolio
                </Button>
              </Link> */}
                <Link href="/profile/edit" passHref>
                   <Button size="sm" variant="default" className="">
                     <Edit className="h-4 w-4 mr-1.5" /> Edit Profile
                   </Button>
                </Link>
                </>
              ) : user ? (
                 <ProfileActions
                   profileUserId={user.id}
                   initialConnectionStatus={user.connectionStatus}
                   initialConnectionRequestId={user.connectionRequestId}
                   profileUsername={user.username || ''}
                   isUserLoggedIn={!!currentUser}
                 />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {user.bio && (
              <Card className="">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card className="">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Skills</CardTitle>
                {allSkills.length > topSkills.length && (
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Eye className="h-3.5 w-3.5 mr-1"/> View All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="">
                {topSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map((userSkill) => (
                      <Badge className={''} key={userSkill.skillId} variant="secondary">
                        {userSkill.skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </CardContent>
            </Card>

            {/* AI-Verified Skills Section */}
            {aiVerifiedSkills && aiVerifiedSkills.totalSkills > 0 && (
              <AIVerifiedSkills skills={aiVerifiedSkills} />
            )}

            {currentProjects.length > 0 && (
              <Card className={''}>
                <CardHeader className={''}>
                  <CardTitle className="text-lg font-semibold">Currently Working On</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentProjects.map((project) => (
                    <Link key={project.id} href={`/project/${project.id}`} className="block p-3 rounded-md hover:bg-muted/50 transition-colors border border-border/50">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-sm truncate">{project.title}</h4>
                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize text-xs h-5 px-1.5">
                          {project.status?.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Role: {project.role}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="pinned" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger className={''} value="pinned">
                  <Pin className="h-4 w-4 mr-1.5"/> Pinned
                </TabsTrigger>
                <TabsTrigger className={''} value="all">
                  <List className="h-4 w-4 mr-1.5"/> All Projects
                </TabsTrigger>
              </TabsList>

              <TabsContent className={''} value="pinned">
                {pinnedPortfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedPortfolioItems.map((item) => (
                      <PortfolioCard
                        key={item.id}
                        item={{
                          ...item,
                          skills: item.skills || []
                        }}
                        isOwnProfile={isOwnProfile}
                        isPinned={item.isPinned}
                        username={username}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">{isOwnProfile ? "Pin items from the 'All Projects' tab to feature them here." : "No pinned items yet."}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent className={''} value="all">
                {allPortfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allPortfolioItems.map((item) => (
                      <PortfolioCard
                        key={item.id}
                        item={{
                          ...item,
                          skills: item.skills || []
                        }}
                        isOwnProfile={isOwnProfile}
                        isPinned={item.isPinned}
                        username={username}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className={''}>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No portfolio items or projects to display yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <Card className={''}>
              <CardHeader className={''}>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-primary"/> Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {user.experience?.length > 0 ? (
                  user.experience.map((exp, index) => (
                    <div key={exp.id} className="relative pl-6 pb-4 last:pb-0">
                      {index < user.experience.length - 1 && (
                        <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
                      )}
                      <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      </div>
                      <h4 className="font-medium text-sm">{exp.jobTitle}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5"/>{exp.companyName} {exp.location && `· ${exp.location}`}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5"/>
                        {formatShortDate(exp.startDate)} - {exp.current ? 'Present' : exp.endDate ? formatShortDate(exp.endDate) : 'N/A'}
                      </p>
                      {exp.description && <p className="mt-2 text-sm text-muted-foreground">{exp.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No work experience listed.</p>
                )}
              </CardContent>
            </Card>

            <Card className={''}>
              <CardHeader className={''}>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                   <GraduationCap className="h-5 w-5 text-primary"/> Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {user.education?.length > 0 ? (
                  user.education.map((edu, index) => (
                     <div key={edu.id} className="relative pl-6 pb-4 last:pb-0">
                        {index < user.education.length - 1 && (
                          <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
                        )}
                       <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                       </div>
                      <h4 className="font-medium text-sm">{edu.degree || edu.fieldOfStudy || 'Studies'}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                       <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                         <CalendarDays className="h-3.5 w-3.5"/>
                         {formatShortDate(edu.startDate)} - {edu.current ? 'Present' : edu.endDate ? formatShortDate(edu.endDate) : 'N/A'}
                            </p>
                      {edu.description && <p className="mt-2 text-sm text-muted-foreground">{edu.description}</p>}
                        </div>
                      ))
                    ) : (
                  <p className="text-sm text-muted-foreground">No education details available.</p>
                    )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="h-16 md:h-24"></div>
    </div>
  )
}

export default ProfileDetail
