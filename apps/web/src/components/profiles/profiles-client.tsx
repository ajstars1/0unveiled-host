"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { getAllUsers } from "@/data/user"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

// Dynamic import for ProfileCard to improve performance
const ProfileCard = dynamic(() => import("@/components/global/userCardv"), {
  loading: () => <ProfileCardSkeleton />,
})

// Dynamic import for NotFoundComp
const NotFoundComp = dynamic(() => import("@/components/global/not-found"), {
  loading: () => (
    <div className="text-center py-12 md:py-16">
      <div className="animate-pulse">
        <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-4"></div>
        <div className="h-6 w-48 bg-muted rounded mx-auto mb-2"></div>
        <div className="h-4 w-64 bg-muted rounded mx-auto"></div>
      </div>
    </div>
  ),
})

const ProfileCardSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
    <div className="flex flex-row items-start gap-4">
      <Skeleton className="h-12 w-12 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
        <Skeleton className="h-3 w-1/4 bg-muted" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton className="h-3 w-12 bg-muted" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full bg-muted" />
        <Skeleton className="h-5 w-20 rounded-full bg-muted" />
        <Skeleton className="h-5 w-14 rounded-full bg-muted" />
      </div>
    </div>
    <div className="mt-4">
      <Skeleton className="h-9 w-full rounded-md bg-muted" />
    </div>
  </div>
)

interface ProfilesClientProps {
  initialUsers?: any[]
}

const ProfilesClient = memo(function ProfilesClient({ initialUsers }: ProfilesClientProps) {
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    initialData: initialUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Helper function to calculate profile completeness
  const calculateProfileCompleteness = useCallback((profile: any): number => {
    let score = 0

    // Basic info (40 points) - check existence and non-empty strings
    if (profile.firstName?.trim()) score += 10
    if (profile.lastName?.trim()) score += 10
    if (profile.headline?.trim()) score += 10
    if (profile.bio?.trim()) score += 10

    // Contact/Social info (20 points)
    if (profile.location?.trim()) score += 5
    if (profile.college?.trim()) score += 5
    if (profile.socialLinks?.length > 0) score += 5
    if (profile.profileImage) score += 5

    // Professional info (25 points)
    if (profile.skills?.length > 0) score += 10
    if (profile.experience?.length > 0) score += 5
    if (profile.education?.length > 0) score += 5
    if (profile.projects?.length > 0) score += 5

    // Additional content (15 points)
    if (profile.coverImage) score += 5
    if (profile.experience?.length > 2) score += 5
    if (profile.projects?.length > 2) score += 5

    return Math.min(score, 100)
  }, [])

  const filterCategories = useMemo(() => {
    if (!allUsers) return ["All"]

    const categories = new Set<string>(["All"])

    // Single pass through all users and their skills
    for (const user of allUsers) {
      if (user.skills) {
        for (const skillItem of user.skills) {
          if (skillItem.skill.category) {
            categories.add(skillItem.skill.category)
          }
        }
      }
    }

    return Array.from(categories).slice(0, 6) // Limit categories shown
  }, [allUsers])

  const filteredProfiles = useMemo(() => {
    if (!allUsers) return []

    interface Skill {
      skill: {
        name: string
        category?: string
      }
    }

    interface Profile {
      id: string
      firstName?: string
      lastName?: string
      headline?: string
      location?: string
      college?: string
      role: string
      onboarded: boolean
      skills: Skill[]
      bio?: string
      experience?: any[]
      education?: any[]
      projects?: any[]
      socialLinks?: any[]
      profileImage?: string
      coverImage?: string
    }

    const searchLower = searchQuery.toLowerCase()

    // Single pass: filter, calculate completeness, and sort
    const processedProfiles = allUsers
      .filter((profile: Profile) => {
        if (profile.role === "ADMIN" || !profile.onboarded) {
          return false
        }

        const matchesSearch = !searchQuery ||
          (profile.firstName && profile.firstName.toLowerCase().includes(searchLower)) ||
          (profile.lastName && profile.lastName.toLowerCase().includes(searchLower)) ||
          (profile.headline && profile.headline.toLowerCase().includes(searchLower)) ||
          (profile.location && profile.location.toLowerCase().includes(searchLower)) ||
          (profile.college && profile.college.toLowerCase().includes(searchLower)) ||
          profile.skills.some((skill: Skill) =>
            skill.skill.name.toLowerCase().includes(searchLower)
          )

        const matchesCategory = selectedCategory === "All" ||
          profile.skills.some((s: Skill) => s.skill.category === selectedCategory)

        return matchesSearch && matchesCategory
      })
      .map((profile: Profile) => ({
        ...profile,
        completenessScore: calculateProfileCompleteness(profile),
        activityScore: profile.skills?.length || 0
      }))

    // Sort by completeness and activity
    interface ProcessedProfile extends Profile {
        completenessScore: number
        activityScore: number
    }

            return processedProfiles.sort((a: ProcessedProfile, b: ProcessedProfile) => {
                // Sort by completeness first (higher completeness = higher priority)
                if (b.completenessScore !== a.completenessScore) {
                    return b.completenessScore - a.completenessScore
                }

                // If completeness is equal, sort by activity (more skills = more active)
                return b.activityScore - a.activityScore
            })
  }, [searchQuery, selectedCategory, allUsers, calculateProfileCompleteness])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  // Memoize expensive computations
  const searchPlaceholder = "Search by name, skills, college, location..."
  const hasMultipleCategories = filterCategories.length > 1

  return (
    <>
      {/* Search and Filters */}
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {/* Search Input */}
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            className="pl-10 h-11 rounded-full bg-muted/50 border-transparent focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {hasMultipleCategories && (
          <div className="flex justify-center w-full">
            {/* Tabs for larger screens */}
            <Tabs
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              className="hidden sm:block"
            >
              <TabsList className="bg-muted/50 p-1 rounded-full inline-flex max-w-full overflow-hidden border border-border/50">
                {filterCategories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-sm px-4 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Dropdown for smaller screens */}
            <div className="sm:hidden w-full max-w-xs mx-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between rounded-full h-11 bg-muted/50 border-border/50 hover:bg-muted transition-colors duration-200"
                  >
                    {selectedCategory}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-(--radix-dropdown-menu-trigger-width) bg-card border-border/50"
                >
                  {filterCategories.map((category) => (
                    <DropdownMenuItem
                      inset={false}
                      className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors duration-200"
                      key={category}
                      onSelect={() => handleCategoryChange(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile: any) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <NotFoundComp
                icon="avatar"
                title="No Profiles Found"
                description="No users match your current search and filter criteria. Try adjusting your search terms."
              />
            </div>
          )}
        </>
      )}
    </>
  )
})

ProfilesClient.displayName = "ProfilesClient"

export default ProfilesClient
