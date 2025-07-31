"use client"

import * as z from "zod"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updateNotificationSettings } from "@/actions/settings" // Assume this action exists
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, MessageSquare, Users, Briefcase, Award, Calendar } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect } from "react"
import { toast } from "sonner" // Using sonner for feedback

// Define the expected type for the settings prop based on the schema
import type { EmailFrequency } from "@0unveiled/database/schema" // Import the enum type

interface NotificationSettingsProps {
  settings: {
    notifyMessages: boolean;
    notifyConnections: boolean;
    notifyProjects: boolean;
    notifyAchievements: boolean;
    notifyEvents: boolean;
    emailFrequency: EmailFrequency;
  };
}

// Submit button component
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Preferences"}
    </Button>
  );
}

// Main component
export function NotificationSettings({ settings }: NotificationSettingsProps) {

  // Initial state for useFormState
  const initialState: { message?: string; errors?: Record<string, string[]>; success?: boolean } = {};
  
  // Use useActionState instead of useFormState
  const [state, dispatch] = useActionState(updateNotificationSettings, initialState);

  // Show toast on success/error messages from the server action
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Settings updated successfully!");
    } else if (state?.message && !state.success) {
        // Check if there are specific errors to display, otherwise show general message
        if (!state.errors || Object.keys(state.errors).length === 0) {
           toast.error(state.message || "Failed to update settings.");
        }
        // Specific field errors are displayed below the fields themselves
    }
  }, [state]);


  return (
    <form action={dispatch}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose how and when you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Types</h3>
            <p className="text-sm text-muted-foreground">
                Select the types of notifications you want to receive in-app.
            </p>
            <div className="space-y-4 rounded-md border p-4">
              {/* Map over settings to create switches, using props for defaults */}
              {[ 
                { id: 'notifyMessages', label: 'Messages', icon: MessageSquare, defaultValue: settings.notifyMessages },
                { id: 'notifyConnections', label: 'Connection requests', icon: Users, defaultValue: settings.notifyConnections },
                { id: 'notifyProjects', label: 'Project updates', icon: Briefcase, defaultValue: settings.notifyProjects },
                { id: 'notifyAchievements', label: 'Achievements and badges', icon: Award, defaultValue: settings.notifyAchievements },
                { id: 'notifyEvents', label: 'Events and reminders', icon: Calendar, defaultValue: settings.notifyEvents },
              ].map(({ id, label, icon: Icon, defaultValue }) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor={id} className="font-normal">{label}</Label>
                  </div>
                   {/* Ensure name matches schema/formData key */}
                  <Switch name={id} id={id} defaultChecked={defaultValue} />
                </div>
              ))}
               {/* Display potential errors for these boolean fields if needed */}
                {state?.errors && Object.entries(state.errors)
                    .filter(([key]) => key.startsWith('notify'))
                    .map(([key, errMessages]) => (
                        <p key={key} className="text-sm text-red-500">{errMessages?.join(", ")}</p>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Email Frequency</h3>
             <p className="text-sm text-muted-foreground">
                Choose how often you want to receive email notifications.
             </p>
            {/* Use prop for defaultValue */}
            <RadioGroup name="emailFrequency" defaultValue={settings.emailFrequency} className="rounded-md border p-4 space-y-2">
              {[ 
                { value: 'IMMEDIATE', label: 'Send emails immediately' },
                { value: 'DAILY', label: 'Send a daily digest' },
                { value: 'WEEKLY', label: 'Send a weekly summary' },
                { value: 'NEVER', label: 'Do not send emails' },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                   {/* Ensure id is unique and value matches enum */}
                  <RadioGroupItem value={value} id={`freq-${value}`} />
                  <Label htmlFor={`freq-${value}`} className="font-normal">{label}</Label>
                </div>
              ))}
            </RadioGroup>
             {/* Display potential errors */}
             {state?.errors?.emailFrequency && (
                 <p className="text-sm text-red-500">{state.errors.emailFrequency.join(", ")}</p>
             )}
          </div>
            {/* Display general success/error message at the bottom? */}
            {/* {state?.message && ( 
                <p className={`text-sm ${state.success ? 'text-green-500' : 'text-red-500'}`}>{state.message}</p>
             )} */} 
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
           {/* <Button variant="outline">Reset to Defaults</Button> */} {/* Reset might be complex with form state */}
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  )
}
