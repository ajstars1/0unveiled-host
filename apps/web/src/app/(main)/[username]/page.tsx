import {
  Briefcase as BriefcaseIcon,
  Building,
  CalendarDays,
  Code2,
  Trophy,
  ArrowRight,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getUserByUsername, getCurrentUser } from "@/data/user"
import { getAIVerifiedSkillsByUsername } from "@/data/user"
import { notFound } from "next/navigation"
import { formatShortDate, cn } from "@/lib/utils"
import { Metadata } from "next"
import { getLeaderboardDataByUsername } from "@/data/leaderboard"

// Import optimized components
import ProfileHeader from "@/components/profile/profile-header"
import { ProfileSkills } from "@/components/profile/profile-skills"
import ProfilePortfolio from "@/components/profile/profile-portfolio"

// Define props for ProfileHeader component
interface ProfileHeaderProps {
  user: any;
  fullName: string;
  isOwnProfile: boolean;
  username: string;
}

// Remove dynamic imports for now as they're causing TypeScript errors
// import dynamic from "next/dynamic"
// const ProfileAnalyzer = dynamic(() => import("@/components/profile/profile-analyzer").then(mod => mod.ProfileAnalyzer), { ssr: true })
// const ProfileActions = dynamic(() => import("@/components/profile/profile-actions").then(mod => mod.ProfileActions), { ssr: true })

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
  const currentUser: Awaited<ReturnType<typeof getCurrentUser>> = await getCurrentUser()
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
  
  // Parallelize data fetching for better performance
  const [user, aiVerifiedSkillsData, leaderboardData] = await Promise.all([
    getUserByUsername(username, currentUser?.id),
    getAIVerifiedSkillsByUsername(username),
    getLeaderboardDataByUsername(username)
  ]);

  if (!user) {
    notFound()
  }
  if(user.username === 'seed_user_1746410303039') {
    notFound()
  }

  // Process data once
  const hasLeaderboardData = leaderboardData && 'success' in leaderboardData;
  const userRank = hasLeaderboardData ? leaderboardData.rank : null;
  const userScore = hasLeaderboardData ? leaderboardData.score : null;

  // Transform AI skills to match expected AIVerifiedSkillsData type
  const aiVerifiedSkills = aiVerifiedSkillsData ? {
    languages: aiVerifiedSkillsData.languages || [],
    frameworks: aiVerifiedSkillsData.frameworks || [],
    libraries: aiVerifiedSkillsData.libraries || [],
    tools: aiVerifiedSkillsData.tools || [],
    databases: aiVerifiedSkillsData.databases || [],
    cloud: aiVerifiedSkillsData.cloud || [],
    totalSkills: aiVerifiedSkillsData.totalSkills,
    lastVerified: aiVerifiedSkillsData.lastVerified
  } : undefined;

  // isOwnProfile can also be determined by connectionStatus === 'SELF'
  const isOwnProfile = user.connectionStatus === 'SELF'
  const fullName = `${user.firstName} ${user.lastName || ''}`.trim()

  // Prepare data for components
  // Transform user skills to match expected UserSkill type
  const transformedSkills = (user.skills || []).map(skill => ({
    skillId: skill.skillId,
    userId: skill.userId,
    skill: {
      id: skill.skill.id,
      name: skill.skill.name,
      category: skill.skill.category || undefined // Convert null to undefined
    },
    level: skill.level || undefined // Convert null to undefined
  }));
  const topSkills = transformedSkills.slice(0, 10)
  const allSkills = transformedSkills
  const allPortfolioItems = user.showcasedItems || []
  const pinnedPortfolioItems = allPortfolioItems.filter(item => item.isPinned)
  const allProjects = user.projectsOwned || [];

  return (
    <div className="py-20 lg:py-24">
      <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
        {/* Profile Header Component */}
        <ProfileHeader 
          user={user}
          fullName={fullName}
          isOwnProfile={isOwnProfile}
          username={username}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Leaderboard Card */}
            {(userRank !== null || userScore !== null) && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" /> Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {userRank !== null && (
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-muted-foreground">
                            Rank
                          </div>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-foreground mr-1">
                              #{userRank}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary"
                            >
                              Global
                            </Badge>
                          </div>
                        </div>
                      )}

                      {userScore !== null && (
                        <div className="space-y-0.5 mt-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            Score
                          </div>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-foreground">
                              {userScore}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              pts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative flex items-center justify-center">
                      <div
                        className={cn(
                          "h-24 w-24 rounded-full flex items-center justify-center",
                          "bg-gradient-to-br from-primary/10 to-secondary/10 border border-border"
                        )}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {userScore !== null ? userScore : "-"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Points
                          </div>
                        </div>
                      </div>
                      {userRank !== null && userRank <= 10 && (
                        <div className="absolute -top-4 -right-1 bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-xs font-semibold text-center">
                          Top {userRank <= 3 ? userRank : 10}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href="/leaderboard" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        <span>View Full Leaderboard</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.bio && (
              <Card className="">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {user.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Use optimized skills component */}
                <ProfileSkills
                  topSkills={topSkills}
                  aiVerifiedSkills={aiVerifiedSkills}
                  showAll={false}
                  // compact={false}
                  // showConfidence={true}
                />
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-primary" /> Experience
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
                        <Building className="h-3.5 w-3.5" />
                        {exp.companyName} {exp.location && `· ${exp.location}`}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatShortDate(exp.startDate)} -{" "}
                        {exp.current
                          ? "Present"
                          : exp.endDate
                            ? formatShortDate(exp.endDate)
                            : "N/A"}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No work experience listed.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={""}>
              <CardHeader className={""}>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Education
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
                      <h4 className="font-medium text-sm">
                        {edu.degree || edu.fieldOfStudy || "Studies"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatShortDate(edu.startDate)} -{" "}
                        {edu.current
                          ? "Present"
                          : edu.endDate
                            ? formatShortDate(edu.endDate)
                            : "N/A"}
                      </p>
                      {edu.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No education details available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Optimized Portfolio Component */}
            <ProfilePortfolio
              pinnedItems={pinnedPortfolioItems as any}
              allItems={allPortfolioItems as any}
              isOwnProfile={isOwnProfile}
              username={username}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetail
