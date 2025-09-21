"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { X, Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { z } from "zod"
import { User as PrismaUser, Education as PrismaEducation, Experience as PrismaExperience } from "@0unveiled/database/schema"
import { Form } from "@/components/ui/form"
import { useForm, SubmitHandler, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Textarea } from "@/components/ui/textarea"
import { getUserByUserId } from "@/data/user"
import { updateExperienceEducation } from "@/actions/settings"
import { Skeleton } from "@/components/ui/skeleton"
// Import the schema from the shared location
import { experienceEducationFormSchema } from "@/schemas"
import { AlertDialog, AlertDialogTitle, AlertDialogHeader, AlertDialogContent, AlertDialogTrigger, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@/components/ui/alert-dialog"

// Define TypeScript types using the imported schema
// Use z.input for the type expected by react-hook-form before validation/defaults
type ExperienceEducationFormInputValues = z.input<typeof experienceEducationFormSchema>
// Keep the original type for the validated output (e.g., for submission)
type ExperienceEducationFormSubmitValues = z.infer<typeof experienceEducationFormSchema>

// Re-derive individual item types from the main schema's arrays
// Use NonNullable to ensure the array itself exists before accessing [number]
type EducationFormValues = NonNullable<ExperienceEducationFormInputValues["education"]>[number] 
type ExperienceFormValues = NonNullable<ExperienceEducationFormInputValues["experience"]>[number]

// Helper: Format Date for Input Type="date"
const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    // Check if date is valid before formatting
    if (isNaN(d.getTime())) return ""; 
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return ""; // Return empty string if date parsing fails
  }
};

// Helper: Map Prisma Education/Experience to Form Values
const mapPrismaEduToForm = (edu: PrismaEducation): EducationFormValues => ({
  id: edu.id,
  institution: edu.institution,
  degree: edu.degree || "",
  fieldOfStudy: edu.fieldOfStudy || "",
  startDate: formatDateForInput(edu.startDate),
  endDate: edu.endDate ? formatDateForInput(edu.endDate) : undefined,
  current: !edu.endDate, // Infer 'current' if endDate is null/undefined
  description: edu.description || undefined,
});

const mapPrismaExpToForm = (exp: PrismaExperience): ExperienceFormValues => ({
  id: exp.id,
  company: exp.companyName,
  position: exp.jobTitle,
  location: exp.location || undefined,
  startDate: formatDateForInput(exp.startDate),
  endDate: exp.endDate ? formatDateForInput(exp.endDate) : undefined,
  current: !exp.endDate,
  description: exp.description || undefined,
});

interface ExperienceEducationFormProps {
   userId: string | undefined; // Allow undefined initially
}

export default function ExperienceEducationForm({ userId }: ExperienceEducationFormProps) {
  const queryClient = useQueryClient()
  // State for managing the temporary input fields for new entries
  const [newEducation, setNewEducation] = useState<Partial<EducationFormValues>>({}) // Use partial for new entry state
  const [newExperience, setNewExperience] = useState<Partial<ExperienceFormValues>>({}) // Use partial for new entry state
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [showExperienceForm, setShowExperienceForm] = useState(false)
  // State to track editing
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);

  // --- Fetch User Data (including Experience & Education relations) --- 
  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ["userProfileData", userId], // Use a more general key if fetching full user
    // Use getUserBySupabaseId assuming it fetches relations
    queryFn: async () => {
        if (!userId) return null; // Don't fetch if no userId
        const user = await getUserByUserId(userId);
        // Check if user exists and has the needed relations
        if (!user || !user.education || !user.experience) {
             // You might want to throw an error or return a specific structure
             console.warn("User data or relations not found for", userId);
             // Ensure the structure matches what useEffect expects, even if empty
             return { education: [], experience: [] }; 
        }
        return user; // Return the full user object
    },
    enabled: !!userId, // Only fetch if userId is present
  });
  // --- Form Initialization --- 
  const form = useForm<ExperienceEducationFormInputValues>({ 
    resolver: zodResolver(experienceEducationFormSchema),
    defaultValues: {
      // Ensure defaultValues provides empty arrays if userData or its properties are null/undefined
      education: userData?.education?.map(mapPrismaEduToForm) ?? [], 
      experience: userData?.experience?.map(mapPrismaExpToForm) ?? [],
    },
    // mode: "onChange", // Optional: consider adding for better UX
  });

  // console.log("form", form.formState.errors)

  // --- Effect to Populate Form with Fetched Data --- 
  useEffect(() => {
    // Access education/experience from the fetched user object
    if (userData && (userData.education || userData.experience)) {
      form.reset({
        education: userData.education?.map(mapPrismaEduToForm) ?? [],
        experience: userData.experience?.map(mapPrismaExpToForm) ?? [],
      });
    }
    // Depend on the fetched userData object
  }, [userData, form.reset]); 

  // --- Mutation for Updating Experience/Education --- 
  const mutation = useMutation({
    mutationFn: updateExperienceEducation, // Use the imported action
    onMutate: async (newData) => {
      // Use the same query key used for fetching
      const queryKey = ["userProfileData", userId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update the cache with the structure returned by the query
      queryClient.setQueryData(queryKey, (old: PrismaUser | null | undefined) => {
          if (!old) return old; // Do nothing if no old data
          return {
              ...old, // Keep other user data
              // Update education/experience with the submitted form data
              // Note: This assumes the form data structure matches or can be mapped back
              // Be cautious if IDs are generated on the frontend temporarily
              education: newData.education.map((edu: EducationFormValues) => ({ // Explicitly type 'edu'
                  // Map back to Prisma-like structure for optimistic update consistency
                  id: edu.id || `temp-${Date.now()}`,
                  institution: edu.institution,
                  degree: edu.degree,
                  fieldOfStudy: edu.fieldOfStudy,
                  startDate: new Date(edu.startDate), // Convert back to Date
                  endDate: edu.current || !edu.endDate ? null : new Date(edu.endDate),
                  description: edu.description || null,
                  userId: old.id, // Add userId if needed
                  createdAt: new Date(), // Placeholder
                  updatedAt: new Date(), // Placeholder
              })),
              experience: newData.experience.map((exp: ExperienceFormValues) => ({ 
                  id: exp.id || `temp-${Date.now()}`,
                  companyName: exp.company,
                  jobTitle: exp.position,
                  location: exp.location || null,
                  startDate: new Date(exp.startDate),
                  endDate: exp.current || !exp.endDate ? null : new Date(exp.endDate),
                  current: exp.current,
                  description: exp.description || null,
                  userId: old.id,
                  createdAt: new Date(),
                  updatedAt: new Date(),
              }))
          };
      });
      return { previousData, queryKey };
    },
    onError: (err: any, newData, context) => {
      if(context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({
        title: "Error",
        description: err.message || "Failed to update experience/education.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
        if(data?.success) {
             toast({ title: "Success", description: data.success });
        } else if (data?.error) {
             toast({ title: "Update Error", description: data.error, variant: "destructive" });
             queryClient.invalidateQueries({ queryKey: ["userProfileData", userId] }); // Revalidate on server error
        } else {
             toast({ title: "Success", description: "Experience & Education updated." }); // Fallback
        }
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
    },
  });

  // --- Handlers for Adding/Removing Items --- 

  // Add Education
  const handleAddEducation = () => {
      // TODO: Need proper validation for the newEducation object against the education item schema
      const validatedData = newEducation as EducationFormValues; // Type assertion for now

      const currentEducation = form.getValues("education") ?? [];

      if (editingEducationId) {
        // Update existing item
        const updatedEducation = currentEducation.map(edu => 
          edu.id === editingEducationId ? { ...edu, ...validatedData } : edu 
          // Note: If IDs are generated temporarily, need a different check (e.g., index)
        );
        form.setValue("education", updatedEducation, { shouldValidate: true, shouldDirty: true });
        setEditingEducationId(null); // Clear editing state
      } else {
        // Add new item
        form.setValue("education", [...currentEducation, validatedData], { shouldValidate: true, shouldDirty: true });
      }

      setNewEducation({}); // Reset new entry form
      setShowEducationForm(false); // Hide form
  };

  // Remove Education
  const handleRemoveEducation = (index: number) => {
    const currentEducation = form.getValues("education") ?? [];
    form.setValue("education", currentEducation.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true });
  };

  // Add Experience
  const handleAddExperience = () => {
       // TODO: Need proper validation for the newExperience object against the experience item schema
       const validatedData = newExperience as ExperienceFormValues; // Type assertion for now

       const currentExperience = form.getValues("experience") ?? [];

       if (editingExperienceId) {
         // Update existing item
         const updatedExperience = currentExperience.map(exp => 
           exp.id === editingExperienceId ? { ...exp, ...validatedData } : exp
           // Note: If IDs are generated temporarily, need a different check (e.g., index)
         );
         form.setValue("experience", updatedExperience, { shouldValidate: true, shouldDirty: true });
         setEditingExperienceId(null); // Clear editing state
       } else {
         // Add new item
         form.setValue("experience", [...currentExperience, validatedData], { shouldValidate: true, shouldDirty: true });
       }

       setNewExperience({}); // Reset new entry form
       setShowExperienceForm(false); // Hide form
  };

  // Remove Experience
  const handleRemoveExperience = (index: number) => {
    const currentExperience = form.getValues("experience") ?? [];
    form.setValue("experience", currentExperience.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true });
  };

  // --- Form Submission --- 
  const onSubmit: SubmitHandler<ExperienceEducationFormSubmitValues> = (data) => {
    mutation.mutate(data);
  };

  // --- Loading and Error States --- 
  if (isLoading) {
    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-10 w-32" />
                 <Separator />
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
  }

  if (isError) {
    return (
         <Card>
            <CardContent className="pt-6">
                 <p className="text-destructive">Error loading data: {error?.message || "Unknown error"}</p>
            </CardContent>
         </Card>
    )
  }

  // --- Render Form --- 
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-semibold mb-4">Experience and Education</h2>
        <Separator className="mb-6" />

        <Form {...form}>
          {/* IMPORTANT: Need a single <form> element wrapping all sections */}
          <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FieldValues>)} className="space-y-8">
            {/* Education Section */} 
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Education</h3>
              <Separator className="mb-4" />
            
              <div className="space-y-4">
                {/* Display existing education items */} 
                {(form.watch("education") ?? []).map((edu, index) => (
                  <div key={`edu-${index}-${edu.id || index}`} className="border rounded-md p-4 relative bg-muted/40 group">
                     {/* Popover for Edit/Delete */} 
                      <Popover>
                        <PopoverTrigger asChild>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                             aria-label="Manage education entry"
                           >
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1">
                           <div className="flex flex-col space-y-1">
                             <Button 
                               variant="ghost"
                               size="sm"
                               className="justify-start text-sm px-2 py-1.5"
                               onClick={() => {
                                 setEditingEducationId(edu.id || null); // Assume edu has an id
                                 setNewEducation({ ...edu }); // Pre-fill form state
                                 setShowEducationForm(true); // Show the form
                               }}
                              >
                               <Edit className="mr-2 h-3.5 w-3.5"/> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                             <Button 
                               variant="ghost"
                               size="sm"
                               className="justify-start text-sm px-2 py-1.5 text-destructive hover:text-destructive"
                              >
                               <Trash2 className="mr-2 h-3.5 w-3.5"/> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove this education entry from your profile.
                                </AlertDialogDescription>

                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveEducation(index)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                            
                           </div>
                        </PopoverContent>
                      </Popover>

                    {/* Existing content display */} 
                    <h4 className="font-medium pr-8">{edu.institution}</h4> {/* Added padding right */} 
                    <p>{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu.startDate} - {edu.current ? 'Present' : (edu.endDate)}
                    </p>
                    {edu.description && <p className="mt-2 text-sm whitespace-pre-wrap">{edu.description}</p>}
                  </div>
                ))}
                {(form.watch("education") ?? []).length === 0 && !showEducationForm && (
                   <p className="text-muted-foreground">No education added yet.</p>
                )}
                {form.formState.errors.education && (
                  <p className="text-destructive">{form.formState.errors.education.message}</p>
                )}
              </div>
            
               {/* Form for adding/editing education */} 
              {(showEducationForm || editingEducationId) && (
                <div className="border rounded-md p-4 space-y-4">
                   <h4 className="font-medium text-md">
                     {editingEducationId ? "Edit Education Entry" : "Add New Education"}
                   </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Institution*"
                      value={newEducation?.institution || ''}
                      onChange={(e) => setNewEducation((prev: Partial<EducationFormValues>) => ({...prev, institution: e.target.value}))}
                    />
                    <Input
                      placeholder="Degree*"
                      value={newEducation?.degree || ''}
                      onChange={(e) => setNewEducation((prev: Partial<EducationFormValues>) => ({...prev, degree: e.target.value}))}
                    />
                    <Input
                      placeholder="Field of Study*"
                      value={newEducation?.fieldOfStudy || ''}
                      onChange={(e) => setNewEducation((prev: Partial<EducationFormValues>) => ({...prev, fieldOfStudy: e.target.value}))}
                    />
                    <Input
                      placeholder="Start Date*"
                      type="date"
                      value={newEducation?.startDate || new Date().toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewEducation((prev: Partial<EducationFormValues>) => ({...prev, startDate: e.target.value}))}
                    />
                    <Input
                      placeholder="End Date"
                      type="date"
                      value={newEducation?.endDate || new Date().toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewEducation((prev: Partial<EducationFormValues>) => ({...prev, endDate: e.target.value}))}
                      disabled={newEducation?.current}
                    />
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <input
                        id="current-education" // Ensure unique ID or use label association
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={newEducation?.current || false}
                        onChange={(e) => setNewEducation(prev => ({...prev, current: e.target.checked, endDate: e.target.checked ? '' : prev?.endDate }))} // Clear endDate if current
                      />
                      <label htmlFor="current-education" className="text-sm font-medium">Currently studying here</label>
                    </div>
                    <Textarea
                      placeholder="Description (optional)"
                      className="md:col-span-2"
                      value={newEducation?.description || ''}
                      onChange={(e) => setNewEducation(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                    />
                  </div>
                   <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => {
                       setShowEducationForm(false);
                       setNewEducation({});
                       setEditingEducationId(null); // Reset editing state
                    }}>Cancel</Button>
                    <Button
                      type="button"
                      onClick={handleAddEducation} // This now handles both add and update
                      disabled={!newEducation?.institution || !newEducation?.degree || !newEducation?.fieldOfStudy || !newEducation?.startDate || (!newEducation?.current && !newEducation?.endDate)
                      } // Ensure all required fields are filled
                    >
                      {editingEducationId ? "Update Entry" : "Add Education Entry"}
                    </Button>
                  </div>
                </div>
              )} 
              {/* Show Add button only if not editing and form isn't shown */} 
              {!showEducationForm && !editingEducationId && (
                <Button type="button" onClick={() => setShowEducationForm(true)} variant="outline" size="sm" className="flex items-center">
                  <Plus className="mr-1 h-4 w-4" /> Add Education
                </Button>
              )}
            </div>

            {/* Experience Section */} 
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Experience</h3>
              <Separator className="mb-4" />
            
              <div className="space-y-4">
                 {/* Display existing experience items */} 
                 {(form.watch("experience") ?? []).map((exp, index) => (
                  <div key={`exp-${index}-${exp.id || index}`} className="border rounded-md p-4 relative bg-muted/40 group">
                      {/* Popover for Edit/Delete */} 
                       <Popover>
                        <PopoverTrigger asChild>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                             aria-label="Manage experience entry"
                           >
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1">
                           <div className="flex flex-col space-y-1">
                             <Button 
                               variant="ghost"
                               size="sm"
                               className="justify-start text-sm px-2 py-1.5"
                               onClick={() => {
                                 setEditingExperienceId(exp.id || null); // Assume exp has an id
                                 setNewExperience({ ...exp }); // Pre-fill form state
                                 setShowExperienceForm(true); // Show the form
                               }}
                              >
                               <Edit className="mr-2 h-3.5 w-3.5"/> Edit
                             </Button>
                             <Button 
                               variant="ghost"
                               size="sm"
                               className="justify-start text-sm px-2 py-1.5 text-destructive hover:text-destructive"
                               onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete this experience entry for ${exp.company}?`)) {
                                     handleRemoveExperience(index);
                                 }
                               }}
                              >
                               <Trash2 className="mr-2 h-3.5 w-3.5"/> Delete
                             </Button>
                           </div>
                        </PopoverContent>
                      </Popover>

                     <h4 className="font-medium pr-8">{exp.position}</h4> {/* Added padding right */} 
                    <p>{exp.company} {exp.location && <span className="text-muted-foreground">({exp.location})</span>}</p>
                    <p className="text-sm text-muted-foreground">
                       {exp.startDate} - {exp.current ? 'Present' : (exp.endDate || 'N/A')}
                    </p>
                    {exp.description && <p className="mt-2 text-sm whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                ))}
                 {(form.watch("experience") ?? []).length === 0 && !showExperienceForm && (
                     <p className="text-muted-foreground">No experience added yet.</p>
                )}
                {form.formState.errors.experience && (
                  <p className="text-destructive">{form.formState.errors.experience.message}</p>
                )}
              </div>
            
               {/* Form for adding/editing experience */} 
               {(showExperienceForm || editingExperienceId) && (
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="font-medium text-md">
                    {editingExperienceId ? "Edit Experience Entry" : "Add New Experience"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Company*"
                      value={newExperience?.company || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                    />
                    <Input
                      placeholder="Position*"
                      value={newExperience?.position || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                    />
                    <Input
                      placeholder="Location (e.g., City, State or Remote)"
                      value={newExperience?.location || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <Input
                      placeholder="Start Date*"
                      type="date"
                      value={newExperience?.startDate || new Date().toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      placeholder="End Date"
                      type="date"
                      value={newExperience?.endDate || new Date().toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                      disabled={newExperience?.current}
                    />
                     <div className="flex items-center space-x-2 md:col-span-2">
                      <input
                        id="current-job" // Ensure unique ID or use label association
                        type="checkbox"
                         className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={newExperience?.current || false}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? '' : prev?.endDate }))} // Clear endDate if current
                      />
                      <label htmlFor="current-job" className="text-sm font-medium">I currently work here</label>
                    </div>
                    <Textarea
                      placeholder="Description (optional)"
                      className="md:col-span-2"
                      value={newExperience?.description || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                     <Button type="button" variant="outline" onClick={() => { 
                       setShowExperienceForm(false); 
                       setNewExperience({}); 
                       setEditingExperienceId(null); // Reset editing state
                     }}>Cancel</Button>
                    <Button
                      type="button"
                      onClick={handleAddExperience} // This now handles both add and update
                      disabled={!newExperience?.company || !newExperience?.position || !newExperience?.startDate || !newExperience?.current && !newExperience?.endDate}
                    >
                       {editingExperienceId ? "Update Entry" : "Add Experience Entry"}
                    </Button>
                  </div>
                </div>
               )} 
               {/* Show Add button only if not editing and form isn't shown */} 
              {!showExperienceForm && !editingExperienceId && (
                <Button type="button" onClick={() => setShowExperienceForm(true)} variant="outline" size="sm" className="flex items-center">
                  <Plus className="mr-1 h-4 w-4" /> Add Experience
                </Button>
              )}
            </div>

             {/* Global Save Button */} 
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Experience & Education"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
