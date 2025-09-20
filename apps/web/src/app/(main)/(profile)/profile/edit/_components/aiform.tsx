"use client"

import * as React from 'react';
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import PersonalInfoForm from "@/components/profile/ai/personal-info-form"
import PortfolioForm from "@/components/profile/ai/portfolio-form"
import GithubIntegration from "@/components/profile/ai/github-integration"
import { getAuthenticatedUser } from "@/actions/auth"
import { User as PrismaUser, Account, UserSkill, Skill, memberRoleEnum } from "@0unveiled/database/schema"
import ExperienceEducationForm from "@/components/profile/ai/experience-education-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"





// Define a more specific type for the user data fetched in this component
type UserWithAccountsAndSkills = PrismaUser & {
  accounts?: Account[];
  skills?: (UserSkill & { skill: Skill })[];
};

// Define tab data for easier management
const profileEditTabs = [
  { value: "personal-info", label: "Personal Info" },
  { value: "experience-education", label: "Experience & Education" },
  { value: "portfolio", label: "Portfolio" },
  { value: "integrations", label: "Integrations" },
];

export default function ProfileEditForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  
  // Helper function to check if a tab value is valid
  const isValidTab = (tab: string | null) => profileEditTabs.some(t => t.value === tab);

  // Initialize activeTab based on URL searchParam 'tab', default to first tab
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => 
      isValidTab(initialTab) ? initialTab! : profileEditTabs[0].value
  );

  // Function to handle tab changes and update URL
  const handleTabChange = (newTabValue: string) => {
    if (isValidTab(newTabValue)) {
      setActiveTab(newTabValue);
      // Update URL using replace to avoid adding to history
      const currentPath = window.location.pathname;
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', newTabValue);
      const newUrl = `${currentPath}?${newSearchParams.toString()}`;
      // Use replaceState for silent URL update
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    } else {
       // Optional: handle invalid tab value if needed, e.g., default or show error
       console.warn(`Attempted to navigate to invalid tab: ${newTabValue}`);
       // Fallback to default tab
       handleTabChange(profileEditTabs[0].value);
    }
  };

  // Update activeTab if URL searchParam changes (e.g., browser back/forward)
  useEffect(() => {
    const currentQueryTab = searchParams.get('tab');
    // Check if the URL param is valid
    if (isValidTab(currentQueryTab)) {
      // If the valid URL tab is different from the current state, update the state
      if (currentQueryTab !== activeTab) {
        setActiveTab(currentQueryTab!);
      }
    } else {
      // If URL tab is invalid or missing, ensure state reflects the default
      // and potentially update the URL back to the default (optional, prevents invalid URL state)
      if (activeTab !== profileEditTabs[0].value) {
        // Using handleTabChange ensures state and URL are updated consistently
        handleTabChange(profileEditTabs[0].value); 
      }
    }
    // Only run this effect when searchParams object reference changes (external navigation)
  }, [searchParams]); // Removed activeTab from dependencies

  // Fetch user profile data using React Query
  // const { data: userData, isLoading, isError } = useUserProfile()
   // Fetch authenticated user data
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: userError,
  } = useQuery<UserWithAccountsAndSkills, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await getAuthenticatedUser()
      if (result.error || !result.data) {
        console.error("getAuthenticatedUser error:", result.error)
        throw new Error(result.error || "Failed to fetch user data.")
      }
      // Explicitly cast result.data to include relations
      const userData = result.data as (PrismaUser & { skills?: (UserSkill & { skill: Skill })[], accounts?: Account[] });
      
      
      // Now access skills from the correctly typed userData
      const transformedUser: UserWithAccountsAndSkills = {
        ...userData,
        skills: userData.skills?.map((s: UserSkill & { skill: Skill }) => ({
          id: s.skillId,
          name: s.skill.name,
          description: s.skill.description,
          category: s.skill.category,
          value: s.skill.id,
          userId: s.userId,
          skillId: s.skillId,
          level: s.level,
          skill: s.skill
        })) || []
      };
      return transformedUser;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const githubSetupParam = searchParams.get('github_setup');
    if (githubSetupParam === 'complete') {
      // Invalidate all relevant queries to ensure UI updates properly
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Invalidate all relevant queries to ensure UI updates properly
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Immediately refetch user data to update UI
      queryClient.refetchQueries({ queryKey: ['user'] }).then(() => {
        // Only after user data is refreshed, refresh GitHub repos
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['githubRepos', user?.id] });
        }, 500);
      });
      
      // Show a success toast to the user
      toast({
        title: "GitHub Connected",
        description: "Your GitHub account has been successfully connected. Refreshing data...",
      });
      
      // Remove the query param from the URL without reloading the page
      const currentPath = window.location.pathname;
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('github_setup');
      const newUrl = `${currentPath}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams, queryClient, user?.id]);

  const handleCancel = () => {
    router.push("/profile")
  }

  // Handle saving all profile data
  const handleSaveProfile = async () => {
    // This would typically validate all forms and submit data
    // For this example, we'll just show a success message
    toast({
      title: "Success",
      description: "Your profile has been updated successfully.",
    })

    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    queryClient.invalidateQueries({ queryKey: ["userSkills"] })
    queryClient.invalidateQueries({ queryKey: ["userPortfolio"] })
    queryClient.invalidateQueries({ queryKey: ["githubRepos"] })
  }

  // --- Loading State --- 
  if (isLoadingUser ) {
    // Keep existing Skeleton/Loading state with original TabsList grid
    return (
       <Tabs defaultValue={profileEditTabs[0].value} value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="grid grid-cols-4 mb-8">
           <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
           <TabsTrigger value="experience-education">Experience & Education</TabsTrigger>
           <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
           <TabsTrigger value="integrations">Integrations</TabsTrigger>
         </TabsList>
         <TabsContent value="personal-info">
           <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Personal Information & Skills</h2>
                </div>
                <Separator className="mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="col-span-1 flex flex-col items-center">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="overflow-hidden">
                            {/* ... Skeleton content ... */}
                            <div className="pt-6 space-y-3">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        </div>
                    ))}
                <div className="grid col-span-2 gap-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
                </div>
                </div>
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                  
                  </div>
            </CardContent>
        </Card>
        </TabsContent>
     </Tabs>
    )
  }

  // --- Error State --- 
  if (isErrorUser || !user) {
    // Keep existing Error state
     return (
       <div className="container mx-auto py-8 px-4">
         <div className="flex justify-center items-center h-64">
           <div className="text-xl text-red-500">Failed to load profile data. Please refresh the page.</div>
         </div>
       </div>
     )
   }

  // Find the label for the currently active tab for the dropdown trigger
  const activeTabLabel = profileEditTabs.find(tab => tab.value === activeTab)?.label || 'Select Tab';

  // --- Main Content --- 
  return (
      <Tabs defaultValue={profileEditTabs[0].value} value={activeTab} onValueChange={handleTabChange} className="w-full">
        
        {/* Original TabsList - visible on sm screens and up */}
        <TabsList className="hidden sm:grid w-full grid-cols-4 mb-8">
          {profileEditTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* DropdownMenu - visible below sm screens */}
        <div className="sm:hidden mb-8"> { /* Wrapper div only visible on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {activeTabLabel}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[calc(100vw-2rem)] max-w-sm mx-auto">
              {profileEditTabs.map((tab) => (
                <DropdownMenuItem key={tab.value} onSelect={() => handleTabChange(tab.value)}>
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs Content stays the same */}
        <TabsContent value="personal-info">
          <PersonalInfoForm user={{ 
              id: user.id,
              supabaseId: user.supabaseId,
              email: user.email,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture,
              bio: user.bio,
              role: user.role,
              onboarded: user.onboarded,
              lastLogin: user.lastLogin,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              college: user.college,
              location: user.location,
              headline: user.headline,
              websiteUrl: user.websiteUrl,
              githubUrl: user.githubUrl,
              linkedinUrl: user.linkedinUrl,
              twitterUrl: user.twitterUrl,
              dribbbleUrl: user.dribbbleUrl,
              behanceUrl: user.behanceUrl,
              emailFrequency: user.emailFrequency,
              notifyAchievements: user.notifyAchievements,
              notifyConnections: user.notifyConnections,
              notifyEvents: user.notifyEvents,
              notifyMessages: user.notifyMessages,
              notifyProjects: user.notifyProjects,
              // Explicitly omit accounts and skills from the passed prop
           }} />
        </TabsContent>
        <TabsContent value="experience-education">
          <ExperienceEducationForm userId={user.id} />
        </TabsContent>
        <TabsContent value="portfolio">
          <PortfolioForm userId={user.id} />
        </TabsContent>
        <TabsContent value="integrations">
          <GithubIntegration 
            userId={user.id} 
            // Pass a more specific prop indicating if the App installation is linked
            isGithubAppInstalled={user.accounts?.some((acc: Account) => acc.provider === 'github' && acc.installationId) ?? false} 
          />
          {/* <GithubIntegration userId={user.id} hasGithubAccount={user.githubAccessToken !== null} /> */}
        </TabsContent>
      </Tabs>
  )
}
