'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // Assuming TanStack Query is set up
import { TaskStatus, Prisma, User } from "@0unveiled/database/schema"
import { getTasksByProjectId } from '@/data/tasks'
import { updateTaskStatus, updateTaskOrder } from '@/actions/tasks' // Import the action and updateTaskOrder
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon, GripVertical, Pencil, CalendarIcon, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import { AddTaskDialog } from './add-task-dialog' // Import the dialog
import { TaskDetailsDialog } from './task-details-dialog' // Import the details dialog
import { format } from 'date-fns' // <-- Import format function
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KanbanBoardProps {
  projectId: string
}

// Type for column IDs (using string literals)
type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

// Define column structure using string literals for IDs
// Reordered: TODO, BACKLOG, IN_PROGRESS, DONE
const columnDefinitions: { id: ColumnId; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'BACKLOG', title: 'Backlog' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
];

// --- Define Task Type Manually --- 
// Based on the select statement in getTasksByProjectId
type AssigneeSummary = Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'profilePicture'> | null;

type TaskWithAssignee = {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number | null;
    dueDate: Date | null;
    order: number | null;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    assigneeId: string | null;
    assignee: AssigneeSummary;
};

// --- Task Card Component (Updated UI) --- 
interface TaskCardProps {
  task: TaskWithAssignee;
  projectId: string; 
  isOverlay?: boolean;
}

function TaskCard({ task, projectId, isOverlay }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // Priority mapping (adapt numeric to descriptive for colors)
  const priorityMap: { [key: number]: { label: string; classes: string } } = {
    1: { label: 'High', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    2: { label: 'High', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' }, // Map 2 to High as well
    3: { label: 'Medium', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    4: { label: 'Low', classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    5: { label: 'Low', classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }, // Map 5 to Low as well
  };

  const priorityInfo = task.priority ? priorityMap[task.priority] : null;

  // Handle the dragging state separately (Placeholder styling)
  if (isDragging) {
    // Render the card content structure but with low opacity to act as a placeholder
    return (
      <div ref={setNodeRef} style={style}>
        <div className="rounded-md border border-dashed border-muted-foreground/30 bg-transparent opacity-40">
          {/* Render the inner content structure to maintain height, but make invisible/low-opacity */} 
          <div className="p-4 space-y-3 invisible">
              <div className="flex items-start justify-between">
                 <p className="font-medium text-sm pr-8 line-clamp-2">{task.title}</p>
              </div>
              <div className="min-h-10">
                  {task.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2">No description</p>
                  )}
              </div>
              <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 shrink-0 min-w-0 mr-2">
                      {/* Simplified placeholders for avatar/assignee */} 
                      <div className="h-6 w-6 rounded-full bg-muted border"></div>
                      <span className="text-muted-foreground truncate">
                          {task.assignee ? (task.assignee.firstName || task.assignee.username) : ' '}
                      </span>
                  </div>
                   <div className="flex items-center gap-2 shrink-0">
                       {/* Simplified placeholders for priority/date */} 
                       {priorityInfo && <div className="h-5 w-10 rounded bg-muted"></div>}
                       {task.dueDate && <div className="h-5 w-12 rounded bg-muted"></div>}
                   </div>
              </div>
          </div>
        </div>
      </div>
    );
  }

  const cardContent = (
    <div 
        ref={setNodeRef} 
        style={style}
        {...attributes}
        className={`rounded-md border bg-card text-card-foreground shadow-xs relative ${isOverlay ? 'shadow-xl' : 'mb-2'}`}
    >
      {/* Explicit Drag Handle (Optional but good practice) */}
       <button
          {...listeners}
          className="absolute top-1 right-1 p-1 text-secondary-foreground/50 hover:text-secondary-foreground focus:outline-hidden focus:ring-1 focus:ring-ring rounded cursor-grab z-10"
          aria-label="Drag task"
          onClick={(e) => e.stopPropagation()}
       >
          <GripVertical className="h-5 w-5" />
       </button>

      {/* New UI Structure Integrated */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <p className="font-medium text-sm pr-8 line-clamp-2">{task.title}</p>
        </div>

        {/* Description Container - always takes up space */}
        <div className="min-h-10"> {/* Approx height of 2 lines text-sm */}
          {task.description ? (
               <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2">No description</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 shrink-0 min-w-0 mr-2">
            {task.assignee ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.profilePicture || undefined} alt={task.assignee.username || 'Assignee'} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.firstName?.charAt(0).toUpperCase()}
                          {task.assignee.lastName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{task.assignee.firstName} {task.assignee.lastName} ({task.assignee.username})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            ) : (
                <div className="h-6 w-6 rounded-full bg-muted border"></div>
            )}
             {task.assignee && (
                 <span className="text-muted-foreground truncate"> 
                     {task.assignee.firstName || task.assignee.username}
                 </span>
             )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
              {priorityInfo && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${priorityInfo.classes}`}
                >
                  {priorityInfo.label}
                </Badge>
              )}
              {task.dueDate && (
                <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {format(new Date(task.dueDate), "MMM d")}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  // If it's the overlay, just render the content without the dialog trigger
  if (isOverlay) {
    return cardContent; // Return the base card content for the overlay
  }

  // For regular cards, wrap the *entire* card content 
  // with the Dialog trigger. Clicks anywhere *except* the handle will open the dialog.
  return (
    <TaskDetailsDialog
      taskId={task.id}
      projectId={projectId}
      trigger={cardContent} 
    />
  );
}

// --- Column Component --- 
interface ColumnProps {
  id: ColumnId; // Keep using string literal type
  title: string;
  tasks: TaskWithAssignee[];
  projectId: string;
  isDraggingActive?: boolean; // Add prop to indicate if any task is being dragged
}

function Column({ id, title, tasks, projectId, isDraggingActive }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
    data: {
      type: 'Column',
      columnId: id, // Store the string ID here
    },
  });

  const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <Card 
        ref={setNodeRef} 
        className="w-full md:w-72 flex flex-col shrink-0 h-full md:h-auto mb-4 md:mb-0" 
    > 
      {/* Column Header */}
      <CardHeader className="p-3 border-b sticky top-0 bg-muted/50 z-10 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title} ({tasks.length})</CardTitle>
        <AddTaskDialog
            projectId={projectId}
            initialStatusId={id} 
            trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <PlusIcon className="h-4 w-4" />
                </Button>
            }
         />
      </CardHeader>

      {/* Column Content (Tasks) - Conditionally add padding-bottom */}
      <CardContent 
        className={`p-3 grow flex flex-col gap-2 overflow-y-auto min-h-[100px] transition-all duration-150 ease-in-out ${isDraggingActive ? 'pb-[150px]' : ''}`}
      >
        <SortableContext items={tasksIds}>
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} projectId={projectId} />)
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              No tasks yet.
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

// --- Main Kanban Board Component --- 
export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [isClient, setIsClient] = useState(false);
  const queryClient = useQueryClient(); 
  const { toast } = useToast(); 

  // Use the static definition directly
  const columns = columnDefinitions;

  const [tasksByStatus, setTasksByStatus] = useState<Record<string, TaskWithAssignee[]>>({});
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);

  // --- Client Mount Effect ---
  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- Fetch Tasks Query --- 
  const { 
    data: tasksData,
    isLoading,
    isError,
    error 
  } = useQuery<TaskWithAssignee[] | null>({ // Type is now defined manually
    queryKey: ['projectTasks', projectId],
    queryFn: () => getTasksByProjectId(projectId),
    // Keep data fresh in the background, adjust staleTime as needed
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Optional: Refetch every 10 mins
    // No placeholderData - allow isLoading state
    // Sort fetched data by order, then createdAt as fallback
    select: (data) => {
      if (!data) return [];
      return data.sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          if (orderA !== orderB) {
              return orderA - orderB;
          } 
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
    // Only enable the query once the component has mounted on the client
    enabled: isClient, 
  });

  // --- Effect to organize fetched tasks into state (using string keys) --- 
  useEffect(() => {
    // No need to log here anymore
    const newTasksByStatus: Record<string, TaskWithAssignee[]> = {};
    columns.forEach(col => newTasksByStatus[col.id] = []);

    if (tasksData) {
        tasksData.forEach(task => {
            const statusKey = task.status as string; 
            if (newTasksByStatus.hasOwnProperty(statusKey)) { 
                newTasksByStatus[statusKey]?.push(task);
            } else {
                 // This path should now be less common unless status is truly invalid
                 // console.warn(`[KanbanBoard Effect] Task ${task.id} has unknown/unhandled status '${task.status}', putting in BACKLOG.`);
                 newTasksByStatus['BACKLOG']?.push(task); 
            }
        });
    }
    setTasksByStatus(newTasksByStatus);

  }, [tasksData, columns]); // Dependency on columns is static, but keep for completeness

  // --- Update Task Status Mutation --- 
  const updateTaskStatusMutation = useMutation({
    mutationFn: updateTaskStatus, 
    onSuccess: (data) => {
        if (data.success) {
            // toast({ title: "Success", description: data.message });
        } else {
            toast({ variant: "destructive", title: "Error", description: data.message });
             queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }); 
        }
    },
    onError: (error) => {
         // console.error("Mutation Error:", error);
         toast({ variant: "destructive", title: "Error", description: "Failed to update task status." });
         queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }); 
    },
  });

  // --- Update Task Order Mutation ---
  const updateTaskOrderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: (data) => {
      if (data.success) {
        // toast({ title: "Success", description: "Task order saved." });
        queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] });
      } else {
        toast({ variant: "destructive", title: "Order Error", description: data.message });
        queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] });
      }
    },
    onError: (error) => {
      // console.error("Update Order Mutation Error:", error);
      toast({ variant: "destructive", title: "Order Error", description: "Failed to save task order." });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] });
    },
  });

  // --- Dnd Sensors --- 
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Drag Handlers (using string keys/IDs) --- 
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
         setActiveTask(active.data.current.task as TaskWithAssignee);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    // Removed logs from here
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeIsTask = active.data.current?.type === 'Task';
    if (!activeIsTask) return;

    const originalTaskData = active.data.current?.task as TaskWithAssignee | undefined;
    if (!originalTaskData || !originalTaskData.status) return;
    
    const originalStatusEnum = originalTaskData.status;
    const originalStatusKey = originalStatusEnum as string;

    const overData = over.data.current;
    const overIsColumn = overData?.type === 'Column';
    const overIsTask = overData?.type === 'Task';

    // Scenario 1: Dropping onto a different Column 
    if (overIsColumn) {
        const targetStatusKey = overData?.columnId as ColumnId | undefined;
        if (!targetStatusKey || targetStatusKey === originalStatusKey) return;

        const targetStatusEnum = TaskStatus[targetStatusKey]; 
        if (!targetStatusEnum) return;

        const taskToMove = tasksByStatus[originalStatusKey]?.find(t => t.id === activeId);
        if (!taskToMove) return;

        const statusMutationPayload = { taskId: activeId, newStatus: targetStatusEnum, projectId };
        const optimisticTaskWithNewStatus = { ...taskToMove, status: targetStatusEnum };
        const currentTargetTasks = tasksByStatus[targetStatusKey] || []; 
        const optimisticTargetColumn = [ optimisticTaskWithNewStatus, ...currentTargetTasks ];
        const orderMutationPayload = {
            projectId,
            orderedTasks: optimisticTargetColumn.map((task, index) => ({ taskId: task.id, order: index }))
        };

        setTasksByStatus(prev => {
            const updatedTasks = { ...prev };
            updatedTasks[originalStatusKey] = (prev[originalStatusKey] || []).filter(t => t.id !== activeId);
            updatedTasks[targetStatusKey] = optimisticTargetColumn;
            return updatedTasks;
        });

        updateTaskStatusMutation.mutate(statusMutationPayload);
        updateTaskOrderMutation.mutate(orderMutationPayload);
        return;
    }

    // Scenario 2: Reordering in same column 
    if (overIsTask) {
        const targetTaskData = overData?.task as TaskWithAssignee | undefined;
        const targetTaskStatusKey = targetTaskData?.status as string | undefined;
        if (!targetTaskStatusKey || targetTaskStatusKey !== originalStatusKey) return;

        const activeIndex = tasksByStatus[originalStatusKey]?.findIndex(t => t.id === activeId);
        const overIndex = tasksByStatus[originalStatusKey]?.findIndex(t => t.id === overId);
        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

        let finalTasksInColumn: TaskWithAssignee[] = [];
        setTasksByStatus(prev => {
            const updatedTasks = { ...prev };
            const columnTasks = updatedTasks[originalStatusKey];
            if (!columnTasks) return prev;
            const newOrderedColumn = arrayMove(columnTasks, activeIndex, overIndex);
            updatedTasks[originalStatusKey] = newOrderedColumn;
            finalTasksInColumn = newOrderedColumn;
            return updatedTasks;
        });

        const orderedTasksPayload = finalTasksInColumn.map((task, index) => ({
            taskId: task.id,
            order: index, 
        }));
        updateTaskOrderMutation.mutate({ projectId, orderedTasks: orderedTasksPayload });
        return;
    }
  }

  // --- Render Logic --- 
  // Only render query-dependent content after mounting on the client
  // if (!isClient) {
  //    // Render skeleton directly during SSR/initial client render
  //    return (
  //     <div className="flex gap-4 p-4">
  //       {columns.map((col) => ( // Use static columns definition here
  //         <Skeleton key={col.id} className="w-72 h-96" />
  //       ))}
  //     </div>
  //   );
  // }

  // Now render based on query state
  if (isLoading) {
    return (
      <div className="flex gap-4 p-4">
        {columns.map((col) => (
          <Skeleton key={col.id} className="w-72 h-96" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive p-4">
        Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  // --- Render Kanban Board --- 
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col  md:flex-row gap-4 p-2 md:p-4 overflow-x-hidden md:overflow-x-auto w-full">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasksByStatus[col.id] || []}
            projectId={projectId}
            isDraggingActive={!!activeTask} // Pass dragging state down
          />
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} projectId={projectId} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 