"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Settings, Bell, FolderKanban, UserCircle, LogOut,
  Share2,
  MessageCircle,
  HomeIcon, // Added for Connections
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button'
import type { UserProfileDetails } from "@/data/user"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarMenuButton } from "@/components/dashboard/sidebar/sidebar-menu-button"
import { useSidebar } from "@/components/ui/sidebar"
import { logout } from "@/actions/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'
// Import useQuery and the action
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getIncomingConnectionRequestSummaryForClient } from '@/data/user'
import { Badge } from "@/components/ui/badge" // Import Badge
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea

interface AppSidebarProps {
  user: NonNullable<UserProfileDetails>;
}

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
  return `${firstInitial}${lastInitial}` || 'U'
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { open: isExpanded } = useSidebar()
  const pathname = usePathname()
  const { toast } = useToast()
  const router = useRouter()

  // --- TanStack Query for Connection Request Count ---
  const { data: connectionRequestData, isLoading: isLoadingConnections } = useQuery({
    // Query key specific to incoming requests for this user
    queryKey: ['connectionRequests', 'incomingSummary', user.id],
    queryFn: async () => {
      const summary = await getIncomingConnectionRequestSummaryForClient();
      // Default to 0 count if fetch fails or user logs out
      return summary || { count: 0 };
    },
    // No initialData needed for this simple count display, but could be added
    refetchInterval: 60000 * 2, // Refetch every 2 minutes (adjust as needed)
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, // Keep showing old count while refetching
    enabled: !!user?.id, // Only run if user is logged in
  });

  const incomingRequestCount = connectionRequestData?.count ?? 0;
  // --- End TanStack Query ---

  const sidebarLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },

    // Home link
    { href: '/profiles', label: 'Meet New People', icon: Users },
    { href: '/projects', label:'Explore Projects', icon: MessageCircle },
    // Update the Connections link
    {
      href: '/dashboard/connections', label: 'Connections', icon: Share2,
      badgeCount: incomingRequestCount, // Add badge count
      isLoading: isLoadingConnections, // Add loading state
    },
    // { href: '/dashboard/teams', label: 'Teams', icon: Users }, // Optional
    { href: `/dashboard/chat`, label: 'Chats', icon: MessageCircle }, // Corrected href
    { href: `/dashboard/notifications`, label: 'Notifications', icon: Bell }, // Corrected href
    { href: `/dashboard/settings`, label: 'Settings', icon: Settings }, // Corrected href
  ];

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        const result = await logout()
        if (result.error) {
          toast({ title: "Logout Failed", description: result.error, variant: "destructive" })
        } else {
          toast({ title: "Logged Out", description: "You have been successfully logged out." })
          router.push('/')
          router.refresh()
        }
      } catch (err) {
        toast({ title: "Logout Error", description: "An unexpected error occurred.", variant: "destructive" })
        console.error("Logout Error:", err)
      }
    });
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "hidden md:flex flex-col justify-between border-r transition-all duration-300 ease-in-out",
        isExpanded ? "w-60 px-3" : "w-[70px] items-center px-1"
      )}>
        <div className="flex flex-col gap-4 py-4">
          {/* Logo or Title */}
          <Link href="/" className={cn(
            "flex items-center gap-2 h-10 mb-2",
             isExpanded ? "px-2 justify-start" : "justify-center"
          )}>
              <Image
                src="/abstrack_logo_light.svg"
                alt="0Unveiled Logo"
                width={24}
                height={24}
                className="shrink-0"
                priority
              />
              {isExpanded && <span className="font-semibold text-lg whitespace-nowrap">0Unveiled</span>}
          </Link>

          {/* Wrap navigation in ScrollArea */}
          <ScrollArea className="flex-1">
            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              {sidebarLinks.map((link) => (
                <SidebarMenuButton
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')} // More robust active check
                  isExpanded={isExpanded}
                  // Pass badge props
                  badgeCount={link.badgeCount}
                  isLoadingBadge={link.isLoading}
                />
              ))}
            </nav>
          </ScrollArea>
        </div>

        {/* Footer - User Info & Logout */}
        <div className="py-4 px-2">
          <SidebarMenuButton
            href={`/${user.username}`}
            label={`${user.firstName} ${user.lastName || ''}`.trim()}
            isExpanded={isExpanded}
            isActive={pathname === `/${user.username}`}
            customIcon={
              <Avatar className="h-7 w-7"> 
                <AvatarImage className="" src={user.profilePicture ?? undefined} alt={user.firstName || 'User'} />
                <AvatarFallback className="">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
            }
          />
          <SidebarMenuButton
            label="Logout"
            icon={LogOut}
            isExpanded={isExpanded}
            onClick={handleLogout}
            className="mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
