"use client"

import type React from "react"
import { useState } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updatePassword } from "@/actions/settings"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface AccountSettingsProps {
  canChangePassword: boolean;
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button size="default" variant="default" className="" type="submit" disabled={pending} form="password-form">
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

export function AccountSettings({ canChangePassword }: AccountSettingsProps) {
  const initialState = { message: "", errors: {} };
  const [state, dispatch] = useActionState(updatePassword, initialState);

  return (
    <div className="space-y-6">
      {canChangePassword && (
        <Card className="">
          <CardHeader className="">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="">Password</CardTitle>
            </div>
            <CardDescription className="">Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="">
            <form id="password-form" action={dispatch} className="space-y-4" >
              <div className="space-y-2">
                <Label className="" htmlFor="currentPassword">Current Password</Label>
                <Input className="" id="currentPassword" name="currentPassword" type="password" required />
                {state?.errors?.currentPassword && (
                    <p className="text-sm text-red-500">{state.errors.currentPassword.join(", ")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="" htmlFor="newPassword">New Password</Label>
                <Input className="" id="newPassword" name="newPassword" type="password" required />
                {state?.errors?.newPassword && (
                    <p className="text-sm text-red-500">{state.errors.newPassword.join(", ")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="" htmlFor="confirmPassword">Confirm New Password</Label>
                <Input className="" id="confirmPassword" name="confirmPassword" type="password" required />
                {state?.errors?.confirmPassword && (
                    <p className="text-sm text-red-500">{state.errors.confirmPassword.join(", ")}</p>
                )}
              </div>
              {state?.message && !state.errors && (
                  <p className={`text-sm text-green-500`}>{state.message}</p>
              )}
              {state?.message && state.errors && (
                 <p className={`text-sm text-red-500`}>{state.message}</p>
              )}
            </form>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between">
            <Button size="default" variant="outline" className="" type="reset">Cancel</Button>
            <PasswordSubmitButton />
          </CardFooter>
        </Card>
      )}
      {!canChangePassword && (
         <Card className="">
            <CardHeader className="">
               <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="">Password</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="">
               <p className="text-sm text-muted-foreground">
                  Password management is handled by your identity provider (e.g., Google, GitHub).
               </p>
            </CardContent>
         </Card>
      )}
    </div>
  )
}
