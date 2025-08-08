'use client'

import * as React from 'react'
import { acceptConnectionRequest, rejectOrWithdrawConnectionRequest, removeConnection } from "@/actions/profileActions"
import { UserProfileDetails, DetailedConnection } from "@/data/user" // Assuming DetailedConnection is exported
import { ConnectionRequest } from "@0unveiled/database"
import { useToast } from "@/hooks/use-toast"
import { startTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCheck, UserX, Trash2, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getOrCreateDmChannel } from '@/actions/chat'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Enhance ConnectionRequest type to include nested requester details
type IncomingRequest = ConnectionRequest & {
  requester: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    headline: string | null;
  }
}

interface ConnectionsClientPageProps {
  currentUser: NonNullable<UserProfileDetails>;
  initialIncomingRequests: IncomingRequest[];
  initialConnections: DetailedConnection[];
}

export function ConnectionsClientPage({
  currentUser,
  initialIncomingRequests,
  initialConnections
}: ConnectionsClientPageProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [incomingRequests, setIncomingRequests] = React.useState(initialIncomingRequests);
  const [connections, setConnections] = React.useState(initialConnections);
  const [loadingAction, setLoadingAction] = React.useState<{ type: 'accept' | 'decline' | 'remove' | 'chat'; id: string } | null>(null);

  const connectionsPath = '/connections';

  const handleAccept = (requestId: string) => {
    setLoadingAction({ type: 'accept', id: requestId });
    startTransition(async () => {
      let acceptedUser: IncomingRequest['requester'] | undefined;
      try {
         acceptedUser = incomingRequests.find(req => req.id === requestId)?.requester;
         setIncomingRequests(prev => prev.filter(req => req.id !== requestId));

         const result = await acceptConnectionRequest(requestId);
         if (result.success) {
          toast({ title: 'Success', description: 'Connection accepted!' });

           if (acceptedUser) {
              const newConnectedUser: DetailedConnection['connectedUser'] = {
                id: acceptedUser.id,
                username: acceptedUser.username,
                firstName: acceptedUser.firstName ?? '',
                lastName: acceptedUser.lastName ?? '',
                profilePicture: acceptedUser.profilePicture,
                headline: acceptedUser.headline
              };
              const newConnection: DetailedConnection = {
                 userOneId: currentUser.id < acceptedUser.id ? currentUser.id : acceptedUser.id,
                 userTwoId: currentUser.id < acceptedUser.id ? acceptedUser.id : currentUser.id,
                 createdAt: new Date(),
                 connectedUser: newConnectedUser
              };
              setConnections(prev => [newConnection, ...prev]);
           }
        } else {
           toast({ title: 'Error', description: result.error || 'Failed to accept request.', variant: 'destructive' });
            setIncomingRequests(initialIncomingRequests);
        }
      } catch (err) {
        console.error('Accept request failed:', err);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        setIncomingRequests(initialIncomingRequests);
      } finally {
        setLoadingAction(null);
      }
    });
  };

  const handleDecline = (requestId: string) => {
    setLoadingAction({ type: 'decline', id: requestId });
    const originalRequests = incomingRequests;
    setIncomingRequests(prev => prev.filter(req => req.id !== requestId));

    startTransition(async () => {
      try {
        const result = await rejectOrWithdrawConnectionRequest(requestId);
        if (result.success) {
          toast({ title: 'Success', description: 'Connection declined.' });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to decline request.', variant: 'destructive' });
          setIncomingRequests(originalRequests);
        }
      } catch (err) {
        console.error('Decline request failed:', err);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
         setIncomingRequests(originalRequests);
      } finally {
        setLoadingAction(null);
      }
    });
  };

  const handleRemove = (connectionUserId: string) => {
    setLoadingAction({ type: 'remove', id: connectionUserId });
    const originalConnections = connections;
    setConnections(prev => prev.filter(conn => conn.connectedUser.id !== connectionUserId));

    startTransition(async () => {
        try {
            const result = await removeConnection(connectionUserId, connectionsPath);
            if (result.success) {
                toast({ title: 'Success', description: 'Connection removed.' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to remove connection.', variant: 'destructive' });
                setConnections(originalConnections);
            }
        } catch (err) {
            console.error('Remove connection failed:', err);
            toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
            setConnections(originalConnections);
        } finally {
            setLoadingAction(null);
        }
    });
  };

  const handleStartChat = (otherUserId: string) => {
    setLoadingAction({ type: 'chat', id: otherUserId });
    startTransition(async () => {
        try {
            const result = await getOrCreateDmChannel(otherUserId);
            if (result.channelId) {
                router.push(`/chat/${result.channelId}`);
            } else {
                toast({ title: 'Error', description: result.error || 'Could not start chat.', variant: 'destructive' });
            }
        } catch (err) {
            console.error('Start chat failed:', err);
            toast({ title: 'Error', description: 'An unexpected error occurred while starting chat.', variant: 'destructive' });
        } finally {
            setLoadingAction(null);
        }
    });
  }

  const getInitials = (firstName?: string | null, lastName?: string | null): string => {
      const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
      const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
      return `${firstInitial}${lastInitial}` || '??'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Incoming Requests Section */}
      <div className="md:col-span-1">
        <Card className={''}>
          <CardHeader className={''}>
            <CardTitle className={''}>Pending Invitations ({incomingRequests.length})</CardTitle>
            <CardDescription className={''}>Accept or decline connection requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomingRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            )}
            {incomingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage className="" src={req.requester.profilePicture || undefined} alt={req.requester.firstName || 'User'} />
                    <AvatarFallback className="">{getInitials(req.requester.firstName, req.requester.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/${req.requester.username || '#'}`} className="text-sm font-medium hover:underline">
                        {req.requester.firstName} {req.requester.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{req.requester.headline || 'New connection request'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAccept(req.id)}
                    disabled={loadingAction?.id === req.id}
                    aria-label="Accept request"
                  >
                    {loadingAction?.id === req.id && loadingAction?.type === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                          disabled={loadingAction?.id === req.id}
                          aria-label="Decline request"
                       >
                        {loadingAction?.id === req.id && loadingAction?.type === 'decline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className={''}>
                      <AlertDialogHeader className={''}>
                        <AlertDialogTitle className={''}>Decline Connection Request?</AlertDialogTitle>
                        <AlertDialogDescription className="">
                          Are you sure you want to reject {req.requester.firstName}&apos;s connection request?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className={''}>
                        <AlertDialogCancel className={''}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDecline(req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Decline
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Connections Section */}
      <div className="md:col-span-2">
         <Card className="">
           <CardHeader className="">
             <CardTitle className="">Your Connections ({connections.length})</CardTitle>
             <CardDescription className="">People in your network.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-3">
             {connections.length === 0 && (
                 <p className="text-sm text-muted-foreground">You haven&apos;t made any connections yet.</p>
             )}
             {connections.map((conn) => (
               <div key={conn.connectedUser.id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage className="" src={conn.connectedUser.profilePicture || undefined} alt={conn.connectedUser.firstName || 'User'} />
                      <AvatarFallback className="">{getInitials(conn.connectedUser.firstName, conn.connectedUser.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/${conn.connectedUser.username || '#'}`} className="text-sm font-medium hover:underline">
                        {conn.connectedUser.firstName} {conn.connectedUser.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{conn.connectedUser.headline || '-'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartChat(conn.connectedUser.id)}
                      disabled={loadingAction?.id === conn.connectedUser.id}
                      aria-label="Send message"
                    >
                      {loadingAction?.id === conn.connectedUser.id && loadingAction?.type === 'chat' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                           variant="outline"
                           size="icon"
                           className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                           disabled={loadingAction?.id === conn.connectedUser.id}
                           aria-label="Remove connection"
                          >
                           {loadingAction?.id === conn.connectedUser.id && loadingAction?.type === 'remove' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={''}>
                        <AlertDialogHeader className="">
                                                    <AlertDialogTitle className="">Remove Connection?</AlertDialogTitle>
                          <AlertDialogDescription className="">
                            Are you sure you want to remove {conn.connectedUser.firstName} {conn.connectedUser.lastName} from your connections?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="">
                          <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(conn.connectedUser.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                             Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
               </div>
             ))}
           </CardContent>
         </Card>
      </div>
    </div>
  );
} 