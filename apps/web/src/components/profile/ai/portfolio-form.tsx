"use client"

import * as React from "react" // Added import for React namespace
import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { X, Plus, Edit, Trash2, ExternalLink, Link as LinkIcon, Github, RefreshCw, GitCommitVertical } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Shadcn UI Imports
import { cn } from "@/lib/utils" // Utility for class names
import { useMediaQuery } from "@/hooks/use-media-query" // Hook for responsive design
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Added DialogFooter for desktop
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label" // Added Label import
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"

// Project Specific Imports
import { SKILLS_Beta } from "@/constants/skills"
import { getPortfolio, createPortfolioItem, updatePortfolioItem, deletePortfolioItem } from "@/actions/settings"
import { IntegrationProvider } from "@prisma/client"
import { portfolioItemSchema as basePortfolioItemSchema, optionSchema } from "@/schemas"

// --- Schema and Types ---
const portfolioItemSchema = basePortfolioItemSchema;
type PortfolioItemFormValues = z.infer<typeof portfolioItemSchema>

interface FrontendPortfolioItem {
    id: string;
    title: string;
    description?: string | null;
    role?: string | null;
    projectUrl?: string | null;
    skillsUsed: string[];
    imageUrls: string[];
    isGithubRepo?: boolean | null;
    githubRepoUrl?: string | null;
    provider?: IntegrationProvider;
    metadata?: Record<string, any> | null;
}

// --- Helper Functions ---
const mockSkillSearch = async (value: string): Promise<Option[]> => {
   return SKILLS_Beta.filter(option =>
       option.label.toLowerCase().includes(value.toLowerCase())
   );
};

const formatLanguages = (languages: Record<string, number>): string[] => {
  if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) return [];
  // Sort by bytes descending, take top 3
  return Object.entries(languages)
    .sort(([, bytesA], [, bytesB]) => bytesB - bytesA)
    .slice(0, 3) // Show top 3 languages
    .map(([lang]) => lang);
};

// --- Component Props ---
interface PortfolioFormProps {
  userId: string
}

// --- Main Component ---
export default function PortfolioForm({ userId }: PortfolioFormProps) {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false) // State to control Dialog/Drawer visibility
  const [editingProject, setEditingProject] = useState<FrontendPortfolioItem | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)") // Media query hook

  // --- Data Fetching ---
  const { data: portfolioItems = [], isLoading } = useQuery<FrontendPortfolioItem[]>({
    queryKey: ["userPortfolio", userId],
    queryFn: () => getPortfolio(userId),
    enabled: !!userId,
  })

  // --- Form Setup ---
  const form = useForm<PortfolioItemFormValues>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      title: "",
      description: "",
      role: "",
      projectUrl: "",
      skillsUsed: [],
      imageUrls: [],
      isGithubRepo: false,
      githubRepoUrl: "",
    },
  })

  // --- Effect to Reset Form on Edit/Close ---
  useEffect(() => {
    if (isFormOpen && editingProject) { // Populate form when editing
      const skillsOptions: Option[] = editingProject.skillsUsed.map(skillName => {
        const existingOption = SKILLS_Beta.find(opt => opt.value === skillName);
        return existingOption || { label: skillName, value: skillName };
      });
      form.reset({
        id: editingProject.id,
        title: editingProject.title,
        description: editingProject.description || "",
        role: editingProject.role || "",
        projectUrl: editingProject.projectUrl || "",
        skillsUsed: skillsOptions,
        imageUrls: editingProject.imageUrls || [],
        isGithubRepo: editingProject.isGithubRepo ?? false,
        githubRepoUrl: editingProject.githubRepoUrl || "",
      });
    } else if (!isFormOpen) { // Reset form when closing
      // Delay reset slightly to avoid flicker while closing animation runs
      const timer = setTimeout(() => {
        setEditingProject(null);
        form.reset({
          id: undefined,
          title: "",
          description: "",
          role: "",
          projectUrl: "",
          skillsUsed: [],
          imageUrls: [],
          isGithubRepo: false,
          githubRepoUrl: "",
        });
      }, 150); // Adjust delay as needed
      return () => clearTimeout(timer);
    }
  }, [editingProject, form, isFormOpen]); // Depend on isFormOpen now


  // --- Mutations ---
  const mutationOptions = {
    onSuccess: (data: { success?: string; error?: string; data?: FrontendPortfolioItem } | { success?: string; error?: string }) => {
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: data.success });
        queryClient.invalidateQueries({ queryKey: ["userPortfolio", userId] });
        setIsFormOpen(false);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    },
  };
  const addItemMutation = useMutation({
    mutationFn: createPortfolioItem,
    ...mutationOptions
  });
  const updateItemMutation = useMutation({
    mutationFn: updatePortfolioItem,
    ...mutationOptions
  });

  // Delete Mutation
  const deleteItemMutation = useMutation({
    mutationFn: deletePortfolioItem,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["userPortfolio", userId] });
      const previousItems = queryClient.getQueryData<FrontendPortfolioItem[]>(["userPortfolio", userId]) || [];
      queryClient.setQueryData<FrontendPortfolioItem[]>(["userPortfolio", userId], (old) =>
        (old || []).filter((item) => item.id !== itemId),
      );
      toast({ title: "Deleting..." });
      return { previousItems };
    },
    onError: (err: any, itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["userPortfolio", userId], context.previousItems);
      }
      toast({ title: "Error", description: err?.message || "Failed to delete project.", variant: "destructive" });
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({ title: "Success", description: data.success });
      } else if (data?.error) {
        toast({ title: "Delete Error", description: data.error, variant: "destructive" });
        // Invalidate here to potentially rollback optimistic update if server failed
        queryClient.invalidateQueries({ queryKey: ["userPortfolio", userId] });
      }
    },
    onSettled: () => {
      // Ensure data is fresh after any outcome
      queryClient.invalidateQueries({ queryKey: ["userPortfolio", userId] });
    },
  });

  // --- Event Handlers ---
  const onSubmit = (data: PortfolioItemFormValues) => {
    if (editingProject) {
      updateItemMutation.mutate({ ...data, id: editingProject.id }) // Ensure ID is included
    } else {
      addItemMutation.mutate(data)
    }
  }

  const handleAddNewProject = () => {
    setEditingProject(null); // Ensure we are in "add" mode
    form.reset(); // Reset form immediately for "add" mode
    setIsFormOpen(true); // Open the Dialog/Drawer
  }

  const handleEditProject = (project: FrontendPortfolioItem) => {
    setEditingProject(project) // Set project data for the form (useEffect handles reset)
    setIsFormOpen(true) // Open the Dialog/Drawer
  }

  const handleDeleteProject = (projectId: string) => {
    // Consider using a confirmation dialog here before deleting
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteItemMutation.mutate(projectId)
    }
  }

  // --- Loading State UI ---
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Portfolio</h2>
            <Skeleton className="h-9 w-28" /> {/* Skeleton for Add Button */}
          </div>
          <Separator className="mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                {/* ... Skeleton content ... */}
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- Form Component Definition (Reusable for Dialog/Drawer) ---
  const ProjectFormFields = ({ className }: { className?: string }) => (
    <Form {...form}>
      {/* Assign ID for external submit buttons */}
      <form
        id="portfolioItemForm"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)} // Apply passed className
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Personal Website Redesign" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Lead Designer, Full Stack Developer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[100px]" placeholder="Describe the project, your contributions, and outcomes..." value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectUrl"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Project URL (optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://your-project-live-url.com" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="skillsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills Used</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      value={field.value}
                      onSearch={mockSkillSearch}
                      defaultOptions={SKILLS_Beta}
                      placeholder="Select or add skills relevant to this project..."
                      creatable
                      groupBy="group"
                      onChange={field.onChange}
                      loadingIndicator={<Skeleton className="h-10 w-full" />}
                      emptyIndicator={
                        <p className="w-full text-center text-sm leading-10 text-muted-foreground">
                          No skills found. Type to search or create.
                        </p>
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Select skills from the list or type to add new ones.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Submit/Cancel Buttons are now in DialogFooter/DrawerFooter */}
      </form>
    </Form>
  );

  // --- Main Render ---
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Portfolio</h2>
          {/* Button to trigger Dialog/Drawer opening */}
          <Button onClick={handleAddNewProject} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
        <Separator className="mb-6" />

        {/* Conditional Rendering: Dialog for Desktop, Drawer for Mobile */}
        {isDesktop ? (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            {/* DialogTrigger is implicitly handled by the button above */}
            <DialogContent className="sm:max-w-[625px]"> {/* Adjusted width */}
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "Update the details for your project." : "Fill in the details to add a new project to your portfolio."} Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              {/* Render the form fields */}
              <div className="max-h-[60vh] overflow-y-auto p-1 pr-3"> {/* Scrollable area */}
                <ProjectFormFields />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                {/* Button submits the form with id="portfolioItemForm" */}
                <Button form="portfolioItemForm" type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
                  {addItemMutation.isPending || updateItemMutation.isPending
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Add Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
            {/* DrawerTrigger is implicitly handled by the button above */}
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{editingProject ? "Edit Project" : "Add New Project"}</DrawerTitle>
                <DrawerDescription>
                  {editingProject ? "Update the details for your project." : "Fill in the details to add a new project to your portfolio."} Click save when you&apos;re done.
                </DrawerDescription>
              </DrawerHeader>
              {/* Render the form fields with padding for drawer */}
              <div className="overflow-y-auto p-4"> {/* Scrollable area with padding */}
                <ProjectFormFields />
              </div>
              <DrawerFooter className="pt-2">
                {/* Button submits the form with id="portfolioItemForm" */}
                <Button form="portfolioItemForm" type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
                  {addItemMutation.isPending || updateItemMutation.isPending
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Add Project"}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}

        {/* Display Existing Portfolio Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {portfolioItems.map((project) => {
            // --- Start: Extract metadata safely ---
            const metadata = (project.metadata && typeof project.metadata === 'object') ? project.metadata : {};
            const languages = metadata.languages ?? {};
            const homepage = metadata.homepage;
            const primaryLang = metadata.language;
            const isPrivate = metadata.private;
            const commitCount = metadata.commitCount;
            const displayLanguages = formatLanguages(languages);
            // --- End: Extract metadata safely ---

        
            return (
              <Card key={project.id} className="overflow-hidden flex flex-col">
                <CardContent className="pt-6 flex flex-col grow">
                  {/* Project Title and Provider Badge */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 grow min-w-0">
                      {project.provider === IntegrationProvider.GITHUB && <Github className="h-5 w-5 text-gray-600 shrink-0" />}
                      <h3 className="text-xl font-semibold truncate" title={project.title}>{project.title}</h3>
                      {project.provider === IntegrationProvider.GITHUB && isPrivate && <Badge variant="outline" className="ml-2 shrink-0">Private</Badge>}
                    </div>
                    {/* Edit/Delete Buttons */}
                    <div className="flex space-x-1 shrink-0">
                      {/* Allow editing for both CUSTOM and GITHUB projects to modify internal record (e.g., add skills) */}
                      {(project.provider === IntegrationProvider.CUSTOM || project.provider === IntegrationProvider.GITHUB) && (
                        <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)} className="h-8 w-8" title="Edit Project Details / Add Skills">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleteItemMutation.isPending && deleteItemMutation.variables === project.id}
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete Project"
                      >
                        {deleteItemMutation.isPending && deleteItemMutation.variables === project.id ?
                          <RefreshCw className="h-4 w-4 animate-spin" /> :
                          <Trash2 className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                  {project.role && <p className="text-muted-foreground text-sm mb-2">{project.role}</p>}

                  {/* Description */}
                  {project.description && <p className="text-sm mb-3 text-muted-foreground line-clamp-3 grow">{project.description}</p>}

                  {/* Spacer to push content below description down */}
                  <div className="grow"></div>

                  {/* Links */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm my-4">
                    {project.provider === IntegrationProvider.GITHUB && project.githubRepoUrl && (
                      <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer" title="View on GitHub" className="flex items-center text-gray-700 hover:text-black hover:underline">
                        <Github className="h-4 w-4 mr-1.5" /> GitHub
                      </a>
                    )}
                    {project.provider === IntegrationProvider.CUSTOM && project.projectUrl && (
                      <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" title="Visit Project" className="flex items-center text-blue-600 hover:underline">
                        <LinkIcon className="h-4 w-4 mr-1.5" /> Project Link
                      </a>
                    )}
                    {project.provider === IntegrationProvider.GITHUB && homepage && (
                      <a href={homepage} target="_blank" rel="noopener noreferrer" title="Visit Deployment/Homepage" className="flex items-center text-green-700 hover:text-green-800 hover:underline">
                        <ExternalLink className="h-4 w-4 mr-1.5" /> Deployment
                      </a>
                    )}
                  </div>

                  {/* Skills, Languages & Commits */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {/* Display User-Added Skills */}
                      {project.skillsUsed && project.skillsUsed.length > 0 && project.skillsUsed.map((skill) => (
                        <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                      ))}
                      {/* Display GitHub Languages */}
                      {project.provider === IntegrationProvider.GITHUB && displayLanguages.length > 0 && (
                        displayLanguages.map((lang) => (
                          <Badge key={lang} variant="outline" className="font-normal">{lang}</Badge>
                        ))
                      )}
                      {/* Display GitHub Primary Language (if not in top 3) */}
                      {project.provider === IntegrationProvider.GITHUB && primaryLang &&
                        !displayLanguages.includes(primaryLang) && (
                          <Badge variant="outline" className="font-normal">{primaryLang}</Badge>
                        )}
                      {/* Display Commit Count */}
                      {project.provider === IntegrationProvider.GITHUB && commitCount !== null && commitCount !== undefined && (
                          <Badge variant="outline" className="font-normal bg-gray-50 text-gray-600 border-gray-200">
                              <GitCommitVertical className="h-3 w-3 mr-1.5" />
                              {commitCount}{commitCount === 100 ? '+' : ''} commits
                          </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {portfolioItems.length === 0 && (
          <div className="text-center py-10 border border-dashed border-border rounded-lg mt-6">
            <p className="text-muted-foreground mb-4">You haven&apos;t added any projects to your portfolio yet.</p>
            {/* Button triggers Dialog/Drawer opening */}
            <Button onClick={handleAddNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}