'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConnectionStatus } from "@/data/user"
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectOrWithdrawConnectionRequest,
  removeConnection
} from '@/actions/profileActions'
import { UserPlus, UserCheck, UserX, MessageSquare, Clock, Loader2, Trash2, MoreVertical, LogOut, Share2, AlertTriangle } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { startTransition } from 'react'
import { getOrCreateDmChannel } from '@/actions/chat'
import { createClient } from "@/lib/supabase/client"

// Constants for better maintainability
const CONNECTION_MESSAGES = {
  REQUEST_SENT: 'Connection request sent!',
  REQUEST_ACCEPTED: 'Connection accepted!',
  REQUEST_DECLINED: 'Request declined.',
  REQUEST_CANCELLED: 'Request cancelled.',
  CONNECTION_REMOVED: 'Connection removed.',
  CHAT_ERROR: 'Could not start chat.',
  SHARE_SUCCESS: 'Profile link copied to clipboard.',
  SHARE_ERROR: 'Could not share or copy the profile link.',
  REPORT_TODO: 'This functionality is not yet implemented.',
  GENERIC_ERROR: 'An unexpected error occurred.',
} as const;

const CONNECTION_PATHS = {
  DASHBOARD: '/connections',
} as const;

interface ProfileActionsProps {
  profileUserId: string
  initialConnectionStatus: ConnectionStatus
  initialConnectionRequestId?: string | null
  profileUsername: string
  isUserLoggedIn: boolean
}

export const ProfileActions = React.memo(function ProfileActions({ 
  profileUserId, 
  initialConnectionStatus,
  initialConnectionRequestId,
  profileUsername,
  isUserLoggedIn,
}: ProfileActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [connectionStatus, setConnectionStatus] = React.useState(initialConnectionStatus)
  const [connectionRequestId, setConnectionRequestId] = React.useState(initialConnectionRequestId)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingAction, setLoadingAction] = React.useState<{ type: 'accept' | 'decline' | 'remove' | 'chat'; id: string } | null>(null);
  const [actionType, setActionType] = React.useState<'connect' | 'accept' | 'decline' | 'cancel' | 'remove' | null>(null);

  const handleConnect = async () => {
    // Check authentication client-side
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const callbackUrl = window.location.pathname;
      router.push(`/login?callback=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    setIsLoading(true);
    setActionType('connect');
    const originalStatus = connectionStatus;
    setConnectionStatus('PENDING_SENT');
    

    startTransition(async () => {
      try {
        const result = await sendConnectionRequest(profileUserId, profileUsername)
        if (result.success && result.status === 'PENDING') {
          toast({ title: 'Success', description: CONNECTION_MESSAGES.REQUEST_SENT })
          setConnectionRequestId(result.connectionRequestId || null);
        } else if (result.success) {
          toast({ title: 'Success', description: 'Request processed.' });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to send request.', variant: 'destructive' })
          setConnectionStatus(originalStatus);
        }
      } catch (err) {
        console.error('Connection request failed:', err)
        toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR, variant: 'destructive' })
        setConnectionStatus(originalStatus);
      } finally {
        setIsLoading(false);
        setActionType(null);
      }
    });
  }

  const handleAccept = () => {
    if (!isUserLoggedIn) {
      router.push('/login');
      return;
    }
    if (!connectionRequestId) return;
    setIsLoading(true);
    setActionType('accept');
    const originalStatus = connectionStatus;
    const originalRequestId = connectionRequestId;
    setConnectionStatus('CONNECTED');
    setConnectionRequestId(null);

    startTransition(async () => {
      try {
        const result = await acceptConnectionRequest(originalRequestId);
        if (result.success) {
          toast({ title: 'Success', description: CONNECTION_MESSAGES.REQUEST_ACCEPTED });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to accept request.', variant: 'destructive' });
          setConnectionStatus(originalStatus);
          setConnectionRequestId(originalRequestId);
        }
      } catch (err) {
        console.error('Accept request failed:', err);
        toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR, variant: 'destructive' });
        setConnectionStatus(originalStatus);
        setConnectionRequestId(originalRequestId);
      } finally {
        setIsLoading(false);
        setActionType(null);
      }
    });
  }

  const handleDecline = () => {
    if (!isUserLoggedIn) {
      router.push('/login');
      return;
    }
    if (!connectionRequestId) return;
    setIsLoading(true);
    setActionType('decline');
    const originalStatus = connectionStatus;
    const originalRequestId = connectionRequestId;
    setConnectionStatus('NOT_CONNECTED');
    setConnectionRequestId(null);

    startTransition(async () => {
      try {
        const result = await rejectOrWithdrawConnectionRequest(originalRequestId);
        if (result.success) {
          toast({ title: 'Success', description: CONNECTION_MESSAGES.REQUEST_DECLINED });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to decline request.', variant: 'destructive' });
          setConnectionStatus(originalStatus);
          setConnectionRequestId(originalRequestId);
        }
      } catch (err) {
        console.error('Decline request failed:', err);
        toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR, variant: 'destructive' });
        setConnectionStatus(originalStatus);
        setConnectionRequestId(originalRequestId);
      } finally {
        setIsLoading(false);
        setActionType(null);
      }
    });
  }

  const handleCancelRequest = () => {
    if (!isUserLoggedIn) {
      router.push('/login');
      return;
    }
    if (!connectionRequestId) return;
    setIsLoading(true);
    setActionType('cancel');
    const originalStatus = connectionStatus;
    const originalRequestId = connectionRequestId;
    setConnectionStatus('NOT_CONNECTED');
    setConnectionRequestId(null);

    startTransition(async () => {
      try {
        const result = await rejectOrWithdrawConnectionRequest(originalRequestId);
        if (result.success) {
          toast({ title: 'Success', description: CONNECTION_MESSAGES.REQUEST_CANCELLED });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to cancel request.', variant: 'destructive' });
          setConnectionStatus(originalStatus);
          setConnectionRequestId(originalRequestId);
        }
      } catch (err) {
        console.error('Cancel request failed:', err);
        toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR, variant: 'destructive' });
        setConnectionStatus(originalStatus);
        setConnectionRequestId(originalRequestId);
      } finally {
        setIsLoading(false);
        setActionType(null);
      }
    });
  }

  const handleRemoveConnection = () => {
    if (!isUserLoggedIn) {
      router.push('/login');
      return;
    }
    setIsLoading(true);
    setActionType('remove');
    const originalStatus = connectionStatus;
    setConnectionStatus('NOT_CONNECTED');
    setConnectionRequestId(null);

    startTransition(async () => {
      try {
        const result = await removeConnection(profileUserId, CONNECTION_PATHS.DASHBOARD);
        if (result.success) {
          toast({ title: 'Success', description: CONNECTION_MESSAGES.CONNECTION_REMOVED });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to remove connection.', variant: 'destructive' });
          setConnectionStatus(originalStatus);
        }
      } catch (err) {
        console.error('Remove connection failed:', err);
        toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR, variant: 'destructive' });
        setConnectionStatus(originalStatus);
      } finally {
        setIsLoading(false);
        setActionType(null);
      }
    });
  }
  
   const handleStartChat = (otherUserId: string) => {
    if (!isUserLoggedIn) {
      router.push('/login');
      return;
    }
    setLoadingAction({ type: 'chat', id: otherUserId });
    startTransition(async () => {
        try {
            const result = await getOrCreateDmChannel(otherUserId);
            if (result.channelId) {
                router.push(`/chat/${result.channelId}`);
            } else {
                toast({ title: 'Error', description: result.error || CONNECTION_MESSAGES.CHAT_ERROR, variant: 'destructive' });
            }
        } catch (err) {
            console.error('Start chat failed:', err);
            toast({ title: 'Error', description: CONNECTION_MESSAGES.GENERIC_ERROR + ' while starting chat.', variant: 'destructive' });
        } finally {
            setLoadingAction(null);
        }
    });
  }

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    const shareData = {
      title: `${profileUsername}'s Profile on 0Unveiled`,
      text: `Check out ${profileUsername}'s profile on 0Unveiled!`,
      url: profileUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: 'Profile Shared', description: 'Profile link shared successfully.' });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(profileUrl);
        toast({ title: 'Link Copied', description: CONNECTION_MESSAGES.SHARE_SUCCESS });
      }
    } catch (err) {
      console.error('Error sharing profile:', err);
      // Attempt clipboard copy as a final fallback if sharing failed
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast({ title: 'Link Copied', description: 'Sharing failed, link copied to clipboard.' });
      } catch (copyErr) {
        console.error('Error copying profile link:', copyErr);
        toast({ title: 'Error', description: CONNECTION_MESSAGES.SHARE_ERROR, variant: 'destructive' });
      }
    }
  };

  const handleReportUser = () => {
    // TODO: Implement actual report user logic (e.g., open a modal, send data to backend)
    toast({ title: 'Report User (TODO)', description: CONNECTION_MESSAGES.REPORT_TODO });
  };

  const renderDropdownContent = React.useCallback(() => (
    <DropdownMenuContent align="end" className="">
      <DropdownMenuItem inset onClick={handleShareProfile} className="cursor-pointer">
        <Share2 className="mr-2 h-4 w-4" /> Share Profile
      </DropdownMenuItem>

      {connectionStatus === 'PENDING_SENT' && (
         <AlertDialog>
           <AlertDialogTrigger asChild>
             <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer" inset>
               <LogOut className="mr-2 h-4 w-4"/> Cancel Request
             </DropdownMenuItem>
           </AlertDialogTrigger>
           <AlertDialogContent className={''}>
             <AlertDialogHeader className={''}>
               <AlertDialogTitle className={''}>Cancel Connection Request?</AlertDialogTitle>
               <AlertDialogDescription className={''}>
                 Are you sure you want to cancel your connection request?
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter className={''}>
               <AlertDialogCancel className={''}>Keep Request</AlertDialogCancel>
               <AlertDialogAction onClick={handleCancelRequest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Cancel Request</AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
      )}

      {connectionStatus === 'CONNECTED' && (
         <AlertDialog>
           <AlertDialogTrigger asChild>
             <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer" inset>
               <Trash2 className="mr-2 h-4 w-4"/> Remove Connection
             </DropdownMenuItem>
           </AlertDialogTrigger>
           <AlertDialogContent className="">
             <AlertDialogHeader className="">
               <AlertDialogTitle className="">Remove Connection?</AlertDialogTitle>
               <AlertDialogDescription className="">
                 Are you sure you want to remove this connection?
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter className="">
               <AlertDialogCancel className="">Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={handleRemoveConnection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
      )}

      {(connectionStatus === 'PENDING_SENT' || connectionStatus === 'CONNECTED') && <DropdownMenuSeparator className="my-1" />}

      <DropdownMenuItem onClick={handleReportUser} className="text-destructive focus:text-destructive cursor-pointer">
        <AlertTriangle className="mr-2 h-4 w-4" /> Report User (TODO)
      </DropdownMenuItem>
    </DropdownMenuContent>
  ), [connectionStatus, handleCancelRequest, handleRemoveConnection, handleShareProfile, handleReportUser]);

  switch (connectionStatus) {
    case 'NOT_CONNECTED':
      return (
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="" onClick={handleConnect} disabled={isLoading} aria-label="Send connection request">
            {isLoading && actionType === 'connect' ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true"/>
            ) : (
              <UserPlus className="h-4 w-4 mr-1.5" aria-hidden="true"/>
            )}
            {isLoading && actionType === 'connect' ? 'Sending...' : 'Connect'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
                <MoreVertical className="h-4 w-4" aria-hidden="true"/>
              </Button>
            </DropdownMenuTrigger>
            {renderDropdownContent()}
          </DropdownMenu>
        </div>
      )
    case 'PENDING_SENT':
      return (
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="" disabled={true} aria-label="Connection request pending">
            <Clock className="h-4 w-4 mr-1.5" aria-hidden="true"/>
            Pending
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading && actionType === 'cancel'} aria-label="More options">
                {isLoading && actionType === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <MoreVertical className="h-4 w-4" aria-hidden="true"/>}
              </Button>
            </DropdownMenuTrigger>
            {renderDropdownContent()}
          </DropdownMenu>
        </div>
      )
    case 'PENDING_RECEIVED':
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="" onClick={handleAccept} disabled={isLoading} aria-label="Accept connection request">
            {isLoading && actionType === 'accept' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true"/> : <UserCheck className="h-4 w-4 mr-1.5" aria-hidden="true"/>}
            Accept
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="" disabled={isLoading} aria-label="Decline connection request">
                {isLoading && actionType === 'decline' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true"/> : <UserX className="h-4 w-4 mr-1.5" aria-hidden="true"/>}
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="">
              <AlertDialogHeader className="">
                <AlertDialogTitle className="">Decline Connection Request?</AlertDialogTitle>
                <AlertDialogDescription className="">
                  Are you sure you want to decline this connection request?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="">
                <AlertDialogCancel className="">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDecline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Decline</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    case 'CONNECTED':
      return (
        <div className="flex gap-2 items-center">
          <Button size="sm" className="" variant="outline" onClick={() => handleStartChat(profileUserId)}
                      disabled={loadingAction?.id === profileUserId}
                      aria-label="Send message"
                    >
                      {loadingAction?.id === profileUserId && loadingAction?.type === 'chat' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <MessageSquare className="h-4 w-4" aria-hidden="true"/>}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading && actionType === 'remove'} aria-label="More options">
                 {isLoading && actionType === 'remove' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <MoreVertical className="h-4 w-4" aria-hidden="true"/>}
              </Button>
            </DropdownMenuTrigger>
            {renderDropdownContent()}
          </DropdownMenu>
        </div>
      )
    case 'SELF':
      return null
    default:
      console.warn('Unhandled connection status:', connectionStatus);
      return null;
  }
}); 