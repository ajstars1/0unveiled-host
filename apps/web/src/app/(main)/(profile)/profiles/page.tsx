"use client"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, Filter, SlidersHorizontal, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NotFoundComp from "@/components/global/not-found"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getAllUsers } from "@/data/user"
// import { Loader } from "@/components/global/loader"
import ProfileCard from "@/components/global/userCardv"
import { Skeleton } from "@/components/ui/skeleton"
import { memberRoleEnum } from "@0unveiled/database/schema"

const ProfileCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden h-full">
    <div className="flex flex-row items-start gap-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4 mt-1" />
      </div>
    </div>
    <div className="p-4 pt-0 grow">
      <Skeleton className="h-3 w-12 mb-2" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
    <div className="p-4 pt-2">
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
)

export default function Profiles() {
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All") // State for filter tabs

  const filterCategories = useMemo(() => {
    const categories = new Set<string>(["All"])
    allUsers?.forEach((user) => {
      user.skills?.forEach((s) => {
        if (s.skill.category) categories.add(s.skill.category)
      })
    })
    return Array.from(categories).slice(0, 6) // Limit categories shown
  }, [allUsers])

  const filteredProfiles = useMemo(() => {
    if (!allUsers) return []

    return allUsers
      ?.filter((profile) => {
        if (profile.role === Role.ADMIN || !profile.onboarded) {
          return false;
        }

        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = searchQuery === "" ||
          (profile.firstName && profile.firstName.toLowerCase().includes(searchLower)) ||
          (profile.lastName && profile.lastName.toLowerCase().includes(searchLower)) ||
          (profile.headline && profile.headline.toLowerCase().includes(searchLower)) ||
          (profile.location && profile.location.toLowerCase().includes(searchLower)) ||
          (profile.college && profile.college.toLowerCase().includes(searchLower)) ||
          profile.skills.some((skill) =>
            skill.skill.name.toLowerCase().includes(searchLower)
          )

        const matchesCategory = selectedCategory === "All" ||
          profile.skills.some((s) => s.skill.category === selectedCategory)

        return matchesSearch && matchesCategory
      })
  }, [searchQuery, selectedCategory, allUsers])

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Profiles</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Discover talented individuals, connect, and collaborate on exciting projects.
        </p>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <div className="relative w-full max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, skills, college, location, or headline..."
            className="pl-10 h-10 rounded-full bg-muted border-transparent focus:border-primary focus:bg-background focus:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filterCategories.length > 1 && (
          <div className="flex justify-center w-full">
            {/* Tabs for larger screens */}
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="hidden sm:block"
            >
              <TabsList className="bg-muted p-1 rounded-full inline-flex max-w-full overflow-hidden">
                {filterCategories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-sm px-4 py-1.5 rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
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
                  <Button variant="outline" className="w-full justify-between rounded-full">
                    {selectedCategory}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-(--radix-dropdown-menu-trigger-width)">
                  {filterCategories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onSelect={() => setSelectedCategory(category)}
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

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ProfileCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && (
        <>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <NotFoundComp
              icon="avatar"
              title="No Profiles Found"
              description="No users match your current search and filter criteria."
            />
          )}
        </>
      )}
    </div>
  )
}
