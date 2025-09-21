"use client"

import { getCurrentUser } from "@/data/user";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getDmChannelsForCurrentUser } from "@/actions/chat";
import { ChatList } from "@/components/dashboard/chat/chat-list";
import { useState } from "react";
import { RealtimeChat } from "@/components/chat/realtime-chat";
import { useQuery } from "@tanstack/react-query";
import { getMessagesForChannel, MessageWithAuthor } from "@/actions/chat";
import type { ChatMessage } from "@/hooks/use-realtime-chat";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Menu, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ChatLayoutPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch current user on client
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: Infinity,
  });

  // Fetch initial channels on client
  const { data: initialChannels } = useQuery({
    queryKey: ['dmChannels', currentUser?.id],
    queryFn: getDmChannelsForCurrentUser,
    enabled: !!currentUser?.id,
  });

  // Fetch messages for selected channel
  const { data: messagePages } = useQuery({
    queryKey: ['messages', selectedChannelId],
    queryFn: () => getMessagesForChannel(selectedChannelId!, 100),
    enabled: !!selectedChannelId,
  });

  const initialMessages: ChatMessage[] = useMemo(() => {
    if (!messagePages?.messages) return [];
    return messagePages.messages.map((msg): ChatMessage => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt,
      user: {
        name: msg.author.username || msg.author.firstName || 'Unknown'
      }
    })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagePages]);

  if (isLoadingUser) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="h-[84vh] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Messages</h2>
              </div>
              <ChatList
                initialChannels={initialChannels || []}
                currentUserId={currentUser.id}
                onChannelSelect={(channelId) => {
                  setSelectedChannelId(channelId);
                  setSidebarOpen(false);
                }}
                selectedChannelId={selectedChannelId}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex w-80 border-r bg-muted/10">
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Conversations</h2>
            </div>
            <ChatList
              initialChannels={initialChannels || []}
              currentUserId={currentUser.id}
              onChannelSelect={setSelectedChannelId}
              selectedChannelId={selectedChannelId}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannelId ? (
            <RealtimeChat
              roomName={selectedChannelId}
              username={currentUser.username || currentUser.firstName || 'User'}
              userId={currentUser.id}
              messages={initialMessages}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/5">
              <div className="text-center space-y-4">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 