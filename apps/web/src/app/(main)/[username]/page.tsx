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

// Import optimized components
import ProfileHeader from "@/components/profile/profile-header"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { ProfileMain } from "@/components/profile/profile-main"

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
    keywords: [
      user.username,
      fullName,
      "developer",
      "profile",
      "portfolio",
      ...((user.skills?.map((s: any) => s.skill.name) || []).slice(0, 5))
    ].filter(Boolean),
    authors: [{ name: fullName }],
    creator: fullName,
    publisher: "0Unveiled",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://0unveiled.com"),
    alternates: {
      canonical: `/${user.username}`,
    },
    openGraph: {
      title: pageTitle,
      description: description,
      url: `https://0unveiled.com/${user.username}`,
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${fullName}'s Profile Picture`,
        },
      ],
      siteName: "0Unveiled",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [ogImageUrl],
      creator: "@0unveiled",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "profile:username": user.username || "",
      "profile:first_name": user.firstName || "",
      "profile:last_name": user.lastName || "",
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

  // isOwnProfile can also be determined by connectionStatus === 'SELF'
  const isOwnProfile = user.connectionStatus === 'SELF'
  const fullName = `${user.firstName} ${user.lastName || ''}`.trim()

  // Generate structured data for the profile
  const profileStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": fullName,
      "alternateName": user.username,
      "description": user.headline || user.bio || `Check out ${fullName}'s profile on 0Unveiled.`,
      "image": user.profilePicture,
      "url": `https://0unveiled.com/${user.username}`,
      "knowsAbout": user.skills?.map((skill: any) => skill.skill.name) || [],
      "hasOccupation": user.headline ? {
        "@type": "Occupation",
        "name": user.headline,
        "occupationLocation": user.location
      } : undefined
    }
  }

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
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileStructuredData),
        }}
      />

      <div className="relative py-20 lg:py-24">
        <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
          {/* Profile Header Component */}
          <ProfileHeader
            user={user}
            fullName={fullName}
            isOwnProfile={isOwnProfile}
            username={username}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProfileSidebar
                  user={user}
                  isOwnProfile={isOwnProfile}
                  username={username}
                  initialLeaderboardData={leaderboardData}
                  initialAiSkillsData={aiVerifiedSkillsData}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <ProfileMain
                pinnedItems={pinnedPortfolioItems as any}
                allItems={allPortfolioItems as any}
                isOwnProfile={isOwnProfile}
                username={username}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetail
