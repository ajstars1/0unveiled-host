import { Briefcase as BriefcaseIcon, Building, CalendarDays, Trophy, ArrowRight, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatShortDate, cn } from "@/lib/utils"
// import { ProfileSkills } from "@/components/profile/profile-skills"
import { ProfileSkills } from "@/components/profile/profile-skills"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileSidebarProps {
  user: any;
  isOwnProfile: boolean;
  username: string;
  initialLeaderboardData?: any;
  initialAiSkillsData?: any;
}

export function ProfileSidebar({ user, isOwnProfile, username, initialLeaderboardData, initialAiSkillsData }: ProfileSidebarProps) {
  const leaderboardData = initialLeaderboardData;
  const aiVerifiedSkillsData = initialAiSkillsData;

  const hasLeaderboardData = leaderboardData && 'success' in leaderboardData;
  const userRank = hasLeaderboardData ? leaderboardData.rank : null;
  const userScore = hasLeaderboardData ? leaderboardData.score : null;

  // Transform AI skills
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

  // Transform user skills
  const transformedSkills = (user.skills || []).map((skill:any) => ({
    skillId: skill.skillId,
    userId: skill.userId,
    skill: {
      id: skill.skill.id,
      name: skill.skill.name,
      category: skill.skill.category || undefined
    },
    level: skill.level || undefined
  }));
  const topSkills = transformedSkills.slice(0, 10)

  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Leaderboard Card */}
      <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {leaderboardData && 'success' in leaderboardData && (userRank !== null || userScore !== null) ? (
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
                        className="bg-primary/10 text-primary border-primary/20"
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
                    "bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50",
                    "shadow-inner"
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
                  <div className="absolute -top-4 -right-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-xs font-semibold text-center shadow-lg">
                    Top {userRank <= 3 ? userRank : 10}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No leaderboard data available</p>
            </div>
          )}

          <div className="mt-4">
            <Link href="/leaderboard" className="w-full">
              <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                <span>View Full Leaderboard</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {user.bio && (
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground">About</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {user.bio}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <ProfileSkills
            topSkills={topSkills}
            aiVerifiedSkills={aiVerifiedSkills}
            showAll={false}
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <BriefcaseIcon className="h-5 w-5 text-primary" /> Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {user.experience?.length > 0 ? (
            user.experience.map((exp: any, index: number) => (
              <div key={exp.id} className="relative pl-6 pb-4 last:pb-0 group">
                {index < user.experience.length - 1 && (
                  <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gradient-to-b from-border to-border/50" />
                )}
                <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                </div>
                <h4 className="font-medium text-sm text-foreground hover:text-primary transition-colors duration-200">{exp.jobTitle}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-primary/70" />
                  {exp.companyName} {exp.location && `· ${exp.location}`}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
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
            <div className="text-center text-muted-foreground py-4">
              <BriefcaseIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No work experience listed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" /> Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {user.education?.length > 0 ? (
            user.education.map((edu: any, index: number) => (
              <div key={edu.id} className="relative pl-6 pb-4 last:pb-0 group">
                {index < user.education.length - 1 && (
                  <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gradient-to-b from-border to-border/50" />
                )}
                <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                </div>
                <h4 className="font-medium text-sm text-foreground hover:text-primary transition-colors duration-200">
                  {edu.degree || edu.fieldOfStudy || "Studies"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {edu.institution}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
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
            <div className="text-center text-muted-foreground py-4">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No education details available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
