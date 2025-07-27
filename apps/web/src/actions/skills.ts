"use server"

import { db } from "@/lib/drizzle"
import { skills } from "@0unveiled/database"
import { ilike, or } from "drizzle-orm"

export async function searchSkills(value: string): Promise<{ name: string; value: string; group?: string }[]> {
  const skillsData = await db.query.skills.findMany({
    where: or(
      ilike(skills.name, `%${value}%`),
      ilike(skills.description, `%${value}%`),
      ilike(skills.category, `%${value}%`)
    ),
    columns: {
      name: true,
      category: true
    },
    limit: 10
  })

  return skillsData.map((skill) => ({
    name: skill.name,
    value: skill.name,
    group: skill.category || undefined
  }))
} 