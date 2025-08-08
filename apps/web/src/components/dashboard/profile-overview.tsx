"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, ChevronRight, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Import the userProfile type from DashboardData
import type { DashboardData } from "@/data/dashboard"

// Define the props interface
interface ProfileOverviewProps {
  userProfile: DashboardData['userProfile']; // Use the type from DashboardData
}

// Accept props
export function ProfileOverview({ userProfile }: ProfileOverviewProps) {

  // Handle loading state or null userProfile
  if (!userProfile) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
        </CardContent>
         <CardFooter className="border-t pt-4">
           <Skeleton className="h-8 w-full" />
         </CardFooter>
      </Card>
    );
  }

  // Get user initials for fallback
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || ''
    const last = lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }

  const initials = getInitials(userProfile.firstName, userProfile.lastName);

  // Determine link for edit profile - assumes username exists if userProfile exists
  const editProfileLink = "/profile/edit";
  const viewProfileLink = userProfile.username ? `/${userProfile.username}` : "/profile";

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={""}>Profile Overview</CardTitle>
          <Button className={''} variant="ghost" size="sm" asChild>
            {/* Update link to use dynamic username or fallback */}
            <Link href={editProfileLink}>
              Edit Profile
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription className={''}>Your profile completeness and visibility</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border">
            {/* Use actual profile picture */}
            <AvatarImage className="" src={userProfile.profilePicture || undefined} alt={userProfile.username || "User avatar"} />
            {/* Use actual initials */}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              {/* Use actual name */}
              <h3 className="font-semibold text-lg truncate">
                {userProfile.firstName || ""} {userProfile.lastName || ""}
              </h3>
              {/* Badge can be conditional based on user role or subscription later */}
              {/* <Badge variant="outline" className="text-xs">PRO</Badge> */}
            </div>
            {/* Use actual headline */}
            <p className="text-sm text-muted-foreground truncate">{userProfile.headline || <span className="italic">No headline set</span>}</p>
            {/* Location could be added back if needed */}
            {/* <p className="text-sm text-muted-foreground">San Francisco, CA</p> */}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Profile Completeness</span>
              {/* Use actual completion percentage */}
              <span className="text-sm font-medium">{userProfile.profileCompletionPercentage}%</span>
            </div>
            {/* Use actual completion percentage */}
            <Progress value={userProfile.profileCompletionPercentage} className="h-2" />
          </div>

          {/* Add back incomplete items section using data */}
          {userProfile.incompleteFields && userProfile.incompleteFields.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-sm font-medium">Complete these items:</h4>
              {userProfile.incompleteFields.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {/* Visibility could be dynamic later */}
          <span>Profile is visible</span>
        </div>
        <Button className={''} variant="outline" size="sm" asChild>
          {/* Update link to use dynamic username */}
          <Link href={viewProfileLink}>View Public Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
