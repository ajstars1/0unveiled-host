"use client"
// Wrap with QueryClientProvider if useQuery is used directly here, 
// otherwise ensure it's provided higher up the tree.
import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Resolver, useFieldArray } from "react-hook-form"
import { z } from "zod"
import type { User } from "@0unveiled/database/schema"
import { projectStatusEnum, projectVisibilityEnum } from "@0unveiled/database"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Info, BrainCircuit, ListChecks } from "lucide-react"
import { FaSpinner } from "react-icons/fa6"

import BlockTextEditor from "@/components/global/rich-text-editor"
import { Skeleton } from "@/components/ui/skeleton"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"
import { getAllSkills, SkillProp } from "@/data/skills" 
// Import the project type and validation schema (can likely reuse create schema)
import { ProjectProp, MemberSummary } from "@/data/projects"
import { updateProject, deleteProject } from "@/actions/project" // We will create this action later
import { toast } from "@/hooks/use-toast"
import { CreateProjectFormValues } from "@/schemas"
import { createProjectFormSchema } from "@/schemas"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Props for the edit form component
interface EditProjectFormProps {
  projectId: string;
  initialData: ProjectProp; // Existing project data
  user: User; // Current user for permission checks (maybe in action)
}

// Runtime-safe enum values
const VIS_PUBLIC = projectVisibilityEnum.enumValues.find(v => v.toUpperCase?.() === 'PUBLIC') || 'PUBLIC'
const VIS_PRIVATE = projectVisibilityEnum.enumValues.find(v => v.toUpperCase?.() === 'PRIVATE') || 'PRIVATE'
const STATUS_PLANNING = projectStatusEnum.enumValues.find(v => v.toUpperCase?.() === 'PLANNING') || 'PLANNING'
const STATUS_ACTIVE = projectStatusEnum.enumValues.find(v => v.toUpperCase?.() === 'ACTIVE') || 'ACTIVE'
const STATUS_ON_HOLD = projectStatusEnum.enumValues.find(v => v.toUpperCase?.() === 'ON_HOLD') || 'ON_HOLD'
const STATUS_COMPLETED = projectStatusEnum.enumValues.find(v => v.toUpperCase?.() === 'COMPLETED') || 'COMPLETED'
const STATUS_ARCHIVED = projectStatusEnum.enumValues.find(v => v.toUpperCase?.() === 'ARCHIVED') || 'ARCHIVED'

const mapSkillsToOptions = (skills: Array<{ id: string, name: string, category?: string | null }> | undefined | null): Option[] => {
  if (!skills) return [];
  return skills.map(skill => ({
    label: skill.name,
    value: skill.id,
    group: skill.category || 'Other',
  }));
};

// Main Edit Form Component
export function EditProjectForm({ projectId, initialData, user }: EditProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for rich text editor content derived from initialData
  // Remove textDescription state, rely on json/html derived from initial state
  // const [onDescription, setOnDescription] = useState(initialData.description || '');
  // const [onHtmlDescription, setOnHtmlDescription] = useState(initialData.htmlDescription || '');

  // Attempt to parse description field (assuming it contains JSON) 
  let initialJsonContent = null;
  if (initialData.jsonDescription) { // Check the correct field
      try {
          // Ensure description is treated as the source of JSON
          initialJsonContent = typeof initialData.jsonDescription === 'string' 
              ? JSON.parse(initialData.jsonDescription) 
              : initialData.jsonDescription; // Assume it's already an object if not string

           // Basic check if it looks like TipTap JSON
           if (!initialJsonContent || typeof initialJsonContent !== 'object' || !initialJsonContent.type) { 
               console.warn("Initial description doesn't seem to be valid TipTap JSON.");
               initialJsonContent = null;
           }
      } catch (e) {
          console.error("Failed to parse initial description as JSON:", e);
          initialJsonContent = null;
      }
  }
  // Initialize editor state with parsed JSON or null
  const [onJsonDescription, setJsonDescription] = useState<any>(initialJsonContent);
  // These will be derived by the editor based on onJsonDescription
  const [onDescription, setOnDescription] = useState<string>(''); // Derived text
  const [onHtmlDescription, setOnHtmlDescription] = useState<string>(''); // Derived HTML

  // Fetch available skills for selectors
  const { data: availableSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['availableSkills'],
    queryFn: getAllSkills,
  });
  const skillOptions = useMemo(() => mapSkillsToOptions(availableSkills), [availableSkills]);

  // --- Form Setup ---
  const form = useForm<CreateProjectFormValues>({ 
    resolver: zodResolver(createProjectFormSchema) as Resolver<CreateProjectFormValues>,
    defaultValues: {
      title: initialData.title || "",
      publicSummary: initialData.publicSummary || "",
      // description: initialData.description || "", // Set by useEffect
      description: "", // Let useEffect handle sync from editor state
      jsonDescription: initialJsonContent, // Use parsed content for editor initial state
      // htmlDescription: initialData.htmlDescription || "", // Remove this field
      htmlDescription: "", // Set by useEffect
  visibility: initialData.visibility || VIS_PUBLIC,
  status: initialData.status || STATUS_PLANNING,
      startDate: initialData.startDate ? new Date(initialData.startDate) : null,
      endDate: initialData.endDate ? new Date(initialData.endDate) : null,
      // Map required skills from initialData to Option[] format
      requiredSkills: mapSkillsToOptions(initialData.requiredSkills),
      // Map roles from initialData
      roles: initialData.roles ? initialData.roles.map(role => ({
          id: role.id, // Include existing role ID if needed for update logic
          title: role.title || "",
          description: role.description || "",
          // Map role's required skills to Option[] format
          skills: mapSkillsToOptions(role.requiredSkills)
      })) : [],
    },
    mode: "onChange", 
  });

  const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
      control: form.control,
      name: "roles",
  });

  // --- Mutation Setup ---
  const { mutate: submitUpdateProject, isPending: isUpdating } = useMutation({
    mutationFn: updateProject,
    onSuccess: (result) => {
      if (result?.success && result.projectId) {
        toast({ title: "Success!", description: "Project updated successfully." });
        queryClient.invalidateQueries({ queryKey: ['projectDetails', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projectsByUserId', user.id] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        toast({ title: "Error", description: result?.error || "Failed to update project.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      console.error("Project update error:", error);
      toast({ title: "Error", description: error?.message || "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const { mutate: submitDeleteProject, isPending: isDeleting } = useMutation({
      mutationFn: deleteProject,
      onSuccess: (result) => {
          if (result?.success) {
              toast({ title: "Success!", description: "Project deleted successfully." });
              queryClient.invalidateQueries({ queryKey: ['projectsByUserId', user.id] });
              queryClient.invalidateQueries({ queryKey: ['projects'] });
              setIsDeleteDialogOpen(false);
              router.push('/dashboard');
          } else {
              toast({ title: "Error", description: result?.error || "Failed to delete project.", variant: "destructive" });
              setIsDeleteDialogOpen(false);
          }
      },
      onError: (error: any) => {
          console.error("Project deletion error:", error);
          toast({ title: "Error", description: error?.message || "An unexpected error occurred during deletion.", variant: "destructive" });
          setIsDeleteDialogOpen(false);
      },
  });

  const handleDeleteConfirm = () => {
    submitDeleteProject({ projectId });
  };

  // --- Submit Handler ---
  const onSubmit = (values: CreateProjectFormValues) => {
    const finalValues = {
      ...values,
      description: onDescription, // Ensure latest text content is used
      jsonDescription: onJsonDescription,
      htmlDescription: onHtmlDescription,
    };
    // Call the update mutation, passing projectId and data
    submitUpdateProject({ projectId, formData: finalValues }); 
  };

  // --- Editor Sync Effect ---
   useEffect(() => {
      form.setValue('description', onDescription, { shouldValidate: true, shouldDirty: true });
      form.setValue('jsonDescription', onJsonDescription, { shouldDirty: true });
      form.setValue('htmlDescription', onHtmlDescription, { shouldValidate: true, shouldDirty: true });
  }, [onDescription, onJsonDescription, onHtmlDescription, form]);

  // --- Render Logic ---
  // (Form fields will be added in subsequent steps)
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>Core Information</CardTitle>
                <CardDescription>Update the basic details of your project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {/* TODO: Add FormField for title */}
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Project title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 {/* TODO: Add FormField for publicSummary */}
                  <FormField
                    control={form.control}
                    name="publicSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Summary*</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short, engaging summary (max 300 chars)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 {/* TODO: Add FormField for description (Rich Text) */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description* (Team Members Only)</FormLabel>
                        <FormControl>
                          <BlockTextEditor
                            errors={form.formState.errors}
                            name="description"
                            min={10}
                            max={5000}
                            inline={false}
                            onEdit
                            textContent={onDescription}
                            content={onJsonDescription}
                            setContent={setJsonDescription}
                            htmlContent={onHtmlDescription}
                            setTextContent={setOnDescription as Dispatch<SetStateAction<string | undefined>>}
                            setHtmlContent={setOnHtmlDescription as Dispatch<SetStateAction<string | undefined>>}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 {/* TODO: Add FormField for visibility */}
                  <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={VIS_PUBLIC}>Public</SelectItem>
                              <SelectItem value={VIS_PRIVATE}>Private</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 {/* TODO: Add FormField for status */}
                  <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {/* Include all relevant statuses for editing */}
                              <SelectItem value={STATUS_PLANNING}>Planning</SelectItem>
                              <SelectItem value={STATUS_ACTIVE}>Active</SelectItem>
                              <SelectItem value={STATUS_ON_HOLD}>On Hold</SelectItem>
                              <SelectItem value={STATUS_COMPLETED}>Completed</SelectItem>
                              <SelectItem value={STATUS_ARCHIVED}>Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Details & Skills</CardTitle>
                <CardDescription>Update dates and required skills.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-6">
                 {/* TODO: Add FormField for startDate */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline-solid"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={(date) => field.onChange(date ?? null)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 {/* TODO: Add FormField for endDate */}
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline-solid"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={(date) => field.onChange(date ?? null)}
                               disabled={(date) =>
                                     (form.getValues("startDate") && date < form.getValues("startDate")!) ||
                                     date < new Date("1900-01-01")
                                  }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 {/* TODO: Add FormField for requiredSkills */}
                   <FormField
                      control={form.control}
                      name="requiredSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Project Skills*</FormLabel>
                          <FormControl>
                            <MultipleSelector
                              value={field.value}
                              onChange={field.onChange}
                              defaultOptions={skillOptions}
                              options={skillOptions}
                              placeholder="Select general project skills..."
                              loadingIndicator={<Skeleton className="h-10 w-full" />}
                              emptyIndicator={<p className="p-3 text-center text-sm text-muted-foreground">No skills found.</p>}
                              maxSelected={20}
                              groupBy="group"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
             </CardContent>
        </Card>

         <Card>
             <CardHeader>
                <CardTitle>Open Roles</CardTitle>
                <CardDescription>Update the roles needed for this project.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-6">
                {/* TODO: Add FormField for roles (useFieldArray) */}
                 {roleFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative bg-muted/20">
                        <Button 
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-6 w-6"
                            onClick={() => removeRole(index)}
                            title="Remove Role"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField
                            control={form.control}
                            name={`roles.${index}.title`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Title*</FormLabel>
                                <FormControl>
                                <Input {...field} placeholder="e.g., Lead Backend Developer" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`roles.${index}.description`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Description</FormLabel>
                                <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Role responsibilities... (max 500 chars)"
                                    className="min-h-[80px]"
                                    value={field.value ?? ""}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                            <FormField
                            control={form.control}
                            name={`roles.${index}.skills`}
                            render={({ field: roleSkillField }) => (
                                <FormItem>
                                    <FormLabel>Required Skills for Role*</FormLabel>
                                    <FormControl>
                                        <MultipleSelector
                                            value={roleSkillField.value}
                                            onChange={roleSkillField.onChange}
                                            defaultOptions={skillOptions}
                                            options={skillOptions}
                                            placeholder="Select skills for this role..."
                                            loadingIndicator={<Skeleton className="h-10 w-full" />}
                                            emptyIndicator={<p className="p-3 text-center text-sm text-muted-foreground">No skills found.</p>}
                                            maxSelected={10}
                                            groupBy="group"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    ))}
                    <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendRole({ title: "", description: "", skills: [] })}
                    className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Role
                    </Button>
             </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-8 border-t mt-8">
             <Button
                 type="button"
                 variant="destructive"
                 onClick={() => setIsDeleteDialogOpen(true)}
                 disabled={isUpdating || isDeleting}
             >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
             </Button>

             <Button
                type="submit"
                disabled={isUpdating || isDeleting || !form.formState.isDirty}
             >
               {isUpdating ? (
                  <> <FaSpinner className="animate-spin mr-2" /> Saving... </> 
               ) : (
                  "Save Changes"
               )}
             </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. This will permanently delete the project
               and all associated data (members, roles, applications, tasks, etc.).
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
             <AlertDialogAction
                 onClick={handleDeleteConfirm}
                 disabled={isDeleting}
                 className={cn(
                     "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                 )}
             >
               {isDeleting ? (
                   <> <FaSpinner className="animate-spin mr-2" /> Deleting... </> 
               ) : (
                   "Yes, delete project"
               )}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
} 