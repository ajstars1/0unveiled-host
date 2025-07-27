import { z } from 'zod'

// Define task status enum values
const TaskStatusValues = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELED"] as const;

// Schema for updating task status (used only for drag-and-drop)
export const UpdateTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  newStatus: z.enum(TaskStatusValues),
  projectId: z.string().cuid(),
});

// Schema for creating a new task (simplified)
export const CreateTaskSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100),
  description: z.string().max(500).optional(), // Optional string
  status: z.enum(TaskStatusValues),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().or(z.literal("null_value")).or(z.literal("")).optional(), // Allow specific strings or cuid or undefined
  priority: z.preprocess(
    // Preprocess input: Allow empty string (treat as undefined), parse numeric strings
    (val) => (val === '' || val === null ? undefined : typeof val === 'string' ? parseInt(val, 10) : val),
    // Validate the preprocessed value
    z.union([z.number().int().min(1).max(5), z.undefined()]) // Reverted: Explicitly allow number (1-5) or undefined
  ).optional(), // Reverted: Make the whole preprocess optional
  dueDate: z.date().optional(), // Optional date
});

// Schema for updating a task's details (simplified)
export const UpdateTaskSchema = z.object({
  taskId: z.string().cuid(),
  projectId: z.string().cuid(), // Required for permission check
  title: z.string().min(1, { message: "Title is required." }).max(100).optional(),
  description: z.string().max(500).optional(), // Optional string
  status: z.enum(TaskStatusValues).optional(),
  assigneeId: z.string().cuid().or(z.literal("null_value")).or(z.literal("")).optional(), // Allow specific strings or cuid or undefined
  priority: z.preprocess(
    (val) => (val === '' || val === null ? undefined : typeof val === 'string' ? parseInt(val, 10) : val),
    z.union([z.number().int().min(1).max(5), z.undefined()]) // Reverted
  ).optional(), // Reverted
  dueDate: z.date().optional(), // Optional date
});

// Schema for updating task order within a column
export const UpdateTaskOrderSchema = z.object({
    projectId: z.string().cuid(),
    // Expect an array of tasks, each with its ID and new order (index)
    orderedTasks: z.array(z.object({
        taskId: z.string().cuid(),
        order: z.number().int().min(0), // Order is the 0-based index
    })),
});

// Schema for deleting a task
export const DeleteTaskSchema = z.object({
    taskId: z.string().cuid(),
    projectId: z.string().cuid(), // Required for permission check
}); 