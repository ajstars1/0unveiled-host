import { db } from "@/lib/drizzle"
import { skills, posts } from "@0unveiled/database"
import { eq } from "drizzle-orm"

export const skillDelete = async (id: string) => {
  "use server"
  try {
    const [skill] = await db.delete(skills)
      .where(eq(skills.id, id))
      .returning()
    return skill
  } catch (error) {
    console.error("Delete Skill Error: ", error)
    return null
  }
}

export const PostDelete = async (id: string) => {
  "use server"
  try {
    const [post] = await db.delete(posts)
      .where(eq(posts.id, id))
      .returning()
    return post
  } catch (error) {
    console.error("Delete Post Error: ", error)
    return null
  }
}
