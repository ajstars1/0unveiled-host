'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, startTransition, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDmChannelDetails, markMessagesAsRead } from '@/actions/chat'
import { useGlobalPresenceContext } from '@/context/global-presence-context'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

interface RealtimeChatProps {
  roomName: string
  username: string
  userId: string
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param userId - The ID of the current user
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  userId,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    data: channelDetailsData,
    isLoading: isLoadingDetails,
    isError: isDetailsError,
  } = useQuery({
    queryKey: ['dmChannelDetails', roomName],
    queryFn: () => getDmChannelDetails(roomName),
    enabled: !!roomName,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const otherUser = channelDetailsData?.otherUser

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    broadcastReadStatus
  } = useRealtimeChat({
    roomName,
    username,
  })

  const { presenceState: globalPresenceState, isLoading: isLoadingPresence } = useGlobalPresenceContext();

  const [newMessage, setNewMessage] = useState('')

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const messageMap = new Map<string, ChatMessage>()
    
    // Add initial messages first, assuming they are older and sorted
    initialMessages.forEach(msg => messageMap.set(msg.id, msg))
    
    // Add or update with realtime messages
    realtimeMessages.forEach(msg => messageMap.set(msg.id, msg))

    // Convert back to array and sort
    return Array.from(messageMap.values()).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [initialMessages, realtimeMessages])

  // --- Mark messages as read and broadcast (DEBOUNCED EFFECT) ---
  // Ref for debounce timer
  const debounceMarkRead = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if the initial mount read has happened for the current room
  const initialReadAttempted = useRef(false);

  useEffect(() => {
    // Guard clause: Ensure essential props are available
    if (!roomName || !userId || !username) {
      return;
    }

    // Reset initial read flag if roomName changes
    // This assumes roomName is stable for a given chat instance,
    // but if the component re-renders with a NEW roomName, we need to reset.
    // Consider a more robust way if roomName can change rapidly within the same component instance.
    // For now, we'll assume it's stable per chat view.

    // --- Debounce Logic ---
    const triggerDebouncedRead = () => {
      // Clear existing timer
      if (debounceMarkRead.current) {
        clearTimeout(debounceMarkRead.current);
      }
      // Set new timer
      debounceMarkRead.current = setTimeout(() => {
        startTransition(() => {
          markMessagesAsRead(roomName)
            .then(result => {
              if (result.success) {
                if (result.count && result.count > 0) {
                  broadcastReadStatus();
                }
              }
            })
            .catch(() => {
            });
        });
      }, 1000); // 1-second delay after the last trigger
    };

    // --- Initial Read on Mount ---
    // Run only once per component mount *for the current room*
    if (!initialReadAttempted.current) {
        triggerDebouncedRead(); // Trigger read check immediately on mount
        initialReadAttempted.current = true;
    }

    // --- Read on New Incoming Message ---
    const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
    // Check if the *very last* message added is from the other user
    if (lastMessage && lastMessage.user.name !== username) {
        triggerDebouncedRead(); // Schedule/reset debounce timer
    }

    // --- Cleanup ---
    return () => {
      if (debounceMarkRead.current) {
        clearTimeout(debounceMarkRead.current);
      }
      // Reset the initial read flag on unmount or room change
      initialReadAttempted.current = false;
    };

  // Dependencies: Run when messages change, or core IDs change
  }, [allMessages, roomName, userId, username, broadcastReadStatus]);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      if (newMessage.trim().length > 1000) {
         return;
      }

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const otherUserName = otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() : 'Loading...'

  let statusText = 'Connecting...';
  let showOnlineIndicator = false;
  let statusColorClass = "text-muted-foreground";

  if (!isLoadingPresence) {
    if (otherUser && globalPresenceState[otherUser.id]) {
      // Presence found for the other user
      statusText = 'Online';
      showOnlineIndicator = true;
      statusColorClass = "text-green-600";
    } else {
      // Presence not loading, but other user state not found
      if (otherUser) {
         // We have the user details, but they are not in the presence state
         statusText = 'Offline';
      } else {
         // Still waiting for user details to load
         statusText = 'Loading Info...'; 
      }
      showOnlineIndicator = false;
      statusColorClass = "text-muted-foreground";
    }
  } else {
     // Presence state itself is still loading
     statusText = 'Connecting Presence...';
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Header - Updated with presence */}
      <div className="flex items-center p-4 border-b">
        {isLoadingDetails ? (
          <>
            <Skeleton className="h-10 w-10 rounded-full mr-3" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </>
        ) : otherUser ? (
          <>
            <Avatar className="relative h-10 w-10 mr-3">
                <AvatarImage 
                className=""
                 src={otherUser.profilePicture ?? undefined}
                 alt={otherUserName}
              />
               <AvatarFallback className="">
                 {otherUser.firstName?.charAt(0)?.toUpperCase() ?? 'U'}
                 {otherUser.lastName?.charAt(0)?.toUpperCase() ?? ''}
               </AvatarFallback>
               {showOnlineIndicator && (
                   <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
               )}
            </Avatar>
            <div>
              <h2 className="font-semibold">{otherUserName}</h2>
              <p className={cn("text-xs", statusColorClass)}>
                {statusText}
              </p>
            </div>
          </>
        ) : (
          <>
            <Avatar className="relative h-10 w-10 mr-3">
               <AvatarFallback className="">??</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{isDetailsError ? 'Error' : 'Unknown User'}</h2>
              <p className="text-xs text-muted-foreground">Status unavailable</p>
            </div>
          </>
        )}
      </div>
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      <form 
        onSubmit={handleSendMessage} 
        className="flex w-full items-end gap-2 border-t border-border p-4"
      >
        <Textarea
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          disabled={!isConnected}
          maxLength={1000}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg bg-background text-sm p-2 min-h-[40px] max-h-[150px] overflow-y-auto',
          )}
        />
        <Button
          size="default"
          variant="default"
          className="aspect-square rounded-full h-9 w-9 p-0 self-end"
          type="submit"
          disabled={!isConnected || !newMessage.trim() || newMessage.trim().length > 1000}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
