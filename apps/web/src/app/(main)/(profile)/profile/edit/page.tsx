import React from "react"
import ProfileEditForm from "./_components/aiform"
import { getCurrentUser } from "@/data/user"
import { redirect } from "next/navigation"
import { getUserByUserId } from "@/data/user"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"

export default async function ProfileEditPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser?.id) {
    redirect("/login")
  }

  const userProfile = await getUserByUserId(currentUser.id)

  if (!userProfile) {
    return <div>Error loading profile data.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-3xl font-bold mb-6">Edit Your Profile</h1> */}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={userProfile.profileCompletionPercentage} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">{userProfile.profileCompletionPercentage}% complete</p>
          <p className="text-xs text-muted-foreground text-center">Fill out all sections to reach 100%!</p>
        </CardContent>
      </Card>

      {/* <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <div className="flex gap-4">
          <Button variant="outline" >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button >
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </div> */}
      <ProfileEditForm />
    </div>
  )
}
