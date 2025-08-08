'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  projects, 
  projectApplications, 
  projectMembers,
  users,
  type Project,
  type ProjectApplication
} from '@0unveiled/database'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Applies to a project.
 * @param projectId - The ID of the project to apply to
 * @param message - Optional message for the application
 * @returns Object indicating success or error
 */
export const applyToProject = async (projectId: string, message?: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Check if project exists and is accepting applications
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    if (project.visibility !== 'PUBLIC') {
      return { error: 'This project is not accepting applications' }
    }

    // Check if user is already a member
    const existingMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, currentUser.id)
      )
    })

    if (existingMember) {
      return { error: 'You are already a member of this project' }
    }

    // Check if user has already applied
    const existingApplication = await db.query.projectApplications.findFirst({
      where: and(
        eq(projectApplications.projectId, projectId),
        eq(projectApplications.userId, currentUser.id),
        eq(projectApplications.status, 'PENDING')
      )
    })

    if (existingApplication) {
      return { error: 'You have already applied to this project' }
    }

    // Create the application
    const [newApplication] = await db.insert(projectApplications).values({
      userId: currentUser.id,
      projectId,
      message: message || null,
      status: 'PENDING',
    }).returning()

    revalidatePath(`/projects/${projectId}`)
    return { success: true, application: newApplication }
  } catch (error) {
    console.error('Error applying to project:', error)
    return { error: 'Failed to apply to project' }
  }
}

/**
 * Accepts a project application.
 * @param applicationId - The ID of the application to accept
 * @returns Object indicating success or error
 */
export const acceptProjectApplication = async (applicationId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Get the application
    const application = await db.query.projectApplications.findFirst({
      where: eq(projectApplications.id, applicationId)
    })

    if (!application) {
      return { error: 'Application not found' }
    }

    // Verify project ownership or leadership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, application.projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isLeader = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, application.projectId),
        eq(projectMembers.userId, currentUser.id),
        eq(projectMembers.role, 'LEADER')
      )
    })

    if (!isOwner && !isLeader) {
      return { error: 'Not authorized to accept applications for this project' }
    }

    // Update application status
    const [updatedApplication] = await db.update(projectApplications)
      .set({ 
        status: 'ACCEPTED',
        reviewedAt: new Date()
      })
      .where(eq(projectApplications.id, applicationId))
      .returning()

    // Add user as project member
    await db.insert(projectMembers).values({
      userId: application.userId,
      projectId: application.projectId,
      role: 'MEMBER',
    })

    revalidatePath(`/projects/${application.projectId}`)
    return { success: true, application: updatedApplication }
  } catch (error) {
    console.error('Error accepting project application:', error)
    return { error: 'Failed to accept application' }
  }
}

/**
 * Rejects a project application.
 * @param applicationId - The ID of the application to reject
 * @returns Object indicating success or error
 */
export const rejectProjectApplication = async (applicationId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Get the application
    const application = await db.query.projectApplications.findFirst({
      where: eq(projectApplications.id, applicationId)
    })

    if (!application) {
      return { error: 'Application not found' }
    }

    // Verify project ownership or leadership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, application.projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isLeader = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, application.projectId),
        eq(projectMembers.userId, currentUser.id),
        eq(projectMembers.role, 'LEADER')
      )
    })

    if (!isOwner && !isLeader) {
      return { error: 'Not authorized to reject applications for this project' }
    }

    // Update application status
    const [updatedApplication] = await db.update(projectApplications)
      .set({ 
        status: 'REJECTED',
        reviewedAt: new Date()
      })
      .where(eq(projectApplications.id, applicationId))
      .returning()

    revalidatePath(`/projects/${application.projectId}`)
    return { success: true, application: updatedApplication }
  } catch (error) {
    console.error('Error rejecting project application:', error)
    return { error: 'Failed to reject application' }
  }
}

/**
 * Withdraws a project application.
 * @param applicationId - The ID of the application to withdraw
 * @returns Object indicating success or error
 */
export const withdrawProjectApplication = async (applicationId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Get the application and verify ownership
    const application = await db.query.projectApplications.findFirst({
      where: and(
        eq(projectApplications.id, applicationId),
        eq(projectApplications.userId, currentUser.id)
      )
    })

    if (!application) {
      return { error: 'Application not found or not authorized' }
    }

    if (application.status !== 'PENDING') {
      return { error: 'Can only withdraw pending applications' }
    }

    // Delete the application
    await db.delete(projectApplications)
      .where(eq(projectApplications.id, applicationId))

    revalidatePath(`/projects/${application.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error withdrawing project application:', error)
    return { error: 'Failed to withdraw application' }
  }
}

/**
 * Gets all applications for a project.
 * @param projectId - The ID of the project
 * @returns Array of applications or error
 */
export const getProjectApplications = async (projectId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Verify project ownership or leadership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const isOwner = project.ownerId === currentUser.id
    const isLeader = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, currentUser.id),
        eq(projectMembers.role, 'LEADER')
      )
    })

    if (!isOwner && !isLeader) {
      return { error: 'Not authorized to view applications for this project' }
    }

    const applications = await db.query.projectApplications.findMany({
      where: eq(projectApplications.projectId, projectId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            headline: true,
          },
        },
      },
      orderBy: desc(projectApplications.submittedAt),
    })

    return { success: true, applications }
  } catch (error) {
    console.error('Error getting project applications:', error)
    return { error: 'Failed to get project applications' }
  }
}

/**
 * Gets all applications submitted by the current user.
 * @returns Array of applications or error
 */
export const getUserApplications = async () => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const applications = await db.query.projectApplications.findMany({
      where: eq(projectApplications.userId, currentUser.id),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
            visibility: true,
            ownerId: true,
          },
        },
      },
      orderBy: desc(projectApplications.submittedAt),
    })

    return { success: true, applications }
  } catch (error) {
    console.error('Error getting user applications:', error)
    return { error: 'Failed to get user applications' }
  }
} 