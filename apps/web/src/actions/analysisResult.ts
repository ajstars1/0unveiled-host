'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  projects, 
  projectSkills, 
  skills,
  showcasedItems,
} from '@0unveiled/database'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Save GitHub repository analysis result as a project in the database.
 * This will create a new project with AI-generated summary and tech stack.
 * 
 * @param username GitHub username
 * @param repoName GitHub repository name
 * @param aiSummary AI-generated summary of the project
 * @param techStack Array of technology stack items used in the project
 * @param analysisData The complete analysis data for reference
 * @returns Object indicating success or error
 */
export const saveGitHubAnalysisAsProject = async (
  username: string,
  repoName: string,
  aiSummary: string,
  techStack: string[],
  analysisData?: any
) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Normalize the repository name
    const normalizedRepoName = repoName.replace('/', '-')
    
    // Create title from repo name (capitalized with spaces)
    const title = normalizedRepoName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Generate project description from AI summary
    const description = aiSummary || `GitHub repository analysis for ${username}/${repoName}`
    
    // Use the AI summary as the public summary as well
    const publicSummary = aiSummary || `GitHub repository analysis for ${username}/${repoName}`

    // Create the project
    const [newProject] = await db.insert(projects).values({
      title,
      description,
      publicSummary,
      visibility: 'PUBLIC',
      status: 'COMPLETED',
      ownerId: currentUser.id,
      // Store the full analysis data as JSON
      jsonDescription: analysisData ? JSON.stringify(analysisData) : null,
    }).returning()

    // Add tech stack items as skills to the project
    if (techStack && techStack.length > 0) {
      for (const techItem of techStack) {
        if (!techItem) continue
        
        // Find or create the skill
        let skill = await db.query.skills.findFirst({
          where: eq(skills.name, techItem)
        })

        if (!skill) {
          const [newSkill] = await db.insert(skills).values({
            name: techItem
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

    // Try to attach the AI analysis to the matching showcased item (GitHub repo)
    try {
      const githubUrl = `https://github.com/${username}/${repoName}`
      const extId = (analysisData as any)?.repository?.id?.toString?.() || (analysisData as any)?.repository_info?.id?.toString?.()

      // Find existing showcased item by url first
      let item = await db.query.showcasedItems.findFirst({
        where: and(
          eq(showcasedItems.userId, currentUser.id),
          eq(showcasedItems.provider, 'GITHUB' as any),
          eq(showcasedItems.url, githubUrl)
        ),
      })

      // Fallback: find by externalId if available
      if (!item && extId) {
        item = await db.query.showcasedItems.findFirst({
          where: and(
            eq(showcasedItems.userId, currentUser.id),
            eq(showcasedItems.provider, 'GITHUB' as any),
            eq(showcasedItems.externalId, extId)
          ),
        })
      }

      if (item) {
        // Merge AI analysis into metadata in a shape PortfolioCard can consume
        const existingMeta = (item.metadata as any) || {}
    const mergedMeta = {
          ...existingMeta,
          // Provide multiple keys for robust extraction
          aiAnalysis: {
            ai_summary: aiSummary,
      // Flat array for direct extraction
      tech_stack: Array.isArray(techStack) ? techStack : [],
            technology_stack: {
              // Best-effort categorization unknown here; keep a flat list for now
              // PortfolioCard also accepts string arrays within tech_stack
              stack: Array.isArray(techStack) ? techStack : [],
            },
          },
          // Also store full analysis JSON for future use
          jsonDescription: analysisData ? JSON.stringify(analysisData) : existingMeta.jsonDescription ?? null,
        }

        await db.update(showcasedItems)
          .set({
            metadata: mergedMeta as any,
            lastSyncedAt: new Date(),
            internalProjectId: item.internalProjectId ?? newProject.id,
          })
          .where(eq(showcasedItems.id, item.id))
      }
    } catch (e) {
      console.warn('Non-fatal: failed to attach AI analysis to showcased item:', e)
    }

    // Revalidate profile page and projects listing
    if (currentUser.username) {
      revalidatePath(`/${currentUser.username}`)
    }
    revalidatePath('/projects')
    return { success: true, project: newProject }
  } catch (error) {
    console.error('Error saving GitHub analysis as project:', error)
    return { error: 'Failed to save analysis as project' }
  }
}
