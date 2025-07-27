"use client"

import type React from "react"
import { User as PrismaUser } from "@prisma/client" // Import Prisma User type
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { Upload, X, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { profile, createSkill, connectSkill, disconnectSkill, uploadProfilePicture } from "@/actions/settings" // Import necessary actions
import { profileFormSchema as baseProfileFormSchema, skillSchema as baseSkillSchema, profileFormSchema } from "@/schemas"
import { redirect } from "next/navigation"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"
import { Skeleton } from "@/components/ui/skeleton"
import { SKILLS_Beta } from "@/constants/skills"
import { Badge } from "@/components/ui/badge"
import { getSkills, UserSkillProp } from "@/data/skills"
import { isSkillExist } from "@/data/skills"
import { AlertDialog, AlertDialogAction, AlertDialogTitle, AlertDialogContent, AlertDialogHeader, AlertDialogTrigger, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"

// Define the skill type used in this component
type Skill = z.infer<typeof baseSkillSchema> & { id?: string }; // Add optional id for fetched skills

// Option schema for MultipleSelector
const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  group: z.string().optional(),
  // Add other fields if your Option type has more, but MultipleSelector primarily needs label/value
});

// Define the schema specifically for this form
// TODO: Use unified schema for profile form in backend and frontend 
const personalInfoFormSchema = z.object({
   image: z.string().optional(),
  coverImage: z.string().optional(),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be less than 30 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional().or(z.literal("")),
  websiteUrl: z.union([z.string().url({ message: "Please enter a valid URL." }), z.literal("")]).optional(),
  githubUrl: z.union([z.string().url({ message: "Invalid GitHub URL" }), z.literal("")]).optional(),
  linkedinUrl: z.union([z.string().url({ message: "Invalid LinkedIn URL" }), z.literal("")]).optional(),
  twitterUrl: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  college: z.string().min(1, { message: "College name is required." }).max(100, "College name cannot exceed 100 characters."),
  profilePicture: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal("")),
  headline: z.string().max(150, "Headline cannot exceed 150 characters.").optional().or(z.literal("")),
  location: z.string().min(1, { message: "Location is required." }).max(100, "Location cannot exceed 100 characters."),
  skills: z.array(optionSchema).optional(), 
});

type PersonalInfoFormValues = z.infer<typeof personalInfoFormSchema>


// Helper: Map Prisma User Skills to Options for MultipleSelector
const mapUserSkillsToOptions = (userSkills: any[] | undefined): Option[] => {
  if (!Array.isArray(userSkills)) return [];
  return userSkills
    .map(us => us.skill) // Get the nested skill object
    .filter(skill => !!skill) // Filter out any null/undefined skills
    .map(skill => ({
      label: skill.name,
      value: skill.name, // Use name as value for simplicity, assuming unique names
      group: skill.category || 'Other',
    }));
};

// Mock search function for MultipleSelector skills
const mockSkillSearch = async (value: string): Promise<Option[]> => {
   // In a real app, replace this with an API call to search available skills
    // Simple filtering example
   return SKILLS_Beta.filter(option => 
       option.label.toLowerCase().includes(value.toLowerCase())
   );
};

// --- Helper: Map Prisma User Skill to Form Skill Type ---
const mapPrismaSkillToFormSkill = (prismaSkill: UserSkillProp): Skill | null => {

  if (!prismaSkill?.name) return null; // Return null for invalid data
  // Assuming getSkills returns skills with structure like { skill: { id, name, category }, level }
  const mapped = {
    id: prismaSkill.id || String(Date.now()), // Use skill ID if available
    name: prismaSkill.name,
    value: prismaSkill.name, // Use name as value for consistency
    label: prismaSkill.name, // Add the missing label property
    group: prismaSkill.category || undefined,
    rank: prismaSkill.level ?? undefined, // Map level to rank if needed
  };
  return mapped; // Ensure the mapped object is returned
};

interface PersonalInfoFormProps {
  user: PrismaUser & { skills?: any[] } // Use PrismaUser type
}

export default function PersonalInfoForm({ user }: PersonalInfoFormProps) {
  const queryClient = useQueryClient()
  const [previewImage, setPreviewImage] = useState<string | null>(user.profilePicture || null)
  const [originalProfilePicture] = useState<string | null>(user.profilePicture || null); // Store original picture for revert on error
  // Restore state for current skills (Skill[])
  const [currentSkills, setCurrentSkills] = useState<Skill[]>([]) 

  // Restore skill fetching query
  const { data: fetchedSkillsData, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["userSkills", user.id],
    queryFn: () => getSkills(user.id), 
    enabled: !!user.id, 
  });

  // Map currentSkills (Skill[]) to Options for MultipleSelector initial state/defaults
  const initialSkillsOptions = currentSkills.map(skill => ({
    label: skill.name,
    value: skill.name, // Assuming name is unique identifier for value
    group: skill.group || 'Other',
  }));

  if (!user.username) {
    toast({ title: "Error", description: "Username is required.", variant: "destructive" });
    redirect('/onboarding')
  }
  // --- Form Initialization ---
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoFormSchema),
    defaultValues: {
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      location: user.location || "",
      college: user.college || "",
      headline: user.headline || "",
      bio: user.bio || "",
      websiteUrl: user.websiteUrl || "",
      githubUrl: user.githubUrl || "",
      linkedinUrl: user.linkedinUrl || "",
      profilePicture: user.profilePicture || "",
      skills: initialSkillsOptions, 
    },
  })

  // console.log("form", form.formState.errors)


  // Restore effect to update currentSkills (Skill[]) state
   useEffect(() => {
     if (fetchedSkillsData) {
      const mappedSkills = fetchedSkillsData.map(mapPrismaSkillToFormSkill).filter(skill => skill !== null) as Skill[];
      setCurrentSkills(mappedSkills);
      // Also update the form default if it hasn't been touched yet
      if (!form.formState.isDirty) {
           form.reset({ 
               ...form.getValues(), // keep other form values
               skills: mapUserSkillsToOptions(fetchedSkillsData) // set default Option[] for selector
           });
      }
    }
   }, [fetchedSkillsData, form]); // Add form to dependency array


  // --- Add Upload Mutation ---
  const uploadProfilePictureMutation = useMutation({
    mutationFn: uploadProfilePicture, // Use the server action
    onSuccess: (data) => {
      if (data?.success && data.url) {
        toast({ title: "Success", description: data.success });
        // Update the form state with the actual URL from the server
        form.setValue("profilePicture", data.url, { shouldDirty: true }); 
        // Invalidate profile query to refetch potentially updated user data elsewhere
        queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
        // Optionally update the preview again if needed, though it should match
        // setPreviewImage(data.url); 
      } else if (data?.error) {
        toast({ title: "Upload Error", description: data.error, variant: "destructive" });
        // Revert optimistic UI on server error during upload/DB update
        setPreviewImage(originalProfilePicture); 
        form.setValue("profilePicture", originalProfilePicture || ""); // Revert form value too
      }
    },
    onError: (error: any) => {
      toast({ title: "Upload Failed", description: error.message || "Could not upload profile picture.", variant: "destructive" });
      // Revert optimistic UI on network or unexpected error
      setPreviewImage(originalProfilePicture);
      form.setValue("profilePicture", originalProfilePicture || ""); // Revert form value too
    },
  });

  // --- Mutation for Personal Info Update --- 
  const profileMutation = useMutation({
    mutationFn: profile, // Use the updated profile action
    onMutate: async (newData) => {
      const queryKey = ["userProfile", user.id]; // Consistent query key
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({ ...old, ...newData }));
      return { previousData, queryKey };
    },
    onError: (err: any, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" });
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({ title: "Success", description: data.success });
      } else if (data?.error) {
        toast({ title: "Update Error", description: data.error, variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] }); // Revalidate on server error
      } else {
         toast({ title: "Success", description: "Profile updated." }); // Fallback
      }
    },
    onSettled: (data, error, variables, context) => {
       queryClient.invalidateQueries({ queryKey: context?.queryKey });
    },
  })

  // --- Mutations for Skill Updates (Keep Add/Remove mutations as before) ---
  const addSkillMutation = useMutation({ 
    mutationFn: async (skillToAdd: { name: string; value: string; label: string; group?: string }): Promise<{ success?: string; error?: string }> => {
      const exists = await isSkillExist(skillToAdd.name);
      if (exists) {
        return connectSkill(skillToAdd, { isAuthorizationChecked: true, userId: user.id });
      } else {
              return createSkill(skillToAdd, { isAuthorizationChecked: true, userId: user.id });
          }
      },
      onSuccess: (data) => {
          if (data?.success) {
              toast({ title: "Skill Added", description: data.success });
              queryClient.invalidateQueries({ queryKey: ["userSkills", user.id] }); // Refetch skills
          } else if (data?.error) {
              toast({ title: "Skill Error", description: data.error, variant: "destructive" });
          }
      },
      onError: (error: any) => {
          toast({ title: "Skill Error", description: error.message || "Could not add skill.", variant: "destructive" });
      }
  });

   const removeSkillMutation = useMutation({ 
     mutationFn: (skillToRemove: Skill) => disconnectSkill(skillToRemove, { isAuthorizationChecked: true, userId: user.id }),
     onSuccess: (data) => {
         if (data?.success) {
           toast({ title: "Skill Removed", description: data.success });
           queryClient.invalidateQueries({ queryKey: ["userSkills", user.id] }); // Refetch skills
          } else if (data?.error) {
              toast({ title: "Skill Error", description: data.error, variant: "destructive" });
          }
      },
       onError: (error: any) => {
          toast({ title: "Skill Error", description: error.message || "Could not remove skill.", variant: "destructive" });
      }
  });

  // --- Form Submission Handler ---
  const onSubmit = async (data: PersonalInfoFormValues) => {
      // skills from data are Option[]
      const { skills: finalSkillsOptions = [], ...profileOnlyData } = data;
        // Compare currentSkills (Skill[]) with finalSkillsOptions (Option[])
      const currentSkillValues = new Set(currentSkills.map(skill => skill.value)); // Use value (or name)
      // 1. Submit Profile Changes (Must complete before skills if skill logic depends on profile state)
      // Note: profilePicture is already handled by its own upload/update action
      try {
          const profileUpdateResult = await profileMutation.mutateAsync(profileOnlyData as any); // Pass only profile data
          if (profileUpdateResult?.error) { 
              toast({ title: "Profile Error", description: profileUpdateResult.error, variant: "destructive" });
              return; // Stop if profile update fails
          }
        if (finalSkillsOptions.length > 0) {
          toast({ title: "Profile Saved", description: "Updating skills..." });
        }
        else {
          toast({ 
            title: "Profile Updated Successfully", 
            description: "Your profile information has been saved. You can continue editing other sections.",
            variant: "default",
            duration: 5000
          });
        }
      } catch (error) {
          console.error("Error updating profile:", error);
          toast({ title: "Profile Error", description: "Could not save profile changes.", variant: "destructive" });
          return; // Stop if profile update fails
      }
      
    

      // Map final Options to Skill format for adding
      const skillsToAdd: Skill[] = finalSkillsOptions
                                        .filter(opt => !currentSkillValues.has(opt.value))
                                        .map(opt => ({ 
                                            // Ensure we create a valid Skill object for the mutation
                                            name: opt.label, 
                                            value: opt.value,
                                            label: opt.label, // Add label here
                                            group: typeof opt.group === 'string' ? opt.group : undefined,
                                            // id is usually omitted when adding, backend handles it
                                        }));
                                        
    
      // 2. Submit Skill Changes (Use the mutations)
       const skillPromises = [
          // Use addSkillMutation for adding
          ...skillsToAdd.map(skill => addSkillMutation.mutateAsync(skill)),

      ];

      try {
          // Use allSettled to handle individual promise failures
        const results = await Promise.allSettled(skillPromises);
        form.reset({
          ...form.getValues(),
          skills: mapUserSkillsToOptions(fetchedSkillsData || [])
        });
          
        const addedCount = results.slice(0, skillsToAdd.length).filter(r => r.status === 'fulfilled').length;
        const removedCount = results.slice(skillsToAdd.length).filter(r => r.status === 'fulfilled').length;
          const failedCount = results.filter(r => r.status === 'rejected').length;

          let summary = [];
          if (addedCount > 0) summary.push(`${addedCount} added`);
          if (removedCount > 0) summary.push(`${removedCount} removed`);
          if (failedCount > 0) summary.push(`${failedCount} failed`);

          if (summary.length > 0) {
            toast({ 
                title: "Skills Updated", 
                description: `Operation summary: ${summary.join(', ')}.`,
                variant: failedCount > 0 ? "destructive" : "default"
             });
          } else if (skillsToAdd.length === 0) {
            // No changes attempted, maybe inform user or just do nothing
          } else {
             toast({ title: "Skill Update Issue", description: "Could not update skills.", variant: "destructive" });
          }

          // Log detailed errors if any failed
          results.forEach((result, index) => {
              if (result.status === 'rejected') {
                  const skill = index < skillsToAdd.length ? skillsToAdd[index] : undefined;
                  if (skill) {
                      console.error(`Error processing skill '${skill.name}':`, result.reason);
                  }
              }
          });

      } catch (error) { // Catch errors from Promise.allSettled itself (unlikely)
          console.error("Unexpected error during skill updates:", error);
          toast({ title: "Skill Update Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
          // Invalidate queries regardless of success/failure to refetch latest state
          queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] }); 
          queryClient.invalidateQueries({ queryKey: ["userSkills", user.id] });
      }
  }

  // --- Profile Picture Handler ---
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Optional: Client-side validation (example)
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      toast({ title: "File Too Large", description: "Maximum image size is 1MB.", variant: "destructive" });
      return;
    }

    // Optimistic UI: Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result as string;
        setPreviewImage(imageUrl); // Update preview state
        // DO NOT set form value with data URL here anymore
        // form.setValue("profilePicture", imageUrl); 
      }
    };
    reader.readAsDataURL(file);

    // Prepare data and trigger upload mutation
    const formData = new FormData();
    formData.append("profilePicture", file);
    uploadProfilePictureMutation.mutate(formData);

    // NOTE: Actual upload to storage and saving URL via mutation needs implementation
    // Currently, only updates local preview and form state.
  }

  // --- Skill Handlers (Only need remove for badges now) ---
  const handleRemoveSkill = (skillToRemove: Skill) => {
    // Confirmation dialog
    // if (window.confirm(`Are you sure you want to remove the skill "${skillToRemove.name}"?`)) {
        // Call mutation with the Skill object
        removeSkillMutation.mutate(skillToRemove);
        // Optimistically remove from the form state (optional but good UX)
        const currentFormSkills = form.getValues("skills") || [];
        form.setValue("skills", currentFormSkills.filter(opt => opt.value !== skillToRemove.value), { shouldDirty: true });
    // }
  };

  return (
     <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-semibold mb-4">Personal Information & Skills</h2>
        <Separator className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* --- Profile Picture Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="col-span-1 flex flex-col items-center">
                 <FormLabel>Profile Picture</FormLabel>
                 <div className="relative mt-2 mb-4 w-[150px] h-[150px]">
                   {/* Display Spinner during upload */}
                   {uploadProfilePictureMutation.isPending && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full z-10">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                     </div>
                   )}
                   <Image
                    // Use previewImage state for optimistic update, fallback to user data
                    src={previewImage || "/placeholder.svg?height=150&width=150"} 
                    alt="Profile Preview"
                    fill // Use fill to cover the container
                    sizes="150px"
                    className="rounded-full object-cover border"
                    // Add key to force re-render if src changes back to original on error
                    key={previewImage || 'placeholder'} 
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90"
                    title="Upload new picture"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                    // Disable input while uploading
                    disabled={uploadProfilePictureMutation.isPending} 
                  />
                 </div>
                 {/* Hidden field to store the URL for submission */}
                 <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                           <Input {...field} type="hidden" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                 {/* Display Upload Error Message */}
                 {uploadProfilePictureMutation.error && (
                   <p className="text-sm text-destructive mt-2">
                     {(uploadProfilePictureMutation.error as Error)?.message || "Upload failed"}
                   </p>
                 )}
              </div>

              {/* --- Basic Info Fields --- */}
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl><Input {...field} type="email" readOnly disabled /></FormControl>
                      <FormDescription>Email cannot be changed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username*</FormLabel>
                      <FormControl><Input {...field} type="text" readOnly disabled /></FormControl>
                      <FormDescription>Username cannot be changed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                 <FormField
                  control={form.control}
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College*</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., University of Example"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., San Francisco, CA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
<FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Headline</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Full Stack Developer | AI Enthusiast" /></FormControl>
                      <FormDescription>A short professional headline (max 150 chars).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" placeholder="Tell us about yourself..." value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{(field.value?.length || 0)}/1000 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               
                 <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub URL (optional)</FormLabel>
                      <FormControl><Input {...field} type="url" placeholder="https://github.com/..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL (optional)</FormLabel>
                      <FormControl><Input {...field} type="url" placeholder="https://linkedin.com/in/..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Website URL (optional)</FormLabel>
                      <FormControl><Input {...field} type="url" placeholder="https://..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               
              </div>
            </div>

            {/* --- Skills Section --- */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Current Skills</h3>
              {/* Display Current Skills as Badges */}
              <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
                 {isLoadingSkills ? (
                   <>
                     {Array.from({ length: 3 }).map((_, index) => (
                       <Skeleton key={index} className="h-6 w-20 rounded-full mr-2" />
                     ))}
                   </>
                 ) : currentSkills.length > 0 ? (
                   // Use currentSkills (FormSkill[]) to render badges
                   currentSkills.map((skill) => (
                      <Badge key={skill.id || skill.name} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                        {skill.name}
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                          aria-label={`Remove ${skill.name} skill`}
                          disabled={removeSkillMutation.isPending} 
                          title={`Remove ${skill.name}`}
                        >
                          <X className="h-3 w-3" />
                         </button>
                         </AlertDialogTrigger>
                            <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove the skill &quot;{skill.name}&quot; from your profile upon saving.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      {/* Call the mutation directly on click */}
                                      <AlertDialogAction onClick={() => removeSkillMutation.mutate(skill)}>
                                          Continue
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                        </AlertDialog>
                         
                      </Badge>
                    ))
                 ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                 )}
              </div>
              <Separator className="my-4" />
              {/* Use MultipleSelector for adding/managing skills in the form state */}
              <FormField
                control={form.control}
                name="skills" // This field holds Option[]
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add or Remove Skills</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value} // Option[] from form state
                        onSearch={mockSkillSearch} 
                        // Default options can be initial fetch or empty
                        defaultOptions={initialSkillsOptions} 
                        placeholder="Search or add skills..."
                        creatable 
                        groupBy="group" 
                        onChange={field.onChange} // Updates form state with Option[]
                        loadingIndicator={
                          <div className="w-full flex flex-col gap-2 p-3">
                            <Skeleton className="w-[70%] h-2 animate-pulse" />
                            <Skeleton className="w-[60%] h-2 animate-pulse" />
                          </div>
                        }
                        emptyIndicator={
                          <p className="w-full text-center text-sm leading-10 text-muted-foreground">
                            No results found. Type to search or create.
                          </p>
                        }
                      />
                    </FormControl>
                    <FormDescription>
                        Changes to skills will be saved when you click &quot;Save All Changes&quot;.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- Save Button (Adjusted label) --- */}
            <div className="flex justify-end pt-4">
             <Button 
                type="submit" 
                disabled={
                  profileMutation.isPending || 
                  addSkillMutation.isPending || 
                  removeSkillMutation.isPending ||
                  uploadProfilePictureMutation.isPending // Add this
                 }
             >
                {profileMutation.isPending || 
                 addSkillMutation.isPending || 
                 removeSkillMutation.isPending ||
                 uploadProfilePictureMutation.isPending // Add this
                   ? "Saving..." : "Save All Changes"}
             </Button>
           </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
