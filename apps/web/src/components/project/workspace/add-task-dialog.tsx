'use client'

import React, { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createTask } from '@/actions/tasks'
import { CreateTaskSchema } from '@/schemas/task'
import { TaskStatus } from "@0unveiled/database/schema"
// Optional: For assignee selection
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProjectById } from '@/data/projects' // To fetch members for assignee dropdown
import type { MemberSummary } from '@/data/projects'
import { Loader2 } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Define props for the dialog - Accept string ID now
interface AddTaskDialogProps {
  projectId: string;
  initialStatusId: string; // Renamed from initialStatus, accept string
  trigger: React.ReactNode;
}

// Type for column IDs (can be defined here or imported)
type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

// Infer the type from the Zod schema
// type CreateTaskFormValues = z.infer<typeof CreateTaskSchema>;

// Manually define type based on form state expectations (RHF often uses undefined)
// Zod schema handles null conversion/validation via preprocess/nullable

// Explicitly define form values type
type CreateTaskFormValues = {
  title: string;
  description?: string | undefined; 
  status: TaskStatus; // Status is set dynamically, required in form state
  projectId: string;
  // Use string | undefined for form state, allowing "", "null_value", cuid, or undefined initially.
  // The onSubmit handler will convert "" or "null_value" to null for the mutation.
  assigneeId?: string | undefined; 
  priority?: number | undefined;   // Use number | undefined for form state.
  dueDate?: Date | undefined;      // Use Date | undefined for form state.
};

export function AddTaskDialog({ projectId, initialStatusId, trigger }: AddTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Fetch project members for Assignee dropdown --- 
  // We could also pass members down from KanbanBoard if already fetched
  const { data: projectData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['projectDetails', projectId], // Use a different key than task list
    queryFn: () => getProjectById(projectId),
    enabled: isOpen, // Only fetch when the dialog is open
  });
  const members = projectData?.members || [];

  // --- Form Setup --- 
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(CreateTaskSchema) as unknown as Resolver<CreateTaskFormValues>,
    defaultValues: {
      title: "",
      description: undefined,
      projectId: projectId,
      status: undefined, 
      assigneeId: undefined,
      priority: undefined,
      dueDate: undefined,
    },
  });

  // Reset form when dialog opens or initialStatusId changes
  useEffect(() => {
    if (isOpen) {
        // Look up the enum value from the string ID client-side
        const statusEnum = TaskStatus[initialStatusId as ColumnId];
        if (!statusEnum) {
            console.error(`Invalid initialStatusId passed to AddTaskDialog: ${initialStatusId}`);
            // Handle error - maybe default to BACKLOG or disable form?
        }
      form.reset({
        title: "",
        description: undefined, // Revert to undefined
        projectId: projectId,
        status: statusEnum, // Set the resolved enum value
        assigneeId: undefined, // Revert to undefined
        priority: undefined,   // Revert to undefined
        dueDate: undefined,    // Revert to undefined
      });
    }
  }, [isOpen, initialStatusId, projectId, form]);

  // --- Create Task Mutation --- 
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message });
        queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }); 
        setIsOpen(false); 
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message });
      }
    },
    onError: (error) => {
      console.error("Create Task Mutation Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create task. Please try again." });
    },
  });

  // --- Form Submit Handler (Simplified) --- 
  const onSubmit = (values: CreateTaskFormValues) => {
    // ZodResolver handles validation.
    // The `values` object here is typed based on `z.infer<CreateTaskSchema>`
    
    // Convert assigneeId placeholder if necessary before sending
    const finalAssigneeId = (values.assigneeId === "null_value" || values.assigneeId === "") 
      ? null 
      : values.assigneeId; // Keep undefined or cuid string

    const submissionData = {
        ...values, // Spread validated values from form
        assigneeId: finalAssigneeId, // Override with potentially nulled value
        // No need to manually set status, it's part of `values` if valid
    };

    // Assert type for mutate call due to manual conversion
    createTaskMutation.mutate(submissionData as any);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Display title based on string ID */}
          <DialogTitle>Add New Task to {initialStatusId.replace('_',' ')}</DialogTitle>
          <DialogDescription>
            Fill in the details for the new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a brief description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Assignee Field */}
             <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value ?? 'null_value'} 
                        disabled={isLoadingMembers}
                    >
                        <FormControl><SelectTrigger><SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select assignee (optional)"} /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="null_value">Unassigned</SelectItem> 
                            {members.map((member: MemberSummary) => (
                                <SelectItem key={member.user.id} value={member.user.id}>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={member.user.profilePicture || '/images/default-avatar.png'} 
                                        alt={member.user.username || 'avatar'} 
                                        className="h-5 w-5 rounded-full"
                                    />
                                    <span>{member.user.username || `User ${member.user.id.substring(0, 5)}`}</span> 
                                </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                 {/* Priority Field */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select 
                            // Handle "none" value and parse others to number
                            onValueChange={(val) => field.onChange(val === 'none' ? undefined : parseInt(val, 10))} 
                            // Default to "none" if value is null/undefined
                            defaultValue={field.value?.toString() ?? 'none'}
                        >
                            <FormControl><SelectTrigger><SelectValue placeholder="Set priority" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {/* Use "none" as value instead of empty string */}
                                <SelectItem value="none">None</SelectItem>
                                {[1, 2, 3, 4, 5].map(p => (
                                    <SelectItem key={p} value={p.toString()}>{`P${p}`}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 {/* DueDate Field - Use DatePicker */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel>Due Date</FormLabel>
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline-solid"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value ?? undefined} // Pass Date | undefined
                                onSelect={field.onChange} // Handles setting Date | undefined
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={createTaskMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 