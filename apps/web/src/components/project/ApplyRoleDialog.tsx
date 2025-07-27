"use client"

import * as React from 'react'
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FieldValues, useForm } from "react-hook-form"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

import { Button } from "@/components/ui/button"
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

import { applyToProject } from "@/actions/projectActions" // Import the server action
// Assuming ApplicationSchema is correctly defined and exported from schemas/index.ts
// We only need the 'note' field for this form.
const ApplyFormSchema = z.object({
  note: z
    .string()
    .min(10, "Please provide a brief note (min 10 characters).")
    .max(1000, "Note cannot exceed 1000 characters.")
    .optional().or(z.literal("")),
});
type ApplyFormValues = z.infer<typeof ApplyFormSchema>;

interface ApplyRoleDialogProps {
  projectId: string;
  projectTitle: string;
  roleId: string;
  roleTitle: string;
  isUserLoggedIn: boolean;
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function ApplyRoleDialog({ 
    projectId, 
    projectTitle, 
    roleId, 
    roleTitle, 
    isUserLoggedIn,
    triggerButton 
}: ApplyRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(ApplyFormSchema),
    defaultValues: {
      note: "",
    },
  });

  const { mutate: submitApplication, isPending } = useMutation({
    mutationFn: () => applyToProject(projectId, form.getValues("note")),
    onSuccess: (result: any) => {
      if (result?.success) {
        toast({ title: "Success!", description: "Application submitted successfully." });
        setOpen(false); // Close dialog on success
        form.reset(); // Reset form
        // TODO: Add query invalidation if needed (e.g., invalidate project applications query)
      } else {
        toast({ title: "Error", description: result?.error || "Failed to submit application.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      console.error("Application submission error:", error);
      toast({ title: "Error", description: error?.message || "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const handleTriggerClick = (event: React.MouseEvent<HTMLElement>) => {
    // Check if logged in
    if (!isUserLoggedIn) {
      event.preventDefault(); // Prevent default action (like dialog opening)
      router.push('/login'); // Redirect to login
    } 
    // If logged in, do nothing here - let the DialogTrigger work
  };

  const onSubmit = (values: ApplyFormValues) => {
    // Prepare data for the server action
    // The server action will get the userId from the session
    const applicationData = {
      projectId: projectId,
      projectRoleId: roleId, 
      note: values.note || "", // Ensure note is string or empty string
      // userId will be handled by the server action
    };
    
    // We need to assert the type because the server action expects more fields
    // than our simple form provides directly. The action itself should validate.
    submitApplication(applicationData as any);
  };

  // Determine the trigger element
  const TriggerElement = triggerButton ? (
      // Wrap custom trigger in a span to capture the click for redirection check
      // This assumes the triggerButton itself doesn't handle the dialog opening
      // if wrapped. If it does, this might need adjustment based on triggerButton's behavior.
      <span onClick={handleTriggerClick} style={{ display: 'contents' }}> 
        {triggerButton}
      </span>
    ) : (
      // Default button trigger
      <Button size="sm" variant="outline" className='bg-black text-white dark:bg-white dark:text-black' onClick={handleTriggerClick}>
        Apply for {roleTitle}
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Use the determined TriggerElement */} 
      <DialogTrigger asChild>{TriggerElement}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="">
          <DialogTitle className="">Apply for: {roleTitle}</DialogTitle>
          <DialogDescription className="">
            You are applying to join the project &quot;{projectTitle}&quot; for the specific role of &quot;{roleTitle}&quot;. 
            Add an optional note to introduce yourself or highlight relevant experience.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }: { field: FieldValues }) => (
                <FormItem className="">
                  <FormLabel className="">Optional Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Introduce yourself, explain your interest, or highlight relevant skills..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="" />
                </FormItem>
              )}
            />
              <DialogFooter className="">
              <Button type="button" variant="outline" size="default" className="" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" size="default" variant="default" className="" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 