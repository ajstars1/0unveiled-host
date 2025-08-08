'use client'

import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Check, X, ChevronRight, Loader2 } from "lucide-react" // Icons

import type { DashboardData } from "@/data/dashboard"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { acceptConnectionRequest, rejectOrWithdrawConnectionRequest } from "@/actions/profileActions" // Import actions
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils" // Import cn

// Define the props interface
interface ConnectionRequestsCardProps {
  requests: DashboardData['connectionRequestsReceived'];
}

// Helper to get user initials for avatar fallback
const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.[0] || ''
  const last = lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'U' // Default to 'U' if no names
}


export function ConnectionRequestsCard({ requests }: ConnectionRequestsCardProps) {
   const queryClient = useQueryClient();

   // Mutation for accepting a request
   const { mutate: acceptMutate, isPending: isAccepting } = useMutation({
       mutationFn: acceptConnectionRequest, // Pass the server action
       onSuccess: (data) => {
           if (data.success) {
               toast({ title: "Success", description: "Connection accepted!" });
               // Invalidate queries to refresh dashboard and connection data
               queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
               queryClient.invalidateQueries({ queryKey: ['connectionRequests'] }); // Example key
               queryClient.invalidateQueries({ queryKey: ['connectionsList'] }); // Example key
           } else {
               toast({ title: "Error", description: data.error || "Failed to accept connection.", variant: "destructive" });
           }
       },
       onError: (error) => {
           toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
       },
   });

    // Mutation for rejecting a request
   const { mutate: rejectMutate, isPending: isRejecting } = useMutation({
       mutationFn: rejectOrWithdrawConnectionRequest, // Pass the server action
       onSuccess: (data) => {
           if (data.success) {
               toast({ title: "Success", description: "Connection request rejected." });
               // Invalidate queries
               queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
               queryClient.invalidateQueries({ queryKey: ['connectionRequests'] }); // Example key
           } else {
               toast({ title: "Error", description: data.error || "Failed to reject connection.", variant: "destructive" });
           }
       },
       onError: (error) => {
           toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
       },
   });

    const handleAccept = (requestId: string) => {
      acceptMutate(requestId);
    }
    const handleReject = (requestId: string) => {
      rejectMutate(requestId);
    }

    // Disable buttons if either mutation is pending
    const isProcessing = isAccepting || isRejecting;

  return (
    <Card className="">
      <CardHeader className="">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <CardTitle className="">Connection Requests</CardTitle>
            </div>
             <Button size="default" variant="ghost" className="" asChild>
                 {/* Link to the full connections management page */}
                <Link href="/connections">
                     Manage Connections
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
             </Button>
         </div>
         <CardDescription className="">
             {requests.length > 0
                 ? `You have ${requests.length} pending connection request(s).`
                 : "Manage your professional network."
             }
         </CardDescription>
      </CardHeader>
      <CardContent className="">
        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req, index) => {
              const initials = getInitials(req.requester.firstName, req.requester.lastName);
              return (
                  <div 
                     key={req.id} 
                     className={cn(
                        "flex items-center justify-between gap-3 p-3", 
                        index < requests.length - 1 && "border-b" // Add border unless it's the last item
                     )}
                   >
                      <div className="flex items-center gap-3 grow overflow-hidden">
                          <Avatar className="h-10 w-10 border shrink-0">
                              <AvatarImage className="" src={req.requester.profilePicture || undefined} alt={req.requester.username || "Requester avatar"} />
                              <AvatarFallback className="">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="grow overflow-hidden">
                              <Link href={`/${req.requester.username}`} className="hover:underline">
                                 <p className="text-sm font-medium truncate" title={`${req.requester.firstName || ''} ${req.requester.lastName || ''} (@${req.requester.username || '-'})`}>
                                      {req.requester.firstName || "Unknown"} {req.requester.lastName || ""}
                                      <span className="text-xs text-muted-foreground ml-1">@{req.requester.username || "-"}</span>
                                  </p>
                              </Link>
                              <p className="text-xs text-muted-foreground truncate" title={req.requester.headline || undefined}>
                                  {req.requester.headline || <span className="italic">No headline</span>}
                              </p>
                          </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                          <Button 
                             size="icon" 
                             variant="outline" 
                             className="h-8 w-8" 
                             onClick={() => handleReject(req.id)} 
                             title="Reject"
                             disabled={isProcessing}
                          >
                              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </Button>
                          <Button 
                             size="icon" 
                             variant="default" 
                             className="h-8 w-8" 
                             onClick={() => handleAccept(req.id)} 
                             title="Accept"
                             disabled={isProcessing}
                          >
                              {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                      </div>
                  </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-[100px] flex-col items-center justify-center text-center text-sm text-muted-foreground border rounded-md">
             <UserPlus className="h-8 w-8 mb-2 text-muted-foreground/50" />
             <p>No pending connection requests.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 