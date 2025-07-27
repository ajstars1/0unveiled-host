"use server"

import { db } from "@/lib/drizzle"
import { userSkills, skills } from "@0unveiled/database"
import { eq, ilike, asc } from "drizzle-orm"

export interface SkillProp {
  id: string
  name: string
  description?: string | null
  category?: string | null
}

export interface UserSkillProp extends SkillProp {
  level: number | null
}

// Get all skills for a user
export const getSkills = async (userId: string | null) => {
  if (!userId) return null
  
  try {
    const userSkillsData = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
      with: {
        skill: true
      }
    })
    
    return userSkillsData.map(us => ({
      ...us.skill,
      level: us.level
    })) as UserSkillProp[]
  } catch (error) {
    console.error("Get Skills Error: ", error)
    return null
  }
}

// Get a skill by ID
export const getSkillById = async (id: string): Promise<SkillProp | null> => {
  try {
    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, id)
    })
    return skill
  } catch (error) {
    console.error("Get Skill By ID Error: ", error)
    return null
  }
}

// Check if a skill exists by name
export const isSkillExist = async (name: string): Promise<boolean> => {
  try {
    const skill = await db.query.skills.findFirst({
      where: ilike(skills.name, name)
    })
    return !!skill
  } catch (error) {
    console.error("Check Skill Exists Error: ", error)
    return false
  }
}

// Check if a user has a specific skill
export const isSkillConnectedToUser = async (
  skillId: string,
  userId: string
): Promise<boolean> => {
  try {
    const userSkill = await db.query.userSkills.findFirst({
      where: eq(userSkills.userId, userId) && eq(userSkills.skillId, skillId)
    })
    return !!userSkill
  } catch (error) {
    console.error("Check User Skill Connection Error: ", error)
    return false
  }
}

// Get all available skills
export const getAllSkills = async (): Promise<SkillProp[]> => {
  try {
    const allSkills = await db.query.skills.findMany({
      orderBy: [asc(skills.name)]
    })
    return allSkills
  } catch (error) {
    console.error("Get All Skills Error: ", error)
    return []
  }
}

// Add a skill to a user
export const addUserSkill = async (
  userId: string,
  skillId: string,
  level?: number
) => {
  try {
    const userSkill = await db.insert(userSkills).values({
      userId,
      skillId,
      level
    }).returning()
    
    // Fetch the skill details
    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, skillId)
    })
    
    if (!skill) return null
    
    return {
      ...skill,
      level: userSkill[0].level
    } as UserSkillProp
  } catch (error) {
    console.error("Add User Skill Error: ", error)
    return null
  }
}

// Remove a skill from a user
export const removeUserSkill = async (
  userId: string,
  skillId: string
) => {
  try {
    await db.delete(userSkills).where(
      eq(userSkills.userId, userId) && eq(userSkills.skillId, skillId)
    )
    return true
  } catch (error) {
    console.error("Remove User Skill Error: ", error)
    return false
  }
}
