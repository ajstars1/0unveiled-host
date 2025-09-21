'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { RealtimePresenceState, RealtimeChannel, RealtimeChannelOptions } from '@supabase/supabase-js'
import logger from '@/lib/logger'

// Define the shape of the presence info we expect
interface GlobalTrackedPresence {
  online_at: string
}

// Define the type for the global presence state object
export type GlobalPresenceState = RealtimePresenceState<GlobalTrackedPresence>

// Type for the context value including loading state
export interface GlobalPresenceContextValue {
  presenceState: GlobalPresenceState;
  isLoading: boolean;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

const GLOBAL_PRESENCE_CHANNEL = 'global-presence'
// Keep heartbeat under server idle timeout (typically ~60s)
const HEARTBEAT_INTERVAL = 55000 // 55s
// Watchdog to recover from long DISCONNECTED states without fighting Supabase auto-rejoin
const WATCHDOG_INTERVAL = 15000 // 15s
const WATCHDOG_STALE_MS = 30000 // 30s without a healthy signal
// Gate noisy logs behind an env flag
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_REALTIME === '1' || process.env.NEXT_PUBLIC_DEBUG_REALTIME === 'true'

// Type for the hook props
interface UseGlobalPresenceProps {
  userId?: string; // Optional user ID to track
}

/**
 * Hook to subscribe to global presence updates and get the state.
 * If userId is provided, it ALSO tracks that user's presence on the channel.
 * Production hardened: offline guard, gated logs, heartbeat, watchdog recovery.
 */
export function useGlobalPresence({ userId }: UseGlobalPresenceProps = {}): GlobalPresenceContextValue {
  // --- Stable Supabase Client ---
  const [supabase] = useState(() => createClient())

  const [presenceState, setPresenceState] = useState<GlobalPresenceState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED')

  const channelRef = useRef<RealtimeChannel | null>(null)
  const hasTrackedRef = useRef<boolean>(false)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const lastHealthyRef = useRef<number>(0)
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Memoized Event Handlers ---
  const handleSync = useCallback(() => {
    if (channelRef.current && isMountedRef.current) {
      const newState = channelRef.current.presenceState<GlobalTrackedPresence>()
      setPresenceState(newState)
    }
  }, [])

  const handleJoin = useCallback(({ key }: { key: string, newPresences: any[] }) => {
    // if (DEBUG) console.log(`useGlobalPresence: User ${key} joined`)
    handleSync()
  }, [handleSync])

  const handleLeave = useCallback(({ key }: { key: string, leftPresences: any[] }) => {
    // if (DEBUG) console.log(`useGlobalPresence: User ${key} left`)
    handleSync()
  }, [handleSync])

  // Clear watchdog
  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  // Clear heartbeat interval
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  // Start heartbeat to keep presence alive
  const startHeartbeat = useCallback(() => {
    clearHeartbeat()

    if (!userId || !isMountedRef.current) return

    heartbeatIntervalRef.current = setInterval(() => {
      if (channelRef.current && hasTrackedRef.current && isMountedRef.current) {
        channelRef.current
          .track({ online_at: new Date().toISOString() })
          .catch(err => {
            if (DEBUG) console.warn('useGlobalPresence: Heartbeat track failed:', err)
            // If heartbeat fails, the channel status handler/watchdog will recover
          })
      }
    }, HEARTBEAT_INTERVAL)
  }, [userId, clearHeartbeat])

  const connectToChannel = useCallback(() => {
    if (!userId || !isMountedRef.current) {
      setIsLoading(false)
      setPresenceState({})
      setConnectionStatus('DISCONNECTED')
      return
    }
    // If offline, defer connection until back online
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setConnectionStatus('DISCONNECTED')
      setIsLoading(false)
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline)
        if (isMountedRef.current) connectToChannel()
      }
      window.addEventListener('online', handleOnline, { once: true })
      return
    }

    setIsLoading(true)
    setConnectionStatus('CONNECTING')
    hasTrackedRef.current = false

    // Define channel options with better configuration
    const channelOptions: RealtimeChannelOptions = {
      config: {
        presence: {
          key: userId,
        },
        broadcast: { ack: false, self: false },
        private: false,
      },
    }
    // Get or create channel instance (if already created with same topic, supabase.channel will reuse it)
    const currentChannel = channelRef.current ?? supabase.channel(GLOBAL_PRESENCE_CHANNEL, channelOptions)
    channelRef.current = currentChannel

    // --- Event Binding ---
    currentChannel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleJoin)
      .on('presence', { event: 'leave' }, handleLeave)

    // --- Subscription ---
    currentChannel.subscribe((status, err) => {
      if (!isMountedRef.current || channelRef.current !== currentChannel) return

      // if (DEBUG) console.log(`useGlobalPresence: Channel status changed to ${status}`, err)

      if (status === 'SUBSCRIBED') {
        setConnectionStatus('CONNECTED')
        setIsLoading(false)
        lastHealthyRef.current = Date.now()

        // Attempt to track user ONCE per successful subscription
        if (!hasTrackedRef.current && channelRef.current) {
          hasTrackedRef.current = true
          channelRef.current
            .track({ online_at: new Date().toISOString() })
            .then(() => {
              // if (DEBUG) console.log(`useGlobalPresence: Tracking user ${userId}`)
              startHeartbeat()
            })
            .catch((e) => {
              logger.error(`useGlobalPresence: .track() failed for user ${userId}:`, e)
              hasTrackedRef.current = false
            })
        }
      } else if (status === 'CLOSED') {
        if (DEBUG) console.warn('useGlobalPresence: Channel closed')
        setConnectionStatus('DISCONNECTED')
        setPresenceState({})
        setIsLoading(false)
        hasTrackedRef.current = false
        clearHeartbeat()
        // Rely on Supabase auto-rejoin; watchdog will recreate if needed
      } else if (status === 'CHANNEL_ERROR') {
        console.error('useGlobalPresence: Channel error:', err)
        setConnectionStatus('ERROR')
        setPresenceState({})
        setIsLoading(false)
        hasTrackedRef.current = false
        clearHeartbeat()
      } else if (status === 'TIMED_OUT') {
        if (DEBUG) console.warn('useGlobalPresence: Channel timed out')
        setConnectionStatus('DISCONNECTED')
        setPresenceState({})
        setIsLoading(false)
        hasTrackedRef.current = false
        clearHeartbeat()
      } else {
        // SUBSCRIBING or other transitional states
        setConnectionStatus('CONNECTING')
        setIsLoading(true)
      }
    })
  }, [userId, supabase, handleSync, handleJoin, handleLeave, startHeartbeat])

  useEffect(() => {
    isMountedRef.current = true
    connectToChannel()

    // --- Cleanup Function ---
    return () => {
      isMountedRef.current = false
      clearWatchdog()
      clearHeartbeat()

      const chanToClean = channelRef.current
      channelRef.current = null

      if (chanToClean) {
        // if (DEBUG) console.log(`useGlobalPresence CLEANUP: Removing channel ${chanToClean.topic}`)
        supabase.removeChannel(chanToClean)
          .catch(err => logger.error('useGlobalPresence CLEANUP: Error during removeChannel:', err))
      }

      setPresenceState({})
      setIsLoading(true)
      setConnectionStatus('DISCONNECTED')
      hasTrackedRef.current = false
      lastHealthyRef.current = 0
    }
  }, [connectToChannel, clearWatchdog, clearHeartbeat, supabase])

  // Page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') && userId) {
        // if (DEBUG) console.log('useGlobalPresence: Page visible, nudging reconnect...')
        connectToChannel()
      } else if (document.visibilityState === 'hidden') {
        // if (DEBUG) console.log('useGlobalPresence: Page hidden, stopping heartbeat')
        clearHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionStatus, userId, connectToChannel, clearHeartbeat])

  // Watchdog: if we're disconnected for too long while online, recreate the channel cleanly
  useEffect(() => {
    clearWatchdog()
    if (!userId) return

    watchdogRef.current = setInterval(() => {
      if (!isMountedRef.current) return
      if (typeof window !== 'undefined' && !navigator.onLine) return // don't fight offline

      const stale = (Date.now() - (lastHealthyRef.current || 0)) > WATCHDOG_STALE_MS
      const needNudge = (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') && stale

      if (needNudge) {
        if (DEBUG) console.warn('useGlobalPresence: Watchdog recreating channel after stale disconnect')
        const chan = channelRef.current
        channelRef.current = null
        if (chan) {
          supabase.removeChannel(chan).catch(() => {})
        }
        connectToChannel()
      }
    }, WATCHDOG_INTERVAL)

    return clearWatchdog
  }, [userId, connectionStatus, connectToChannel, clearWatchdog, supabase])

  return { presenceState, isLoading, connectionStatus }
}