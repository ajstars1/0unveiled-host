'use client'

import { createClient } from '@0unveiled/lib/supabase'
import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface GlobalPresenceTrackerProps {
  userId: string | undefined // User ID to track
}

const GLOBAL_PRESENCE_CHANNEL = "global-presence"

/**
 * Component responsible for tracking the current user's presence 
 * on the global presence channel.
 * Should be rendered once in the main layout when the user is logged in.
 */
export function GlobalPresenceTracker({ userId }: GlobalPresenceTrackerProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Create Supabase client inside the effect to ensure stability
    const supabase = createClient()
    
    if (!userId) {
      if (channelRef.current) {
        channelRef.current.untrack()
            .catch(err => console.error('GlobalPresenceTracker: Error untracking on userId removal:', err));
        supabase.removeChannel(channelRef.current)
            .catch(err => console.error('GlobalPresenceTracker: Error removing channel on userId removal:', err));
        channelRef.current = null;
      }
      return; 
    }

    if (channelRef.current) {
        return;
    }
    
    
    // Temporarily simplify config to test basic subscription
    const channel = supabase.channel(GLOBAL_PRESENCE_CHANNEL /*, {
        config: {
          presence: { key: userId }, 
        },
    }*/);
    channelRef.current = channel;

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
         try {
             channel.track({ online_at: new Date().toISOString() })
                .then(() => {
                })
               .catch(trackError => {
                  console.error(`[Tracker] .track() FAILED for user ${userId}:`, trackError);
                });
         } catch (syncError) {
             console.error(`[Tracker] Synchronous error calling .track() for user ${userId}:`, syncError);
         }
      } 
    });

    return () => {
      const chan = channelRef.current;
      channelRef.current = null;

      if (chan) {
         chan.untrack()
            .catch(err => console.error('[Tracker] Error during untrack:', err))
            .finally(() => {
                supabase.removeChannel(chan)
                    .catch(err => console.error('[Tracker] Error during removeChannel:', err));
            });
      }
    }
  }, [userId]); // Remove supabase from dependencies

  return null;
} 