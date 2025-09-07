'use server'

import { db } from '@/lib/drizzle'
import { getCurrentUser } from '@/data/user'
import { 
  projects, 
  projectSkills, 
  skills,
  aiVerifiedSkills,
} from '@0unveiled/database'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

interface ProfileAnalysisResult {
  profileSummary: {
    name: string;
    username: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    college: string | null;
  };
  repositoryAnalysis: {
    stats: {
      totalRepos: number;
      totalStars: number;
      totalForks: number;
      averageRepoSize: number;
      totalLinesOfCode?: number;
      averageComplexity?: number;
      averageQuality?: number;
      languages: Array<{
        language: string;
        repositoryCount: number;
        totalStars: number;
        totalLines?: number;
        percentage: number;
      }>;
    };
    topRepositories: Array<{
      name: string;
      description: string | null;
      language: string | null;
      stars: number;
      forks: number;
      url: string;
    }>;
    languageExpertise: Array<{
      language: string;
      repositoryCount: number;
      totalStars: number;
      totalLines?: number;
      percentage: number;
    }>;
    detailedAnalyses?: Array<{
      repository: {
        name: string;
        full_name: string;
        description: string | null;
        language: string | null;
        stars: number;
        forks: number;
        url: string;
      };
      analysis: any;
    }>;
  };
  techStackAnalysis?: {
    comprehensive: Record<string, Array<{name: string; confidence: number}>>;
    totalSkillsFound: number;
    highConfidenceSkills: number;
    primaryTechStack: Array<{
      category: string;
      topSkills: Array<{name: string; confidence: number}>;
    }>;
  };
  careerAnalysis: {
    stats: {
      totalYearsExperience: number;
      totalEducationYears: number;
      skillsCount: number;
      currentRole: any;
      currentEducation: any;
    };
    experience: Array<any>;
    education: Array<any>;
    skills: Array<{
      id: string;
      name: string;
    }>;
  };
  aiInsights: {
    strengths: string[];
    careerProgression: string;
    skillGaps: string[];
    recommendations: string[];
  };
  overallScore: number;
  generatedAt: string;
}

/**
 * Save profile analysis result to the database.
 * This creates a special project that represents the profile analysis and saves
 * all verified skills to the user's account.
 * 
 * @param username GitHub username
 * @param analysisData The complete profile analysis data
 * @returns Object indicating success or error
 */
export const saveProfileAnalysisAsProject = async (
  username: string,
  analysisData: ProfileAnalysisResult
) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Create a title for the project
    const title = `${username}'s Profile Analysis`
    
    // Generate project description from AI insights
    const strengths = analysisData.aiInsights?.strengths || []
    const recommendations = analysisData.aiInsights?.recommendations || []
    
    const description = [
      `Profile analysis for ${username} with an overall score of ${analysisData.overallScore}/100.`,
      strengths.length > 0 ? `Strengths: ${strengths.join(', ')}` : '',
      recommendations.length > 0 ? `Recommendations: ${recommendations.join(', ')}` : '',
    ].filter(Boolean).join(' ')
    
    // Check if we already have a profile analysis project for this user
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.ownerId, currentUser.id),
        eq(projects.title, title)
      )
    })
    
    let projectId: string
    
    if (existingProject) {
      // Update the existing project
      await db.update(projects).set({
        description,
        publicSummary: description,
        jsonDescription: JSON.stringify(analysisData),
        updatedAt: new Date(),
      }).where(eq(projects.id, existingProject.id))
      
      projectId = existingProject.id
    } else {
      // Create a new project
      const [newProject] = await db.insert(projects).values({
        title,
        description,
        publicSummary: description,
        visibility: 'PRIVATE', // Profile analysis is private by default
        status: 'COMPLETED',
        ownerId: currentUser.id,
        jsonDescription: JSON.stringify(analysisData),
      }).returning()
      
      projectId = newProject.id
    }
    
    // Extract and save skills from the analysis
    const techSkills: string[] = []
    
    // Add tech skills from repository languages
    if (analysisData.repositoryAnalysis?.languageExpertise) {
      analysisData.repositoryAnalysis.languageExpertise.forEach(lang => {
        if (lang.language && !techSkills.includes(lang.language)) {
          techSkills.push(lang.language)
        }
      })
    }
    
    // Add tech skills from comprehensive tech stack
    if (analysisData.techStackAnalysis?.comprehensive) {
      const comprehensive = analysisData.techStackAnalysis.comprehensive
      
      for (const category in comprehensive) {
        comprehensive[category].forEach(item => {
          if (item.name && !techSkills.includes(item.name) && item.confidence > 60) {
            techSkills.push(item.name)
          }
        })
      }
    }
    
    // Add skills from detailed analyses
    if (analysisData.repositoryAnalysis?.detailedAnalyses) {
      for (const repo of analysisData.repositoryAnalysis.detailedAnalyses) {
        // Check if the repo has a technology stack
        const techStack = repo.analysis?.technology_stack || repo.analysis?.tech_stack
        
        if (techStack) {
          // Extract skills from different categories
          const categories = ['languages', 'frameworks', 'libraries', 'databases', 'tools']
          
          for (const category of categories) {
            const items = techStack[category]
            if (Array.isArray(items)) {
              items.forEach(item => {
                const name = typeof item === 'string' ? item : item?.name
                if (name && !techSkills.includes(name)) {
                  techSkills.push(name)
                }
              })
            }
          }
        }
      }
    }
    
    // Save the AI-verified skills
    if (techSkills.length > 0) {
      for (const skillName of techSkills) {
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
          projectId,
          skillId: skill.id,
        }).onConflictDoNothing()
        
        // Add as AI-verified skill
        await db.insert(aiVerifiedSkills).values({
          userId: currentUser.id,
          skillId: skill.id,
          source: 'PROFILE_ANALYSIS',
          confidence: 85, // High confidence for profile analysis
          verifiedAt: new Date(),
        }).onConflictDoNothing()
      }
    }
    
    // Revalidate profile page
    revalidatePath(`/${currentUser.username}`)
    
    return { success: true, projectId }
  } catch (error) {
    console.error('Error saving profile analysis:', error)
    return { error: 'Failed to save profile analysis' }
  }
}
