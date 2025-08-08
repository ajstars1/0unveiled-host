import { getCurrentUser, UserProfileDetails } from "@/data/user";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  getIncomingConnectionRequests,
  getEstablishedConnections,
  DetailedConnection,
} from "@/data/user";
import { ConnectionsClientPage } from "./_components/connections-client-page"; // Client component to handle interactions

export const metadata = {
  title: "Network | 0Unveiled",
  description: "Manage your connections and pending requests.",
};

export default async function ConnectionsPage() {
  const fetchedUser = await getCurrentUser();

  if (!fetchedUser) {
    redirect('/login');
  }

  // Construct the currentUser object satisfying UserProfileDetails
  const currentUser = {
    ...fetchedUser,
    connectionStatus: 'SELF' as const, // Use 'SELF' for the current user
    profileCompletionPercentage: 0, // Placeholder - calculate if needed
  } as unknown as NonNullable<UserProfileDetails>;

  // Fetch both incoming requests and established connections
  const [incomingRequests, connections] = await Promise.all([
    getIncomingConnectionRequests(currentUser.id),
    getEstablishedConnections(currentUser.id)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Network</h1>
        <p className="text-muted-foreground">
          Manage your connections and view pending requests.
        </p>
      </div>
      <Separator className="" />

      <ConnectionsClientPage
        currentUser={currentUser}
        initialIncomingRequests={incomingRequests || []}
        initialConnections={connections || []}
      />
    </div>
  );
} 