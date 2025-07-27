'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  projects, 
  projectMembers, 
  projectSkills, 
  skills,
  type Project,
  type ProjectMember
} from '@0unveiled/database'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new project.
 * @param formData - Form data containing project fields
 * @returns Object indicating success or error
 */
export const createProject = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const publicSummary = formData.get('publicSummary') as string
    const htmlDescription = formData.get('htmlDescription') as string
    const jsonDescription = formData.get('jsonDescription') as string
    const visibility = formData.get('visibility') as string
    const status = formData.get('status') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const requiredSkillsInput = formData.get('requiredSkills') as string

    if (!title || !description || !publicSummary) {
      return { error: 'Title, description, and public summary are required' }
    }

    // Parse required skills from JSON string
    const requiredSkillNames = JSON.parse(requiredSkillsInput || '[]') as string[]

    // Create the project
    const [newProject] = await db.insert(projects).values({
      title,
      description,
      publicSummary,
      htmlDescription,
      jsonDescription,
      visibility: visibility as any,
      status: status as any,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: currentUser.id,
    }).returning()

    // Add required skills to the project
    if (requiredSkillNames.length > 0) {
      for (const skillName of requiredSkillNames) {
        // Find or create the skill
        let skill = await db.query.skills.findFirst({
          where: eq(skills.name, skillName)
        })

        if (!skill) {
          const [newSkill] = await db.insert(skills).values({
            name: skillName
          }).returning()
          skill = newSkill
        }

        // Connect skill to project
        await db.insert(projectSkills).values({
          projectId: newProject.id,
          skillId: skill.id,
        })
      }
    }

    // Add owner as project member with LEADER role
    await db.insert(projectMembers).values({
      userId: currentUser.id,
      projectId: newProject.id,
      role: 'LEADER',
    })

    revalidatePath('/dashboard/projects')
    return { success: true, project: newProject }
  } catch (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project' }
  }
}

/**
 * Updates an existing project.
 * @param projectId - The ID of the project to update
 * @param formData - Form data containing project fields
 * @returns Object indicating success or error
 */
export const updateProject = async (projectId: string, formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Verify ownership
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.ownerId, currentUser.id)
      )
    })

    if (!existingProject) {
      return { error: 'Project not found or not authorized' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const publicSummary = formData.get('publicSummary') as string
    const htmlDescription = formData.get('htmlDescription') as string
    const jsonDescription = formData.get('jsonDescription') as string
    const visibility = formData.get('visibility') as string
    const status = formData.get('status') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const requiredSkillsInput = formData.get('requiredSkills') as string

    if (!title || !description || !publicSummary) {
      return { error: 'Title, description, and public summary are required' }
    }

    // Parse required skills from JSON string
    const requiredSkillNames = JSON.parse(requiredSkillsInput || '[]') as string[]

    // Update the project
    const [updatedProject] = await db.update(projects)
      .set({
        title,
        description,
        publicSummary,
        htmlDescription,
        jsonDescription,
        visibility: visibility as any,
        status: status as any,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning()

    // Remove existing project skills
    await db.delete(projectSkills)
      .where(eq(projectSkills.projectId, projectId))

    // Add new required skills to the project
    if (requiredSkillNames.length > 0) {
      for (const skillName of requiredSkillNames) {
        // Find or create the skill
        let skill = await db.query.skills.findFirst({
          where: eq(skills.name, skillName)
        })

        if (!skill) {
          const [newSkill] = await db.insert(skills).values({
            name: skillName
          }).returning()
          skill = newSkill
        }

        // Connect skill to project
        await db.insert(projectSkills).values({
          projectId: projectId,
          skillId: skill.id,
        })
      }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, project: updatedProject }
  } catch (error) {
    console.error('Error updating project:', error)
    return { error: 'Failed to update project' }
  }
}

/**
 * Deletes a project.
 * @param projectId - The ID of the project to delete
 * @returns Object indicating success or error
 */
export const deleteProject = async (projectId: string) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Verify ownership
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.ownerId, currentUser.id)
      )
    })

    if (!existingProject) {
      return { error: 'Project not found or not authorized' }
    }

    // Delete the project (cascade will handle related records)
    await db.delete(projects)
      .where(eq(projects.id, projectId))

    revalidatePath('/dashboard/projects')
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { error: 'Failed to delete project' }
  }
}

/**
 * Adds a member to a project.
 * @param projectId - The ID of the project
 * @param userId - The ID of the user to add
 * @param role - The role for the new member
 * @returns Object indicating success or error
 */
export const addProjectMember = async (projectId: string, userId: string, role: string = 'MEMBER') => {
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
      return { error: 'Not authorized to add members to this project' }
    }

    // Check if user is already a member
    const existingMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    })

    if (existingMember) {
      return { error: 'User is already a member of this project' }
    }

    // Add the member
    const [newMember] = await db.insert(projectMembers).values({
      userId,
      projectId,
      role: role as any,
    }).returning()

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, member: newMember }
  } catch (error) {
    console.error('Error adding project member:', error)
    return { error: 'Failed to add project member' }
  }
}

/**
 * Updates a project member's role.
 * @param projectId - The ID of the project
 * @param userId - The ID of the user to update
 * @param newRole - The new role for the member
 * @returns Object indicating success or error
 */
export const updateProjectMemberRole = async (projectId: string, userId: string, newRole: string) => {
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
      return { error: 'Not authorized to update member roles in this project' }
    }

    // Update the member's role
    const [updatedMember] = await db.update(projectMembers)
      .set({ role: newRole as any })
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))
      .returning()

    if (!updatedMember) {
      return { error: 'Project member not found' }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, member: updatedMember }
  } catch (error) {
    console.error('Error updating project member role:', error)
    return { error: 'Failed to update project member role' }
  }
}

/**
 * Removes a member from a project.
 * @param projectId - The ID of the project
 * @param userId - The ID of the user to remove
 * @returns Object indicating success or error
 */
export const removeProjectMember = async (projectId: string, userId: string) => {
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
      return { error: 'Not authorized to remove members from this project' }
    }

    // Prevent removing the project owner
    if (project.ownerId === userId) {
      return { error: 'Cannot remove the project owner' }
    }

    // Remove the member
    await db.delete(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error removing project member:', error)
    return { error: 'Failed to remove project member' }
  }
}
