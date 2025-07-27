"use server"

import { db } from "@/lib/drizzle"
import { accounts } from "@0unveiled/database"
import { eq, and } from "drizzle-orm"

/**
 * Get an account by user ID
 * @param userId The user's ID
 * @returns Account object or null if not found
 */
export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId)
    })
    return account
  } catch (error) {
    console.error("Get Account By User ID Error:", error)
    return null
  }
}

/**
 * Get an account by provider and provider account ID
 * @param provider The OAuth provider name
 * @param providerAccountId The provider's account ID
 * @returns Account object or null if not found
 */
export const getAccountByProvider = async (
  provider: string,
  providerAccountId: string
) => {
  try {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.provider, provider) && eq(accounts.providerAccountId, providerAccountId)
    })
    return account
  } catch (error) {
    console.error("Get Account By Provider Error:", error)
    return null
  }
}

/**
 * Delete an account
 * @param userId The user's ID
 * @param provider The OAuth provider name
 * @returns true if deleted successfully, false otherwise
 */
export const deleteAccount = async (
  userId: string,
  provider: string
): Promise<boolean> => {
  try {
    await db.delete(accounts).where(
      eq(accounts.userId, userId) && eq(accounts.provider, provider)
    )
    return true
  } catch (error) {
    console.error("Delete Account Error:", error)
    return false
  }
}
