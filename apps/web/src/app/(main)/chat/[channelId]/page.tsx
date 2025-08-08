"use client"

import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/data/user'
import { getMessagesForChannel, MessageWithAuthor } from '@/actions/chat'
import { Skeleton } from '@/components/ui/skeleton'
import { RealtimeChat } from '@/components/chat/realtime-chat'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

// Skeleton Component for Chat Page
const ChatPageSkeleton = () => (
  <div className="flex flex-col h-full max-h-screen bg-background"> 
    <div className="flex-1 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl h-[80vh] shadow-xl rounded-xl overflow-hidden border border-gray-200 flex flex-col">
        {/* Skeleton Header */}
        <div className="flex items-center p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* Skeleton Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-end gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-10 w-3/5 rounded-lg" /></div>
          <div className="flex justify-end items-end gap-2"><Skeleton className="h-10 w-1/2 rounded-lg" /><Skeleton className="h-8 w-8 rounded-full" /></div>
          <div className="flex items-end gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-12 w-2/5 rounded-lg" /></div>
          <div className="flex justify-end items-end gap-2"><Skeleton className="h-8 w-1/3 rounded-lg" /><Skeleton className="h-8 w-8 rounded-full" /></div>
        </div>
        {/* Skeleton Input */}
        <div className="flex w-full items-end gap-2 border-t border-border p-4">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const ChatPage = () => {
  // --- Hooks called unconditionally at the top ---
  const params = useParams();
  const channelId = params.channelId as string;

  const { data: currentUser, isLoading: isLoadingUser, isError: isUserError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: Infinity,
  });

  const { 
    data: messagePages, 
    isLoading: isLoadingMessages,
    isError: isMessagesError,
    error: messagesError,
  } = useInfiniteQuery<{
    messages: MessageWithAuthor[];
    nextCursor: string | null;
  }, Error>({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => getMessagesForChannel(channelId, 100, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage?.nextCursor, 
    initialPageParam: undefined, 
    enabled: !!channelId, 
    refetchOnWindowFocus: false,
  });

  const initialMessages: ChatMessage[] = useMemo(() => { 
    if (!messagePages) return [];
    return messagePages.pages.flatMap(page => page.messages).map((msg): ChatMessage => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt,
      user: {
        name: msg.author.username || msg.author.firstName || 'Unknown' 
      }
    })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagePages]);

  // Safely compute derived state after hooks, handling potential null `currentUser`
  const usernameForChat = useMemo(() => currentUser?.username || "User", [currentUser?.username]);
  const stableUserId = useMemo(() => currentUser?.id, [currentUser?.id]);

  // --- Conditional returns based on hook results ---
  if (isLoadingUser || isLoadingMessages) { 
    // Render Skeleton instead of Loader2
    return <ChatPageSkeleton />;
  }

  if (isUserError || !currentUser || !stableUserId) { // Check stableUserId existence too
    return <div className="text-center text-destructive p-4">Error loading user data or user not found. Please try refreshing.</div>;
  }

  if (isMessagesError) {
    return <div className="text-center text-destructive p-4">Error loading messages: {messagesError?.message || 'Please try refreshing.'}</div>;
  }

  // --- Render component if all checks pass ---
  return (
    <div className="flex flex-col h-full max-h-screen bg-background"> 
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl h-[80vh] shadow-xl rounded-xl overflow-hidden border border-gray-200">
      <RealtimeChat 
        roomName={channelId} 
        username={usernameForChat} 
              userId={stableUserId} // Now guaranteed to be called
              messages={initialMessages}
          />
          </div>
          </div>
    </div>
  );
};

export default ChatPage; 