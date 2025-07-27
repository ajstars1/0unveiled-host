'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState, useRef } from 'react'
import { sendMessage as persistMessageAction } from '@/actions/chat'
// import { getCurrentUser } from '@/data/user' // Not used directly in hook
// import type { RealtimePresenceState } from '@supabase/supabase-js'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  // userId: string 
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  readAt?: Date | null
}

// Presence types removed
// interface TrackedPresence { ... }
// export type PresenceState = RealtimePresenceState<TrackedPresence>

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_READ_TYPE = 'messages-read'

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  // Fix the type of supabaseRef
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    // Create Supabase client inside the effect
    const supabase = createClient();
    supabaseRef.current = supabase;
    
    if (!roomName) {
        return; 
    }

    let isSubscribed = false;
    const newChannel = supabase.channel(roomName, {
      config: {
         // broadcast: { ack: true } // Example: keep other configs if needed
      }
    });
    channelRef.current = newChannel;

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const receivedMsg = payload.payload as ChatMessage
        setMessages(currentMsgs => {
            if (currentMsgs.find(msg => msg.id === receivedMsg.id)) {
                return currentMsgs; // Don't add duplicate message
            }
            return [...currentMsgs, receivedMsg];
        });
      })
      .on('broadcast', { event: EVENT_READ_TYPE }, (payload) => {
        setMessages(currentMsgs => 
            currentMsgs.map(msg => {
                if (msg.user.name === username && !msg.readAt) {
                    return { ...msg, readAt: new Date() }; // Create new object with readAt timestamp
                }
                return msg; // Return unchanged message otherwise
            })
        );
      })
      .subscribe((status, err) => { 
        if (status === 'SUBSCRIBED') {
          isSubscribed = true;
          setIsConnected(true);
        } else {
            if (isSubscribed || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                setIsConnected(false);
            } 
        }
      });

    return () => {
      setIsConnected(false);
      if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
              .catch(err => console.error('useRealtimeChat: Error removing channel:', err));
          channelRef.current = null; // Clear ref
      }
    }
    // Only depend on roomName now
  }, [roomName, username]); // Removed userId from dependencies

  const sendMessage = useCallback(
    async (content: string) => {
      // Check ref for channel
      const currentChannel = channelRef.current;
      const supabase = supabaseRef.current;
      
      if (!currentChannel || !isConnected || !supabase) {
        return;
      }

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
        readAt: null
      }

      // Optimistic update using functional form
       setMessages(currentMsgs => [...currentMsgs, message]);

      // Persist message (keep this)
      let dbMessageId: string | undefined;
      try {
        const result = await persistMessageAction(roomName, content)
        if (result.error) {
          console.error('Error persisting message:', result.error)
        } else if (result.message) {
          dbMessageId = result.message.id;
        }
      } catch (error) {
        console.error('Exception persisting message:', error)
      }

      // Broadcast message (keep this)
      try {
        const messageToSend = { ...message, id: dbMessageId ?? message.id };
        const status = await currentChannel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: messageToSend,
        });
      } catch (broadcastError) {
        console.error('Error broadcasting message:', broadcastError);
      }
    },
    [isConnected, username, roomName] 
  );

  const broadcastReadStatus = useCallback(async () => {
    const currentChannel = channelRef.current;
    if (!currentChannel) { 
        return;
    }
    try {
        const status = await currentChannel.send({
            type: 'broadcast',
            event: EVENT_READ_TYPE,
            payload: { readerUsername: username }
        });
    } catch (broadcastError) {
        console.error('Error broadcasting read status:', broadcastError);
    }
  }, [roomName, username]);

  // Return value no longer includes presenceState or userId
  return { messages, sendMessage, isConnected, broadcastReadStatus }
}
