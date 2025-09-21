import type { Notification } from '@0unveiled/database'

// Type definitions  
interface LayoutData {
  isAuthenticated: boolean
  user: any | null
  sessionUser: any | null
  notifications: Notification[]
}

// In-memory cache for layout data with TTL
const layoutCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cache statistics
let cacheHits = 0
let cacheMisses = 0

/**
 * Cache utilities for layout data
 */
export const cacheUtils = {
  set: (key: string, data: any) => {
    layoutCache.set(key, {
      data,
      timestamp: Date.now()
    })
  },

  get: (key: string) => {
    const cached = layoutCache.get(key)
    if (!cached) {
      cacheMisses++
      return null
    }

    const isExpired = Date.now() - cached.timestamp > CACHE_TTL
    if (isExpired) {
      layoutCache.delete(key)
      cacheMisses++
      return null
    }

    cacheHits++
    return cached.data
  },

  clear: (keyPattern?: string) => {
    if (keyPattern) {
      for (const key of layoutCache.keys()) {
        if (key.includes(keyPattern)) {
          layoutCache.delete(key)
        }
      }
    } else {
      layoutCache.clear()
    }
  },

  getStats: () => {
    const total = cacheHits + cacheMisses
    const hitRate = total > 0 ? (cacheHits / total) * 100 : 0
    return {
      size: layoutCache.size,
      keys: Array.from(layoutCache.keys()),
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      totalRequests: total,
      hits: cacheHits,
      misses: cacheMisses
    }
  },

  resetStats: () => {
    cacheHits = 0
    cacheMisses = 0
  }
}

/**
 * Layout data fetching with caching
 */
export async function fetchLayoutData(): Promise<LayoutData> {
  // Fetch user data first to determine the correct cache key
  const { getCurrentUser } = await import("@/data/user")
  
  try {
    // Fetch user data with timeout protection
    const fetchedUser = await Promise.race([
      getCurrentUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getCurrentUser timeout')), 15000))
    ])
    
    // Determine cache key based on actual user ID
    const cacheKey = fetchedUser ? `layout-${fetchedUser.id}` : 'layout-anonymous'
    
    // Try to get from cache first
    const cached = cacheUtils.get(cacheKey)
    if (cached) {
      return cached
    }

    const { createSupabaseServerClient } = await import("@/lib/supabase/server")
    const { getUnreadNotificationCount, getRecentNotifications } = await import("@/actions/optimized-notifications")

    // Fetch session user and notifications
    const [sessionUserResult] = await Promise.allSettled([
      (async () => {
        try {
          // Add timeout for Supabase client creation
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Supabase client creation timeout')), 10000)
          })
          
          const clientPromise = createSupabaseServerClient()
          const supabase = await Promise.race([clientPromise, timeoutPromise]) as any
          
          const { data: { user } } = await supabase.auth.getUser()
          return user
        } catch (error) {
          console.warn("Could not create Supabase client:", error)
          return null
        }
      })()
    ])

    const user = fetchedUser
    const sessionUser = sessionUserResult.status === 'fulfilled' ? sessionUserResult.value : null

    // Fetch notifications only if user is logged in
    let notifications: Notification[] = []

    if (user) {
      const notificationsResult = await Promise.allSettled([
        getRecentNotifications(5)
      ])

      notifications = notificationsResult[0].status === 'fulfilled' ? notificationsResult[0].value as Notification[] : []
    }

    const result: LayoutData = {
      user,
      sessionUser,
      notifications,
      isAuthenticated: !!user
    }

    // Cache the result
    cacheUtils.set(cacheKey, result)
    
    return result
  } catch (error) {
    console.error("Error fetching layout data:", error)
    
    // Return safe defaults on error
    return {
      user: null,
      sessionUser: null,
      notifications: [],
      isAuthenticated: false
    }
  }
}
