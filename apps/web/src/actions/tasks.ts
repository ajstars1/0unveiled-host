'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  tasks, 
  projects,
  users,
  type Task,
  projectMembers
} from '@0unveiled/database'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new task.
 * @param formData - Form data containing task fields
 * @returns Object indicating success or error
 */
export const createTask = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const priority = parseInt(formData.get('priority') as string) || null
    const dueDate = formData.get('dueDate') as string
    const projectId = formData.get('projectId') as string
    const assigneeId = formData.get('assigneeId') as string

    if (!title || !projectId) {
      return { error: 'Title and project are required' }
    }

    // Verify project exists and user has access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    // Check if user is project owner or member
    const isOwner = project.ownerId === currentUser.id
    const isMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (!isOwner && !isMember) {
      return { error: 'Not authorized to create tasks for this project' }
    }

    // Get the next order number for the status
    const existingTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.projectId, projectId),
        eq(tasks.status, status as any)
      ),
      orderBy: desc(tasks.order),
      limit: 1,
    })

    const nextOrder = existingTasks.length > 0 ? (existingTasks[0].order || 0) + 1 : 1

    // Create the task
    const [newTask] = await db.insert(tasks).values({
      title,
      description: description || null,
      status: status as any,
      priority: priority || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId: assigneeId || null,
      order: nextOrder,
    }).returning()

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, task: newTask }
  } catch (error) {
    console.error('Error creating task:', error)
    return { error: 'Failed to create task' }
  }
}

/**
 * Updates an existing task.
 * @param taskId - The ID of the task to update
 * @param formData - Form data containing task fields
 * @returns Object indicating success or error
 */
export const updateTask = async (taskId: string, formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Get the task and verify access
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    })

    if (!existingTask) {
      return { error: 'Task not found' }
    }

    // Verify project access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, existingTask.projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, existingTask.projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (!isOwner && !isMember) {
      return { error: 'Not authorized to update tasks for this project' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const priority = parseInt(formData.get('priority') as string) || null
    const dueDate = formData.get('dueDate') as string
    const assigneeId = formData.get('assigneeId') as string

    if (!title) {
      return { error: 'Title is required' }
    }

    // Update the task
    const [updatedTask] = await db.update(tasks)
      .set({
        title,
        description: description || null,
        status: status as any,
        priority: priority || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning()

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`)
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task:', error)
    return { error: 'Failed to update task' }
  }
}

/**
 * Updates a task's status.
 * @param taskId - The ID of the task to update
 * @param newStatus - The new status for the task
 * @param projectId - The ID of the project
 * @returns Object indicating success or error
 */
export const updateTaskStatus = async (taskId: string, newStatus: string, projectId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Verify project access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (!isOwner && !isMember) {
      return { error: 'Not authorized to update tasks for this project' }
    }

    // Get the next order number for the new status
    const existingTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.projectId, projectId),
        eq(tasks.status, newStatus as any)
      ),
      orderBy: desc(tasks.order),
      limit: 1,
    })

    const nextOrder = existingTasks.length > 0 ? (existingTasks[0].order || 0) + 1 : 1

    // Update the task status and order
    const [updatedTask] = await db.update(tasks)
      .set({
        status: newStatus as any,
        order: nextOrder,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning()

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { error: 'Failed to update task status' }
  }
}

/**
 * Deletes a task.
 * @param taskId - The ID of the task to delete
 * @returns Object indicating success or error
 */
export const deleteTask = async (taskId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Get the task and verify access
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    })

    if (!existingTask) {
      return { error: 'Task not found' }
    }

    // Verify project access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, existingTask.projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, existingTask.projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (!isOwner && !isMember) {
      return { error: 'Not authorized to delete tasks for this project' }
    }

    // Delete the task
    await db.delete(tasks)
      .where(eq(tasks.id, taskId))

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { error: 'Failed to delete task' }
  }
}

/**
 * Gets all tasks for a project.
 * @param projectId - The ID of the project
 * @returns Array of tasks or error
 */
export const getProjectTasks = async (projectId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Verify project access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (!isOwner && !isMember) {
      return { error: 'Not authorized to view tasks for this project' }
    }

    const projectTasks = await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId),
      with: {
        assignee: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [
        asc(tasks.status),
        asc(tasks.order),
        desc(tasks.createdAt),
      ],
    })

    return { success: true, tasks: projectTasks }
  } catch (error) {
    console.error('Error getting project tasks:', error)
    return { error: 'Failed to get project tasks' }
  }
}

/**
 * Gets all tasks assigned to the current user.
 * @returns Array of tasks or error
 */
export const getUserTasks = async () => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.assigneeId, currentUser.id),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
            visibility: true,
          },
        },
      },
      orderBy: [
        asc(tasks.status),
        asc(tasks.order),
        desc(tasks.createdAt),
      ],
    })

    return { success: true, tasks: userTasks }
  } catch (error) {
    console.error('Error getting user tasks:', error)
    return { error: 'Failed to get user tasks' }
  }
} 