"use client"
import { QueryClientProvider, QueryClient, useQuery } from "@tanstack/react-query"
import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Resolver, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { User, ProjectStatus, ProjectVisibility } from "@0unveiled/database/schema"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Info, ListChecks, BrainCircuit } from "lucide-react"

import { FaSpinner } from "react-icons/fa6"

import BlockTextEditor from "@/components/global/rich-text-editor"
import { Skeleton } from "@/components/ui/skeleton"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"
import { getAllSkills, SkillProp } from "@/data/skills"
import { createProject } from "@/actions/project"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { Textarea } from "@/components/ui/textarea"
import { createProjectFormSchema, CreateProjectFormValues } from "@/schemas"

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  group: z.string().optional(),
});

const roleSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Role title must be at least 3 characters"),
    description: z.string().max(500, "Role description cannot exceed 500 characters").optional().or(z.literal("")),
    skills: z.array(optionSchema).min(1, "At least one skill is required for a role."),
});




const steps = [
  { id: "step1", title: "Core Information", icon: Info },
  { id: "step2", title: "Details & Skills", icon: BrainCircuit },
  { id: "step3", title: "Review & Submit", icon: ListChecks },
];

const mapSkillsToOptions = (skills: SkillProp[] | undefined | null): Option[] => {
  if (!skills) return [];
  return skills.map(skill => ({
    label: skill.name,
    value: skill.id,
    group: skill.category || 'Other',
  }));
};

function CreateProjectForm({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0);
  const [onDescription, setOnDescription] = useState('');
  const [onHtmlDescription, setOnHtmlDescription] = useState('');
  const [onJsonDescription, setJsonDescription] = useState<any>(null);

  const { data: availableSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['availableSkills'],
    queryFn: getAllSkills,
  });

  const skillOptions = useMemo(() => mapSkillsToOptions(availableSkills), [availableSkills]);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema) as Resolver<CreateProjectFormValues>,
    defaultValues: {
      title: "",
      publicSummary: "",
      description: "",
      jsonDescription: null,
      htmlDescription: "",
      visibility: ProjectVisibility.PUBLIC,
      status: ProjectStatus.PLANNING,
      startDate: null,
      endDate: null,
      requiredSkills: [],
      roles: [],
    },
    mode: "onChange",
  });

  const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
      control: form.control,
      name: "roles",
  });

  const watchedValues = form.watch();

  const { mutate: submitProject, isPending } = useMutation({
    mutationFn: createProject,
    onSuccess: (result) => {
      if (result?.success && result.projectId) {
        toast({ title: "Success!", description: "Project created successfully." });
        queryClient.invalidateQueries({ queryKey: ['userProfile', user.id, 'projects'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        router.push(`/project/${result.projectId}`);
      } else {
        toast({ title: "Error", description: result?.error || "Failed to create project.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      toast({ title: "Error", description: error?.message || "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const onSubmit = (values: CreateProjectFormValues) => {
    const finalValues = {
      ...values,
      description: onDescription,
      jsonDescription: onJsonDescription,
      htmlDescription: onHtmlDescription,
    };

    submitProject({ userId: user.id, formData: finalValues });
  };

  const nextStep = async () => {
    let fieldsToValidate: Array<keyof CreateProjectFormValues> = [];
    if (currentStep === 0) {
      fieldsToValidate = ['title', 'publicSummary', 'description', 'visibility', 'status', 'htmlDescription'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['requiredSkills', 'roles', 'startDate', 'endDate'];
    }

    const isValid = await form.trigger(fieldsToValidate);

    let isEditorValid = form.formState.errors.description ? false : true;
    if(currentStep === 0 && !isEditorValid) {
        // Re-trigger validation specifically for description if needed, 
        // but schema validation on change/blur should handle it.
        // await form.trigger('description');
        // await form.trigger('htmlDescription'); // trigger this too
    } else {
         form.clearErrors("description"); // Clear manual error if any existed
    }

    if (isValid && isEditorValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
       toast({ title: "Validation Error", description: "Please fix the errors before proceeding.", variant: "destructive" });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
      form.setValue('description', onDescription, { shouldValidate: true, shouldDirty: true });
      form.setValue('jsonDescription', onJsonDescription, { shouldDirty: true });
      form.setValue('htmlDescription', onHtmlDescription, { shouldValidate: true, shouldDirty: true });
  }, [onDescription, onJsonDescription, onHtmlDescription, form]);

  return (
    <>
     <div className="fixed top-0 left-0 right-0 h-1 z-50">
       <Progress
         value={(currentStep + 1) * (100 / steps.length)}
         className="h-full"
       />
     </div>

      <div className="flex flex-col lg:flex-row gap-12 mt-4">
        <div className="w-full lg:w-64 space-y-1 shrink-0">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentStep;
            const hasErrors = Object.keys(form.formState.errors).length > 0 && index < currentStep;

            return (
              <button
                key={step.id}
                className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                     currentStep === index
                    ? "bg-primary text-primary-foreground"
                    : isCompleted && !hasErrors
                    ? "text-green-600 hover:bg-muted"
                    : hasErrors
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-muted"
                )}
                onClick={() => setCurrentStep(index)}
                disabled={isPending}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{step.title}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0">
          <Form {...form}>
            <form
              className="space-y-8"
            >
              {currentStep === 0 && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a catchy project title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publicSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Summary*</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a short, engaging summary visible to everyone (max 300 chars)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This summary is shown publicly. Keep it concise and appealing.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormDescription>
                           Provide full project details here. This description is only visible to accepted project members.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  <SelectItem value={ProjectVisibility.PUBLIC}>Public (Visible to everyone)</SelectItem>
                                  <SelectItem value={ProjectVisibility.PRIVATE}>Private (Visible only to members)</SelectItem>
                                </SelectContent>
                              </Select>
                               <FormDescription>Choose who can see this project.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                       <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initial Status*</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select initial status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                                  <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Set the current stage of the project.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                   </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
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
                              placeholder="Select general skills needed for the project overall..."
                              loadingIndicator={
                                  <div className="p-3 space-y-2">
                                      <Skeleton className="w-2/3 h-4" />
                                      <Skeleton className="w-1/2 h-4" />
                                  </div>
                              }
                              emptyIndicator={
                                <p className="p-3 text-center text-sm text-muted-foreground">
                                  {isLoadingSkills ? "Loading skills..." : "No skills found or available."}
                                </p>
                              }
                              maxSelected={20}
                              groupBy="group"
                            />
                          </FormControl>
                          <FormDescription>Select overall skills relevant to the project (max 20).</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <div className="space-y-6">
                     <FormLabel>Open Roles (Optional)</FormLabel>
                     <FormDescription>
                        Define specific roles you need collaborators for.
                     </FormDescription>
                     {roleFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button 
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
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
                                    <FormLabel>Role Description (Optional)</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Describe the responsibilities for this role... (max 500 chars)"
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
                                                placeholder="Select skills specific to this role..."
                                                loadingIndicator={
                                                    <>
                                                        <div className="p-3 space-y-2">
                                                            <Skeleton className="w-2/3 h-4" />
                                                            <Skeleton className="w-1/2 h-4" />
                                                        </div>
                                                    </>
                                                }
                                                emptyIndicator={
                                                    <>
                                                        <p className="p-3 text-center text-sm text-muted-foreground">
                                                            {isLoadingSkills ? "Loading skills..." : "No skills found or available."}
                                                        </p>
                                                    </>
                                                }
                                                maxSelected={10}
                                                groupBy="group"
                                            />
                                        </FormControl>
                                         <FormDescription>Select at least one skill for this role (max 10).</FormDescription>
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
                     {form.formState.errors.roles?.root && (
                            <p className="text-sm font-medium text-destructive">
                                {form.formState.errors.roles.root.message}
                            </p>
                        )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date (Optional)</FormLabel>
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
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ?? undefined}
                                  onSelect={(date) => field.onChange(date ?? null)}
                                  disabled={(date) => date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Estimated project start date.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                           <FormItem className="flex flex-col">
                            <FormLabel>End Date (Optional)</FormLabel>
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
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
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
                            <FormDescription>Estimated project completion date.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                   <h3 className="text-xl font-semibold mb-4 border-b pb-2">Review Your Project</h3>
                    <div className="space-y-4 rounded-lg border bg-muted/40 p-6">
                       <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                           <div>
                             <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                             <dd className="mt-1 text-base">{watchedValues.title || "-"}</dd>
                           </div>
                           <div>
                             <dt className="text-sm font-medium text-muted-foreground">Visibility</dt>
                             <dd className="mt-1 text-base capitalize">{watchedValues.visibility?.toLowerCase() || "-"}</dd>
                           </div>
                           <div>
                             <dt className="text-sm font-medium text-muted-foreground">Initial Status</dt>
                             <dd className="mt-1 text-base capitalize">{watchedValues.status?.toLowerCase().replace(/_/g, ' ') || "-"}</dd>
                           </div>
                           <div className="md:col-span-2">
                              <dt className="text-sm font-medium text-muted-foreground">Public Summary</dt>
                              <dd className="mt-1 text-base whitespace-pre-wrap">{watchedValues.publicSummary || <span className="italic text-muted-foreground">Not provided.</span>}</dd>
                           </div>
                           <div className="md:col-span-2">
                              <dt className="text-sm font-medium text-muted-foreground">Detailed Description (Team Only)</dt>
                              <dd
                                 className="mt-1 prose prose-sm dark:prose-invert max-w-none border rounded p-3 bg-background max-h-48 overflow-y-auto"
                                 dangerouslySetInnerHTML={{ __html: watchedValues.htmlDescription || "<p class='text-muted-foreground italic'>No description provided.</p>" }}
                              />
                           </div>
                            <div>
                             <dt className="text-sm font-medium text-muted-foreground">Start Date</dt>
                             <dd className="mt-1 text-base">{watchedValues.startDate ? format(watchedValues.startDate, "PPP") : <span className="italic text-muted-foreground">Not set</span>}</dd>
                           </div>
                           <div>
                             <dt className="text-sm font-medium text-muted-foreground">End Date</dt>
                             <dd className="mt-1 text-base">{watchedValues.endDate ? format(watchedValues.endDate, "PPP") : <span className="italic text-muted-foreground">Not set</span>}</dd>
                           </div>
                            <div className="md:col-span-2">
                             <dt className="text-sm font-medium text-muted-foreground">General Project Skills</dt>
                             <dd className="mt-1 flex flex-wrap gap-2">
                               {watchedValues.requiredSkills && watchedValues.requiredSkills.length > 0 ? (
                                  watchedValues.requiredSkills.map((skill) => (
                                    <Badge key={skill.value} variant="secondary">{skill.label}</Badge>
                                  ))
                               ) : (
                                   <span className="italic text-muted-foreground">No general skills specified.</span>
                               )}
                             </dd>
                           </div>
                           <div className="md:col-span-2">
                              <dt className="text-sm font-medium text-muted-foreground">Open Roles</dt>
                              <dd className="mt-1 space-y-3">
                                 {watchedValues.roles && watchedValues.roles.length > 0 ? (
                                    watchedValues.roles.map((role, index) => (
                                       <div key={index} className="p-3 border rounded-md bg-background">
                                          <p className="font-semibold">{role.title}</p>
                                          {role.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{role.description}</p>}
                                          <div className="mt-2">
                                             <p className="text-xs font-medium mb-1">Skills Required:</p>
                                             <div className="flex flex-wrap gap-1">
                                                {role.skills && role.skills.length > 0 ? (
                                                   role.skills.map(skill => (
                                                       <Badge key={skill.value} variant="outline">{skill.label}</Badge>
                                                   ))
                                                ) : (
                                                    <span className="text-xs italic text-muted-foreground">No specific skills listed for this role.</span>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    ))
                                 ) : (
                                     <span className="italic text-muted-foreground">No open roles defined.</span>
                                 )}
                              </dd>
                           </div>
                       </dl>
                    </div>
                </div>
              )}

              <div className="flex justify-between pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isPending}
                >
                  Previous
                </Button>

                {currentStep === steps.length - 1 ? (
                   <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isPending || !form.formState.isValid}
                   >
                     {isPending ? (
                        <> <FaSpinner className="animate-spin mr-2" /> Submitting... </>
                     ) : (
                        "Create Project"
                     )}
                   </Button>
                ) : (
                  <Button type="button" onClick={nextStep} disabled={isPending}>
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}

const queryClient = new QueryClient();

export default function CreateProjectPageWrapper(props: { user: User }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CreateProjectForm {...props} />
    </QueryClientProvider>
  );
}
