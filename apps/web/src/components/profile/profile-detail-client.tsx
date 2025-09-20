"use client";

import React, { Suspense } from "react";

// Import optimized components
import ProfileHeader from "@/components/profile/profile-header"
import { ProfileSkills } from "@/components/profile/profile-skills"
import ProfilePortfolio from "@/components/profile/profile-portfolio"
import OptimizedProfileHeader from "@/components/profile/optimized-profile-header"
import OptimizedExperienceEducation from "@/components/profile/optimized-experience-education"
import ProfileErrorBoundary from "@/components/profile/profile-error-boundary"
import ProfileLoading from "@/components/profile/profile-loading"
import ProfileStructuredData from "@/components/profile/profile-structured-data"

// Client component for the profile page
function ProfileDetailClient({ 
  username, 
  initialData 
}: { 
  username: string; 
  initialData: any; 
}) {
  return (
    <>
      {/* Structured Data for SEO */}
      <ProfileStructuredData
        user={initialData.user}
        aiSkills={initialData.aiSkills}
        leaderboard={initialData.leaderboard}
        username={username}
      />
      
      <ProfileErrorBoundary username={username}>
        <Suspense fallback={<ProfileLoading />}>
          <div className="py-20 lg:py-24">
            <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
              {/* Profile Header Component */}
              <ProfileHeader 
                user={initialData.user}
                fullName={`${initialData.user.firstName} ${initialData.user.lastName || ''}`.trim()}
                isOwnProfile={initialData.user.connectionStatus === 'SELF'}
                username={username}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  {/* Optimized Profile Header with Leaderboard and About */}
                  <OptimizedProfileHeader
                    user={initialData.user}
                    fullName={`${initialData.user.firstName} ${initialData.user.lastName || ''}`.trim()}
                    isOwnProfile={initialData.user.connectionStatus === 'SELF'}
                    username={username}
                    leaderboardData={initialData.leaderboard}
                  />

                  {/* Skills Card */}
                  <div className="space-y-4">
                    <div className="text-lg font-semibold">Skills</div>
                    <ProfileSkills
                      topSkills={(initialData.user.skills || []).slice(0, 10).map((skill: any) => ({
                        skillId: skill.skillId,
                        userId: skill.userId,
                        skill: {
                          id: skill.skill.id,
                          name: skill.skill.name,
                          category: skill.skill.category || undefined
                        },
                        level: skill.level || undefined
                      }))}
                      aiVerifiedSkills={initialData.aiSkills ? {
                        languages: initialData.aiSkills.languages || [],
                        frameworks: initialData.aiSkills.frameworks || [],
                        libraries: initialData.aiSkills.libraries || [],
                        tools: initialData.aiSkills.tools || [],
                        databases: initialData.aiSkills.databases || [],
                        cloud: initialData.aiSkills.cloud || [],
                        totalSkills: initialData.aiSkills.totalSkills,
                        lastVerified: initialData.aiSkills.lastVerified
                      } : undefined}
                      showAll={false}
                    />
                  </div>

                  {/* Experience and Education */}
                  <OptimizedExperienceEducation user={initialData.user} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {/* Portfolio Section */}
                  <ProfilePortfolio
                    pinnedItems={(initialData.user.showcasedItems || []).filter((item: any) => item.isPinned)}
                    allItems={initialData.user.showcasedItems || []}
                    isOwnProfile={initialData.user.connectionStatus === 'SELF'}
                    username={username}
                  />
                </div>
              </div>
            </div>
          </div>
        </Suspense>
      </ProfileErrorBoundary>
    </>
  );
}

export default ProfileDetailClient;
