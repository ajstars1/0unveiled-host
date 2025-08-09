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
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > CACHE_TTL
    if (isExpired) {
      layoutCache.delete(key)
      return null
    }

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

  getStats: () => ({
    size: layoutCache.size,
    keys: Array.from(layoutCache.keys()),
    hitRate: 0 // TODO: Implement hit rate tracking
  })
}

/**
 * Layout data fetching with caching
 */
export async function fetchLayoutData(userId?: string): Promise<LayoutData> {
  const cacheKey = `layout-${userId || 'anonymous'}`
  
  // Try to get from cache first
  const cached = cacheUtils.get(cacheKey)
  if (cached) {
    return cached
  }

  // Fresh fetch if not in cache
  const { getCurrentUser } = await import("@/data/user")
  const { createSupabaseServerClient } = await import("@/lib/supabase/server")
  const { getUnreadNotificationCount, getRecentNotifications } = await import("@/actions/optimized-notifications")

  try {
    // Fetch user data
    const [fetchedUser, sessionUserResult] = await Promise.allSettled([
      getCurrentUser(),
      (async () => {
        try {
          const supabase = await createSupabaseServerClient()
          const { data: { user } } = await supabase.auth.getUser()
          return user
        } catch (error) {
          console.warn("Could not create Supabase client:", error)
          return null
        }
      })()
    ])

    const user = fetchedUser.status === 'fulfilled' ? fetchedUser.value : null
    const sessionUser = sessionUserResult.status === 'fulfilled' ? sessionUserResult.value : null

    // Fetch notifications only if user is logged in
    let notificationData: {
      count: number
      notifications: Notification[]
    } = {
      count: 0,
      notifications: []
    }

    if (user) {
      const [countResult, notificationsResult] = await Promise.allSettled([
        getUnreadNotificationCount(),
        getRecentNotifications(5)
      ])

      notificationData = {
        count: countResult.status === 'fulfilled' ? countResult.value : 0,
        notifications: notificationsResult.status === 'fulfilled' ? notificationsResult.value as Notification[] : []
      }
    }

    const result: LayoutData = {
      user,
      sessionUser,
      notifications: notificationData.notifications,
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
