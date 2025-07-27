'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { RealtimePresenceState, RealtimeChannel, RealtimeChannelOptions } from '@supabase/supabase-js'

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
}

const GLOBAL_PRESENCE_CHANNEL = "global-presence"

// Type for the hook props
interface UseGlobalPresenceProps {
    userId?: string; // Optional user ID to track
}

/**
 * Hook to subscribe to global presence updates and get the state.
 * If userId is provided, it ALSO tracks that user's presence on the channel.
 */
export function useGlobalPresence({ userId }: UseGlobalPresenceProps = {}): GlobalPresenceContextValue {
  // --- Stable Supabase Client ---
  // Initialize client once using useState initializer function
  const [supabase] = useState(() => createClient());

  const [presenceState, setPresenceState] = useState<GlobalPresenceState>({})
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Ref to track if we have successfully tracked the user in the current subscription
  const hasTrackedRef = useRef<boolean>(false); 

  // --- Memoized Event Handlers ---
  const handleSync = useCallback(() => {
      if (channelRef.current) {
        const newState = channelRef.current.presenceState<GlobalTrackedPresence>()
        setPresenceState(newState)
        // Don't set isLoading false here, only on initial successful subscribe
      }
  }, []); // Empty dependency array: function reference is stable

  const handleJoin = useCallback(({ key, newPresences }: { key: string, newPresences: any[] }) => {
      // Update state immediately based on the join event if needed, or rely on sync
      // For simplicity, we'll rely on sync for now, but could optimize later
      handleSync();
  }, [handleSync]);

  const handleLeave = useCallback(({ key, leftPresences }: { key: string, leftPresences: any[] }) => {
      // Update state immediately based on leave if needed, or rely on sync
      handleSync();
  }, [handleSync]);


  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null;
    let isMounted = true; // Flag to check if component is still mounted in async operations

    if (!userId) {
        // If no userId, we might not need presence? Or just listen?
        // For now, assume we don't connect if no userId is provided. Adjust if needed.
        setIsLoading(false);
        setPresenceState({});
        // Ensure cleanup if there was a previous channel
        if (channelRef.current) {
             supabase.removeChannel(channelRef.current)
                .catch(err => console.error('useGlobalPresence: Error removing previous channel (no userId):', err));
             channelRef.current = null;
        }
        return;
    }

    setIsLoading(true);
    hasTrackedRef.current = false; // Reset track status on new effect run (e.g., userId change)

    // Define channel options
    const channelOptions: RealtimeChannelOptions = {
        config: {
            presence: { key: userId }, // Always set key when we have userId
            broadcast: { ack: false, self: false },
            private: false
        }
    };

    // Get channel instance
    currentChannel = supabase.channel(GLOBAL_PRESENCE_CHANNEL, channelOptions);
    channelRef.current = currentChannel; // Update ref

    // --- Event Binding ---
    currentChannel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleJoin)
      .on('presence', { event: 'leave' }, handleLeave);

    // --- Subscription ---
    currentChannel.subscribe((status, err) => {
        if (!isMounted || channelRef.current !== currentChannel) return; // Don't proceed if unmounted or channel changed

        if (status === 'SUBSCRIBED') {
            setIsLoading(false); // Set loading false ONLY on first successful subscribe
            // Attempt to track user ONCE per successful subscription
            if (!hasTrackedRef.current && channelRef.current) {
               hasTrackedRef.current = true; // Mark as attempting/succeeded
               channelRef.current.track({ online_at: new Date().toISOString() })
                   .then(() => {
                       if (isMounted && channelRef.current === currentChannel) { // Check mount status again
                       }
                   })
                   .catch(trackError => {
                       console.error(`useGlobalPresence: .track() FAILED for user ${userId}:`, trackError);
                       hasTrackedRef.current = false; // Allow retry if track fails? Or handle differently?
                   });
            }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`useGlobalPresence: Channel closed or timed out (${status}). Resetting state.`);
            setPresenceState({});
            setIsLoading(false); // Indicate loading is finished, even if in error state
            hasTrackedRef.current = false;
            // Optionally attempt to resubscribe here after a delay?
        } else {
            // Other states like 'SUBSCRIBING', 'CHANNEL_ERROR'
             setIsLoading(true); // Set loading true during intermediate states
        }
    });

    // --- Cleanup Function ---
    return () => {
      isMounted = false; // Mark as unmounted

      // Use the channel instance captured at the start of the effect
      const chanToClean = currentChannel;
      // Clear the main ref only if it still points to the channel we are cleaning up
      if (channelRef.current === chanToClean) {
         channelRef.current = null;
      }

      if (chanToClean) {
        // REMOVED explicit untrack - Rely solely on removeChannel for cleanup
        // console.log(`useGlobalPresence CLEANUP: Attempting untrack for user ${userId}...`);
        // chanToClean.untrack()
        //   .catch(err => console.error(`useGlobalPresence CLEANUP: Error during untrack for ${userId}:`, err))
        //   .finally(() => {
        //     console.log(`useGlobalPresence CLEANUP: Removing channel ${chanToClean.topic} after untrack.`);
        //     supabase.removeChannel(chanToClean)
        //       .catch(err => console.error('useGlobalPresence CLEANUP: Error during removeChannel:', err));
        //   });

        // Call removeChannel directly
        supabase.removeChannel(chanToClean)
              .catch(err => console.error('useGlobalPresence CLEANUP: Error during removeChannel:', err));
      }
      setPresenceState({});
      setIsLoading(true); // Reset loading state for potential next run
      hasTrackedRef.current = false;
    }
  // Dependency array: Re-run ONLY if supabase client instance or userId changes.
  // supabase instance is now stable due to useState initializer.
  // REMOVED handlers from dependency array as they are memoized and shouldn't trigger re-runs.
  }, [supabase, userId]); 

  return { presenceState, isLoading };
} 