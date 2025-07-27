"use server"

import { db } from "@/lib/drizzle"
import { education } from "@0unveiled/database"
import { eq, ilike, desc } from "drizzle-orm"

/**
 * Get an education record by its ID
 * @param id The education record ID
 * @returns Education object or null if not found
 */
export const getEducationById = async (id: string) => {
  try {
    const educationRecord = await db.query.education.findFirst({
      where: eq(education.id, id)
    })
    return educationRecord
  } catch (error) {
    console.error("Get Education By ID Error:", error)
    return null
  }
}

/**
 * Get education records by institution name (case-insensitive search)
 * @param name The institution name to search for
 * @returns Array of matching education records or null if error occurs
 */
export const getEducationByInstitution = async (name: string) => {
  try {
    const educations = await db.query.education.findMany({
      where: ilike(education.institution, `%${name}%`),
      orderBy: [desc(education.startDate)]
    })
    return educations
  } catch (error) {
    console.error("Get Education By Institution Error:", error)
    return null
  }
}

/**
 * Get all education records for a user
 * @param userId The user's ID
 * @returns Array of education records or null if error occurs
 */
export const getUserEducation = async (userId: string) => {
  try {
    const userEducation = await db.query.education.findMany({
      where: eq(education.userId, userId),
      orderBy: [desc(education.startDate)]
    })
    return userEducation
  } catch (error) {
    console.error("Get User Education Error:", error)
    return null
  }
}

/**
 * Check if a user has an education record at an institution
 * @param userId The user's ID
 * @param institution The institution name
 * @returns Boolean indicating if the education record exists
 */
export const hasEducationAtInstitution = async (
  userId: string,
  institution: string
): Promise<boolean> => {
  try {
    const educationRecord = await db.query.education.findFirst({
      where: eq(education.userId, userId)
    })
    return !!educationRecord && educationRecord.institution.toLowerCase() === institution.toLowerCase()
  } catch (error) {
    console.error("Check Education Exists Error:", error)
    return false
  }
}
