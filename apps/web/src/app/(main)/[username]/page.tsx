import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getUserByUsername, getCurrentUser, type UserProfileDetails } from "@/data/user"
import { getAIVerifiedSkillsByUsername } from "@/data/user"
import { getLeaderboardDataByUsername } from "@/data/leaderboard"
import dynamic from "next/dynamic"

// Performance and SEO optimizations
export const revalidate = 3600; // Revalidate every hour for fresh data
export const dynamicParams = true; // Allow dynamic params for user profiles

// Dynamically import components for better performance and code splitting
const ProfileHeader = dynamic(() => import("@/components/profile/profile-header").then(mod => mod.default), {
  loading: () => <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
})
const ProfileSidebar = dynamic(() => import("@/components/profile/profile-sidebar").then(mod => mod.ProfileSidebar as React.ComponentType<any>), {
  loading: () => <div className="space-y-4"><div className="h-64 bg-muted/20 rounded-lg animate-pulse" /></div>
})
const ProfileMain = dynamic(() => import("@/components/profile/profile-main").then(mod => mod.ProfileMain as React.ComponentType<any>), {
  loading: () => <div className="space-y-4"><div className="h-96 bg-muted/20 rounded-lg animate-pulse" /></div>
})

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

  try {
    // Fetch currentUser first to get the ID for the profile fetch
    const currentUser: Awaited<ReturnType<typeof getCurrentUser>> = await getCurrentUser()
    const user: UserProfileDetails | null = await getUserByUsername(username, currentUser?.id) // Pass current user ID

    if (!user) {
      notFound()
    }

    const fullName = `${user.firstName} ${user.lastName || ''}`.trim()
    const pageTitle = `${fullName}'s Profile | 0Unveiled`
    const description = user.headline || user.bio || `Check out ${fullName}'s profile, projects, and skills on 0Unveiled.`
    const ogImageUrl = user.profilePicture || "/og-image.png"

    // Extract skills for keywords
    const skillKeywords = (user.skills?.map((s: any) => s.skill.name) || []).slice(0, 5)

    return {
      title: pageTitle,
      description: description,
      keywords: [
        user.username,
        fullName,
        "developer",
        "profile",
        "portfolio",
        "software engineer",
        "coding",
        "programming",
        ...skillKeywords
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
  } catch (error) {
    // Fallback metadata for error cases
    return {
      title: "Profile | 0Unveiled",
      description: "Developer profile on 0Unveiled",
      robots: "noindex, nofollow",
    }
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

  try {
    // Fetch currentUser first
    const currentUser = await getCurrentUser()

    // Parallelize data fetching for better performance with error handling
    const [userResult, aiSkillsResult, leaderboardResult] = await Promise.allSettled([
      getUserByUsername(username, currentUser?.id),
      getAIVerifiedSkillsByUsername(username),
      getLeaderboardDataByUsername(username)
    ]);

    const user = userResult.status === 'fulfilled' ? userResult.value as UserProfileDetails : null;
    const aiVerifiedSkillsData = aiSkillsResult.status === 'fulfilled' ? aiSkillsResult.value : null;
    const leaderboardData = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null;

    if (!user) {
      notFound()
    }

    // Filter out seed users
    if (user.username === 'seed_user_1746410303039') {
      notFound()
    }

    // isOwnProfile can also be determined by connectionStatus === 'SELF'
    const isOwnProfile = user.connectionStatus === 'SELF'
    const fullName = `${user.firstName} ${user.lastName || ''}`.trim()

    // Generate structured data for the profile with enhanced SEO
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
        } : undefined,
        "sameAs": [
          user.githubUrl,
          user.linkedinUrl,
          user.twitterUrl,
          user.websiteUrl
        ].filter(Boolean)
      },
      "publisher": {
        "@type": "Organization",
        "name": "0Unveiled",
        "url": "https://0unveiled.com"
      }
    }

    // Prepare data for components with error handling
    const transformedSkills = (user.skills || []).map(skill => ({
      skillId: skill.skillId,
      userId: skill.userId,
      skill: {
        id: skill.skill.id,
        name: skill.skill.name,
        category: skill.skill.category || undefined
      },
      level: skill.level || undefined
    }));

    const allPortfolioItems = user.showcasedItems || []
    const pinnedPortfolioItems = allPortfolioItems.filter(item => item.isPinned)

    return (
      <div className="min-h-screen bg-background">
        {/* Background gradient - optimized for performance */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        {/* Structured Data - Enhanced for SEO */}
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
  } catch (error) {
    console.error('Error loading profile:', error);
    notFound();
  }
}

export default ProfileDetail
