"use server"

import { db } from "@/lib/drizzle"
import { posts, users } from "@0unveiled/database"
import { eq, desc } from "drizzle-orm"

/**
 * Get all posts by a user
 * @param userId The user's ID
 * @returns Array of posts or null if error occurs
 */
export const getUserPosts = async (userId: string) => {
  try {
    const userPosts = await db.query.posts.findMany({
      where: eq(posts.authorId, userId),
      orderBy: [desc(posts.createdAt)],
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    })
    return userPosts
  } catch (error) {
    console.error("Get User Posts Error:", error)
    return null
  }
}

/**
 * Get a post by its ID
 * @param id The post ID
 * @returns Post object or null if not found
 */
export const getPostById = async (id: string) => {
  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    })
    return post
  } catch (error) {
    console.error("Get Post By ID Error:", error)
    return null
  }
}

/**
 * Get all posts for a project
 * @param projectId The project's ID
 * @returns Array of posts or null if error occurs
 */
export const getProjectPosts = async (projectId: string) => {
  try {
    const projectPosts = await db.query.posts.findMany({
      where: eq(posts.projectId, projectId),
      orderBy: [desc(posts.createdAt)],
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    })
    return projectPosts
  } catch (error) {
    console.error("Get Project Posts Error:", error)
    return null
  }
}
