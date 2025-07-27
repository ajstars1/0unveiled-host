'use server'

import { db } from "@/lib/drizzle";
import { tasks, projectMembers, users, projects } from "@0unveiled/database";
import { eq, inArray, isNull, isNotNull, asc, desc } from "drizzle-orm";
import { getCurrentUser } from './user'; // For permission checks

/**
 * Fetches all tasks for a given project ID, including assignee details.
 * Performs permission check: user must be a member of the project.
 * @param projectId The ID of the project.
 * @returns An array of tasks with assignee info, or null if not authorized or error.
 */
export const getTasksByProjectId = async (projectId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("getTasksByProjectId: User not authenticated.");
            return null;
        }

        // Check if the current user is a member of the project
        const projectMember = await db.query.projectMembers.findFirst({
            where: eq(projectMembers.userId, currentUser.id) && eq(projectMembers.projectId, projectId)
        });

        if (!projectMember) {
            console.error(`getTasksByProjectId: User ${currentUser.id} is not a member of project ${projectId}.`);
            return null; // Or throw an error
        }

        // Fetch tasks with assignee details
        const projectTasks = await db.query.tasks.findMany({
            where: eq(tasks.projectId, projectId),
            columns: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                projectId: true,
                assigneeId: true,
                order: true
            },
            with: {
                assignee: {
                    columns: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true
                    }
                }
            }
        });
        return projectTasks;

    } catch (error) {
        console.error("Error fetching tasks by project ID:", error);
        return null;
    }
};

/**
 * Fetches a single task by its ID, including assignee details.
 * Performs permission check: user must be a member of the task's project.
 * @param taskId The ID of the task.
 * @returns The task with assignee info, or null if not found, not authorized, or error.
 */
export const getTaskById = async (taskId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("getTaskById: User not authenticated.");
            return null;
        }

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            columns: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                projectId: true,
                assigneeId: true,
                order: true
            },
            with: {
                assignee: {
                    columns: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true
                    }
                }
            }
        });

        if (!task) {
            return null; // Task not found
        }

        // Check if the current user is a member of the project using the task's projectId
        const projectMember = await db.query.projectMembers.findFirst({
            where: eq(projectMembers.userId, currentUser.id) && eq(projectMembers.projectId, task.projectId)
        });

        if (!projectMember) {
            console.error(`getTaskById: User ${currentUser.id} is not authorized to view task ${taskId} in project ${task.projectId}.`);
            return null; // Unauthorized
        }

        return task; // Return the fetched task directly

    } catch (error) {
        console.error(`Error fetching task by ID (${taskId}):`, error);
        return null;
    }
};

/**
 * Fetches all tasks assigned to the current user across all projects.
 * Includes project title for context.
 * @returns An array of tasks with project title, or null if error or not authenticated.
 */
export const getTasksForUser = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("getTasksForUser: User not authenticated.");
            return null;
        }

        const userTasks = await db.query.tasks.findMany({
            where: eq(tasks.assigneeId, currentUser.id),
            columns: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                projectId: true
            },
            with: {
                project: {
                    columns: {
                        title: true
                    }
                }
            },
            orderBy: [
                asc(tasks.dueDate),
                asc(tasks.priority),
                desc(tasks.createdAt)
            ]
        });

        // Map the result to add projectLink and match expected structure
        return userTasks.map(task => ({
            ...task,
            projectTitle: task.project.title,
            projectLink: `/dashboard/projects/${task.projectId}/workspace/kanban` // Construct link
        }));

    } catch (error) {
        console.error("Error fetching tasks for user:", error);
        return null;
    }
};

/**
 * Fetches tasks assigned to the current user that have a due date.
 * Optimized for calendar display.
 * @returns An array of tasks with due dates, or null if error or not authenticated.
 */
export const getCalendarTasksForUser = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("getCalendarTasksForUser: User not authenticated.");
            return null;
        }

        const calendarTasks = await db.query.tasks.findMany({
            where: eq(tasks.assigneeId, currentUser.id) && isNotNull(tasks.dueDate),
            columns: {
                id: true,
                title: true,
                dueDate: true,
                status: true,
                projectId: true
            },
            with: {
                project: {
                    columns: {
                        title: true
                    }
                }
            },
            orderBy: [asc(tasks.dueDate)]
        });

        // Map to ensure correct type and add link if needed later
        return calendarTasks.map(task => ({
            ...task,
            dueDate: task.dueDate as Date, // Cast dueDate explicitly to Date
            projectTitle: task.project.title,
            projectLink: `/dashboard/projects/${task.projectId}/workspace/kanban` // Construct link
        }));

    } catch (error) {
        console.error("Error fetching calendar tasks for user:", error);
        return null;
    }
};

/**
 * Fetches all tasks from all projects the current user is a member of.
 * Includes basic project and assignee info.
 * @returns An array of tasks, or null if error or not authenticated.
 */
export const getAllProjectTasksForUser = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("getAllProjectTasksForUser: User not authenticated.");
            return null;
        }

        // Find all project IDs the user is a member of
        const projectMemberships = await db.query.projectMembers.findMany({
            where: eq(projectMembers.userId, currentUser.id),
            columns: {
                projectId: true
            }
        });
        const projectIds = projectMemberships.map(pm => pm.projectId);

        if (projectIds.length === 0) {
            return []; // User is not part of any projects
        }

        // Fetch all tasks from those projects
        const allTasks = await db.query.tasks.findMany({
            where: inArray(tasks.projectId, projectIds),
            columns: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                projectId: true,
                assigneeId: true,
                order: true
            },
            with: {
                project: {
                    columns: {
                        title: true
                    }
                },
                assignee: {
                    columns: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: [
                asc(tasks.dueDate),
                desc(tasks.createdAt)
            ]
        });

        return allTasks;

    } catch (error) {
        console.error("Error fetching all project tasks for user:", error);
        return null;
    }
};

// Function to get ALL tasks for a specific project for the calendar view
export const getProjectTasksForCalendar = async (projectId: string) => {
  try {
    if (!projectId) {
      console.error("getProjectTasksForCalendar: Project ID is required.");
      return null;
    }

    // Fetch tasks for the specific project
    const projectTasks = await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId) && isNotNull(tasks.dueDate),
      columns: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        projectId: true,
        assigneeId: true,
        order: true
      },
      with: {
        project: {
          columns: {
            title: true
          }
        },
        assignee: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      },
      orderBy: [asc(tasks.dueDate)]
    });

    // Directly return the fetched tasks, assuming the structure matches CalendarEvent
    // The Calendar component will handle transformations if needed
    return projectTasks;

  } catch (error) {
    console.error("Error fetching project tasks for calendar:", error);
    return null;
  }
}; 