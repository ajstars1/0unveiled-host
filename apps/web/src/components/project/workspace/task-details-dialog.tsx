'use client'

import React, { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getTaskById } from '@/data/tasks'
import { updateTask, deleteTask } from '@/actions/tasks'
import { UpdateTaskSchema, DeleteTaskSchema } from '@/schemas/task'
import { TaskStatus, User } from "@0unveiled/database/schema"
import { getProjectById } from '@/data/projects' // For members list
import type { MemberSummary } from '@/data/projects'
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Trash2, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// For Delete Confirmation
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// --- Define Task Type Manually (matching KanbanBoard) ---
// Based on the select statement in getTaskById (and getTasksByProjectId)
type AssigneeSummary = Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'profilePicture'> | null;

type TaskWithAssignee = {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number | null;
    dueDate: Date | null;
    order: number | null; // Include order
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    assigneeId: string | null;
    assignee: AssigneeSummary;
};

interface TaskDetailsDialogProps {
  taskId: string;
  projectId: string;
  trigger: React.ReactNode;
}

// Explicitly define form values type matching the FINAL expected state for the form fields
type UpdateTaskFormValues = {
  taskId: string;
  projectId: string;
  title?: string | undefined;
  description?: string | undefined;
  status?: TaskStatus | undefined;
  // Use string | undefined for form state. 
  // The Select component sends "unassigned" or cuid. 
  // The schema/action handles conversion if necessary (though Update schema currently allows strings).
  assigneeId?: string | undefined; 
  priority?: number | undefined; // Use number | undefined for form state
  dueDate?: Date | undefined; 
};

// Original inferred type (commented out for reference)
// type UpdateTaskFormValues = z.infer<typeof UpdateTaskSchema>;

export function TaskDetailsDialog({ taskId, projectId, trigger }: TaskDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Fetch Task Data --- 
  const { 
    data: taskData, 
    isLoading: isLoadingTask, 
    isError: isErrorTask,
    error: taskError,
    refetch: refetchTask // Function to refetch task data
  } = useQuery<TaskWithAssignee | null>({
    queryKey: ['taskDetails', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: isOpen, // Only fetch when the dialog is open
  });

  // --- Fetch Project Members (for assignee dropdown) --- 
  const { data: projectData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['projectMembersForTask', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: isOpen, 
    select: (data) => data?.members || [], // Select only members
  });
  const members = projectData || [];

  // --- Form Setup --- 
  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(UpdateTaskSchema) as unknown as Resolver<UpdateTaskFormValues>, // Assert type
    // Default values will be set by useEffect when taskData loads
    defaultValues: { taskId, projectId }, 
  });

  // --- Effect to reset form with fetched task data --- 
  useEffect(() => {
    if (taskData && isOpen) {
      form.reset({
        taskId: taskData.id,
        projectId: projectId,
        title: taskData.title ?? undefined, // Use nullish coalescing for safety
        description: taskData.description ?? undefined,
        status: taskData.status ?? undefined,
        // Handle assigneeId carefully: If taskData.assignee is null/undefined, reset to undefined.
        // If taskData.assignee exists, use its id.
        // The form select uses "unassigned" value, but defaultValues should match the state type (string | undefined).
        assigneeId: taskData.assignee?.id ?? undefined, 
        priority: taskData.priority ?? undefined,
        dueDate: taskData.dueDate ?? undefined,
      });
    }
     // Add form to dependency array for safety, though reset should handle it
  }, [taskData, isOpen, form, projectId]); 

  // --- Update Task Mutation --- 
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message });
        queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }); // Invalidate Kanban list
        queryClient.invalidateQueries({ queryKey: ['taskDetails', taskId] }); // Invalidate this task's details
        // Keep dialog open after update? Or close? User preference maybe.
        // setIsOpen(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message });
      }
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Mutation Error", description: "Failed to update task." });
    },
  });

   // --- Delete Task Mutation --- 
   const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (data) => {
        if (data.success) {
            toast({ title: "Success", description: data.message });
            queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }); // Invalidate Kanban list
            queryClient.removeQueries({ queryKey: ['taskDetails', taskId] }); // Remove deleted task data
            setIsOpen(false); // Close dialog after delete
        } else {
            toast({ variant: "destructive", title: "Error", description: data.message });
        }
    },
    onError: (error) => {
        toast({ variant: "destructive", title: "Mutation Error", description: "Failed to delete task." });
    },
   });

  // --- Form Submit Handler --- 
  const onSubmit = (values: UpdateTaskFormValues) => {
    // Note: The UpdateTaskSchema currently allows "null_value"/"" for assigneeId.
    // If the updateTask action expects null instead, conversion logic like in AddTaskDialog might be needed here.
    // For now, assume the action handles the string values or the schema is aligned.
    const changedValues = { ...values, taskId, projectId }; 
    updateTaskMutation.mutate(changedValues);
  };

  // --- Delete Handler --- 
  const handleDelete = () => {
    deleteTaskMutation.mutate({ taskId, projectId });
  };

  // --- Render Logic --- 
  const renderContent = () => {
    if (isLoadingTask) {
      return (
        <>
          <DialogHeader>
          </DialogHeader>
          <div className="space-y-4 p-6 pt-4"> {/* Add pt-4 */}
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Add a placeholder footer maybe? */} 
          <DialogFooter className="px-6 pb-6 pt-2">
             <Skeleton className="h-10 w-20" />
             <Skeleton className="h-10 w-24" />
          </DialogFooter>
        </>
      );
    }

    if (isErrorTask || !taskData) {
      return (
         <>
            <DialogHeader>
                <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 text-destructive"> {/* Add pt-4 */}
            Error loading task details: {taskError instanceof Error ? taskError.message : "Task not found or could not be loaded."}
            <Button variant="outline" size="sm" onClick={() => refetchTask()} className="ml-4">
                Retry
            </Button>
            </div>
            <DialogFooter className="px-6 pb-6 pt-2">
                <Skeleton className="h-10 w-20" />
            </DialogFooter>
         </>
      );
    }

    // --- Main Form Content (already includes DialogHeader/Title) --- 
    return (
      <>
        <DialogHeader className="pt-6 px-6 pb-2"> {/* Add padding */} 
            <DialogTitle>{taskData?.title ?? "Task Details"}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Form Area */} 
        <div className="px-6 pb-0 max-h-[60vh] overflow-y-auto"> {/* Adjust padding/height */} 
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6"> {/* Add bottom padding */} 
                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
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
                        <FormControl><Textarea className="resize-none" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {/* Status / Assignee Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Status Field */}
                     <FormField
                       control={form.control}
                       name="status"
                       render={({ field }) => (
                           <FormItem>
                           <FormLabel>Status</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                               {Object.values(TaskStatus).map(status => (
                                   <SelectItem key={status} value={status}>{status.replace('_',' ')}</SelectItem>
                               ))}
                               </SelectContent>
                           </Select>
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
                           {/* Use value={field.value ?? 'unassigned'} to handle null/undefined state */}
                           <Select onValueChange={field.onChange} value={field.value ?? 'unassigned'} disabled={isLoadingMembers}>
                               <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                               <SelectContent>
                               {/* Ensure the value here matches the one used in defaultValue/value */}
                               <SelectItem value="unassigned">Unassigned</SelectItem>
                               {members.map((member: MemberSummary) => (
                                   <SelectItem key={member.user.id} value={member.user.id}>
                                       <div className="flex items-center gap-2">
                                           <img src={member.user.profilePicture || '/images/default-avatar.png'} alt={member.user.username || 'avatar'} className="h-5 w-5 rounded-full"/>
                                           <span>{member.user.username}</span>
                                       </div>
                                   </SelectItem>
                               ))}
                               </SelectContent>
                           </Select>
                           <FormMessage />
                           </FormItem>
                       )}
                       />
                </div>
                {/* Priority / DueDate Row */}
                 <div className="grid grid-cols-2 gap-4">
                    {/* Priority Field */}
                     <FormField
                       control={form.control}
                       name="priority"
                       render={({ field }) => (
                           <FormItem>
                           <FormLabel>Priority</FormLabel>
                            {/* Use value={field.value?.toString() ?? 'none'} */}
                           <Select onValueChange={(val) => field.onChange(val === 'none' ? undefined : parseInt(val, 10))} value={field.value?.toString() ?? 'none'}>
                               <FormControl><SelectTrigger><SelectValue placeholder="Set priority" /></SelectTrigger></FormControl>
                               <SelectContent>
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
                    {/* DueDate Field */}
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col pt-2"> {/* Adjusted pt-2 for alignment */}
                            <FormLabel>Due Date</FormLabel>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline-solid"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={field.value ?? undefined} // Pass Date | undefined
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {/* Footer buttons are moved outside this form tag */}
                </form>
            </Form>
        </div>
          
        {/* Footer outside the scrollable area */}
        <DialogFooter className="px-6 pb-6 pt-4 border-t sm:justify-between"> {/* Add border-t */} 
            {/* Delete Button with Confirmation */}
            <AlertDialog>
                 <AlertDialogTrigger asChild>
                     <Button type="button" variant="destructive" size="sm" className="mr-auto">
                         <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                     </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                     <AlertDialogHeader>
                     <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                     <AlertDialogDescription>
                         This action cannot be undone. This will permanently delete the task.
                     </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                     <AlertDialogAction onClick={handleDelete} disabled={deleteTaskMutation.isPending}>
                          {deleteTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                          Delete
                     </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>
            
            {/* Cancel / Save Buttons */} 
            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={updateTaskMutation.isPending}>
                Cancel
                </Button>
                {/* Link this button to the form's submit handler */} 
                <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={updateTaskMutation.isPending || deleteTaskMutation.isPending}>
                {updateTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </div>
        </DialogFooter>
      </>
    );
  };

  // --- Dialog Structure --- 
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0"> 
        {/* Render loading, error, or form content */}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
} 