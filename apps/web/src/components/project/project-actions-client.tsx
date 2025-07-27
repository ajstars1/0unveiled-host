"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { becomeProjectLeader } from "@/actions/projectActions";
import { ApplyRoleDialog } from "@/components/project/ApplyRoleDialog"; // Ensure this path is correct
import type { ProjectRole } from "@prisma/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface ProjectActionsClientProps {
  projectId: string;
  projectTitle: string;
  currentUserId: string | null | undefined;
  isOwner: boolean;
  isMember: boolean;
  isProjectClaimable: boolean;
  openRoles: Array<ProjectRole & { requiredSkills: Array<{ id: string; name: string }> }>; // Matching ProjectDetail page type
  isUserLoggedIn: boolean;
}

export default function ProjectActionsClient({
  projectId,
  projectTitle,
  currentUserId,
  isOwner,
  isMember,
  isProjectClaimable,
  openRoles,
  isUserLoggedIn
}: ProjectActionsClientProps) {
  const [isClaimingLeadership, setIsClaimingLeadership] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility

  const handleClaimLeadership = async () => {
    setIsClaimingLeadership(true);
    try {
      const result = await becomeProjectLeader(projectId);
      if (result.success) {
        toast({ title: "Success!", description: result.success, variant: "default" });
        // Revalidation in action should trigger UI update. 
        // Consider router.refresh() if immediate UI changes are not visible.
      } else {
        toast({ title: "Error", description: result.error || "Could not claim leadership.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred while claiming leadership.", variant: "destructive" });
    } finally {
      setIsClaimingLeadership(false);
      setIsDialogOpen(false); 
    }
  };

  if (isOwner) {
    return null; // Owner doesn't need these actions directly here, edit button is separate
  }

  if (isProjectClaimable && !isMember) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto" onClick={() => setIsDialogOpen(true)}>
            {isClaimingLeadership ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              "Become Project Leader"
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-50">Confirm Leadership Claim</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              Are you sure you want to become the project leader? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="default"
                className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 mt-2 mr-2"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleClaimLeadership}
              className="mt-2"
              disabled={isClaimingLeadership}
            >
              {isClaimingLeadership ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show ApplyRoleDialog if not claimable by current user, user is not a member, and there are open roles.
  if (!isProjectClaimable && !isMember && openRoles && openRoles.length > 0) {
    return (
      <ApplyRoleDialog
        projectId={projectId}
        projectTitle={projectTitle}
        // Pass only the necessary role details or ensure ApplyRoleDialog handles the full openRoles structure
        // For simplicity, if ApplyRoleDialog expects a simpler roles array, map it here.
        // openRoles={openRoles} // Assuming ApplyRoleDialog can handle this structure
        roleId={openRoles[0]?.id || ''} // Example: needs adjustment based on ApplyRoleDialog
        roleTitle={openRoles[0]?.title || ''} // Example: needs adjustment
        isUserLoggedIn={isUserLoggedIn}
      />
    );
  }
  
  // Can also be shown as a call to action if no roles and project is claimable
  if (isProjectClaimable && !isMember && (!openRoles || openRoles.length === 0)) {
     return (
        <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-muted-foreground mb-2">
                This admin-seeded project has no defined roles yet.
            </p>
            <Button onClick={handleClaimLeadership} disabled={isClaimingLeadership} variant="default" size="sm">
                {isClaimingLeadership ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                "Become Project Leader to Define Roles"
                )}
            </Button>
        </div>
     );
  }

  return null; // No specific action button to show for other cases (e.g., user is already a member but not leader)
}

// Note: The ApplyRoleDialog props (roleId, roleTitle) in the above example 
// are simplified. You'll need to adjust how you pass roles to it or how 
// ApplyRoleDialog consumes them if it's designed to pick a specific role or show a list.
// If ApplyRoleDialog is meant to allow applying to ANY of the open roles, 
// you might pass the whole `openRoles` array to it and let it handle the selection.