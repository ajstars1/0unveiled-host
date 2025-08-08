import { getCurrentUser } from "@/data/user";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getDmChannelsForCurrentUser } from "@/actions/chat";
import { ChatList } from "@/components/dashboard/chat/chat-list";

export const metadata = {
  title: "Messages | 0Unveiled",
  description: "View your direct messages.",
};

export default async function ChatLayoutPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Fetch initial list of DM channels on the server
  const initialChannels = await getDmChannelsForCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          View and manage your direct messages.
        </p>
      </div>
      <Separator className={''} />
      {/* TODO: Add layout for sidebar (ChatList) and main chat view area */}
      {/* For now, just render the list */}
      <ChatList 
         initialChannels={initialChannels || []} 
         currentUserId={currentUser.id} 
      />
      {/* <Suspense fallback={<div className="flex justify-center items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}> */}
      {/* </Suspense> */}
    </div>
  );
} 