'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DmChannelListItem, getDmChannelsForCurrentUser } from '@/actions/chat'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from "@/components/ui/badge"
import { useGlobalPresenceContext } from '@/context/global-presence-context'

interface ChatListProps {
  initialChannels: DmChannelListItem[];
  currentUserId: string;
}

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
  return `${firstInitial}${lastInitial}` || '??'
}

export function ChatList({ initialChannels, currentUserId }: ChatListProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // Get presence state
  const { presenceState: globalPresenceState, isLoading: isLoadingPresence } = useGlobalPresenceContext();

  // Fetch channels using TanStack Query, seeded with initial data
  const { data: channels, isLoading, isError, error } = useQuery<DmChannelListItem[], Error>({
    queryKey: ['dmChannels', currentUserId],
    queryFn: getDmChannelsForCurrentUser,
    initialData: initialChannels,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch periodically
    refetchOnWindowFocus: true,
  });

  // TODO: Add Supabase realtime listener here to invalidate query or update data directly

  if (isLoading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (isError) {
    return <div className="text-center text-destructive p-4">Error loading chats: {error?.message || 'Please try refreshing.'}</div>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]"> {/* Adjust height as needed */} 
      <div className="flex flex-col gap-1 pr-4">
        {channels.length === 0 && (
          <p className="text-muted-foreground text-center p-6">No active conversations.</p>
        )}
        {channels.map((channel) => {
          const user = channel.otherUser;
          const lastMsg = channel.lastMessage;
          const lastMessageIsOwn = lastMsg?.authorId === currentUserId;
          const isActive = pathname === `/dashboard/chat/${channel.channelId}`;
          // Check if the other user is online using the presence state
          const isOnline = !isLoadingPresence && !!user?.id && !!globalPresenceState[user.id];
          
          return (
            <Link 
              href={`/dashboard/chat/${channel.channelId}`}
              key={channel.channelId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md hover:bg-muted/80 transition-colors cursor-pointer",
                isActive && "bg-muted"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage className="" src={user.profilePicture || undefined} alt={user.firstName || 'User'} />
                  <AvatarFallback className="">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={cn(
                      "text-sm font-medium truncate",
                   )}>
                    {user.firstName} {user.lastName}
                  </p>
                  {lastMsg && (
                    <p className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-0.5">
                   <p className={cn(
                       "text-xs text-muted-foreground truncate pr-2",
                       channel.unreadCount > 0 && !isActive && "text-foreground font-medium"
                   )}>
                    {lastMsg ? `${lastMessageIsOwn ? 'You: ' : ''}${lastMsg.content}` : 'Started conversation'}
                   </p>
                   {channel.unreadCount > 0 && (
                     <Badge 
                        variant="destructive" 
                        className="h-5 px-1.5 text-[10px] shrink-0"
                    >
                       {channel.unreadCount > 9 ? '9+' : channel.unreadCount}
                     </Badge>
                   )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
} 