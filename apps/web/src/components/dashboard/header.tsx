"use client"

import * as React from 'react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Bell, Menu, Search, Settings as SettingsIcon, User as UserIcon, LogOut, LayoutDashboard, FolderKanban, Share2, MessageCircle, HomeIcon, Settings, Users, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { UserProfileDetails } from "@/data/user"
import type { Notification, notificationTypeEnum } from "@0unveiled/database"
// Derive the NotificationType type from the enum
type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
import { logout } from "@/actions/auth"
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { startTransition } from 'react'
import { NotificationDropdown } from "./notification-dropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getNotificationSummaryForClient, getUnreadNotificationCount } from '@/actions/notifications'
import { getIncomingConnectionRequestSummaryForClient } from '@/data/user'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { SidebarMenuButton } from "./sidebar/sidebar-menu-button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface HeaderProps {
  user: NonNullable<UserProfileDetails>;
  initialNotificationCount: number;
  initialNotifications: Notification[];
}

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
  return `${firstInitial}${lastInitial}` || 'U'
}

// Helper function to capitalize
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Function to generate breadcrumb items from pathname
const generateBreadcrumbs = (pathname: string) => {
  const pathSegments = pathname.split('/').filter(Boolean); // Removes empty strings
  const breadcrumbItems = [{ label: "Dashboard", href: "/dashboard" }];
  let currentPath = '/dashboard';

  if (pathSegments[0] !== 'dashboard') {
    // Should not happen if called within the dashboard layout
    return breadcrumbItems;
  }

  for (let i = 1; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const nextSegment = pathSegments[i + 1];
    currentPath += `/${segment}`;

    // Regex for CUID or UUID
    const isCurrentSegmentId = /^[a-z0-9]{25}$/i.test(segment) || /^[^/]{8}-?[^/]{4}-?[^/]{4}-?[^/]{4}-?[^/]{12}$/i.test(segment);

    // --- Project Specific Logic --- 
    if (pathSegments[i-1] === 'projects' && isCurrentSegmentId) {
        // Current segment is a project ID
        const projectDetailLabel = "Project Details";
        // Add the generic label
        breadcrumbItems.push({ label: projectDetailLabel, href: currentPath });
        
        // Check if the *next* segment is 'edit'
        if (nextSegment === 'edit') {
            // Add 'Edit' segment and stop
            currentPath += '/edit';
            breadcrumbItems.push({ label: "Edit", href: currentPath });
            i++; // Skip the 'edit' segment in the next iteration
        }
        // Otherwise, we are on the project detail page, continue to next segment (if any) or finish
        continue; // Move to the next segment processing
    }
    // --- End Project Specific Logic ---

    if (segment === 'chat') {
      const isPotentialId = nextSegment && (/^[a-z0-9]{25}$/i.test(nextSegment) || /^[^/]{8}-?[^/]{4}-?[^/]{4}-?[^/]{4}-?[^/]{12}$/i.test(nextSegment));
      if (isPotentialId) {
          // Current segment is 'chat' and the next one looks like an ID
          breadcrumbItems.push({ label: capitalize(segment), href: currentPath });
          // Add the final generic "Direct Message" part
          currentPath += `/${nextSegment}`;
          breadcrumbItems.push({ label: "Direct Message", href: currentPath });
          i++; // Skip the ID segment in the next iteration
      } else {
          // It's the chat list page (/dashboard/chat)
          breadcrumbItems.push({ label: capitalize(segment), href: currentPath });
      }
      continue; // Handled chat segment
    }
    
    // Skip adding breadcrumbs for general ID segments or 'edit' segments (handled above)
    if (isCurrentSegmentId || segment === 'edit') {
       continue; 
    }
    
    // Regular segment
    breadcrumbItems.push({
      label: capitalize(segment.replace(/-/g, ' ')),
      href: currentPath,
    });
  }

  return breadcrumbItems;
};

// Function to extract channelId from notification linkUrl
const getChannelIdFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    // Corrected regex to match /chat/[channelId]
    const match = url.match(/\/dashboard\/chat\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
};

export function Header({ user, initialNotificationCount, initialNotifications }: HeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  // Extract active channel ID from current pathname
  const activeChatChannelId = React.useMemo(() => {
      // Corrected regex to match /chat/[channelId]
      const match = pathname.match(/\/dashboard\/chat\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
  }, [pathname]);

  // Query for TOTAL Notification Count (for Badge)
  const { data: countData, isLoading: isLoadingCount } = useQuery({
    queryKey: ['notificationCount', user.id],
    queryFn: async () => {
      const count = await getUnreadNotificationCount();
      return count; 
    },
    initialData: initialNotificationCount, 
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, 
    enabled: !!user?.id,
  });

  // Query for RECENT Notifications (for Dropdown)
  const { data: recentNotificationsResult, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recentNotifications', user.id], // Use distinct key
    queryFn: async () => {
      const summary = await getNotificationSummaryForClient(5);
      // Make sure to return the correct structure or default
      return summary?.notifications ?? []; // Ensure it always returns an array
    },
    initialData: initialNotifications, // Use the prop for initial dropdown data
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    enabled: !!user?.id,
  });

  // Filter the RECENT notifications for the dropdown display
  const displayNotifications = React.useMemo(() => {
      if (!recentNotificationsResult) return [];
      return recentNotificationsResult.filter(notification => {
          if (notification.type === "NEW_MESSAGE" && activeChatChannelId) {
              const notificationChannelId = getChannelIdFromUrl(notification.linkUrl);
              if (notificationChannelId === activeChatChannelId) {
                  return false; // Filter out this notification
              }
          }
          return true; // Keep other notifications
      });
  }, [recentNotificationsResult, activeChatChannelId]);

  // Use the count from the query for the badge
  const displayNotificationCount = !isLoadingCount && countData !== undefined 
                                    ? countData 
                                    : initialNotificationCount;

  // Get connection count (needed for badge in sidebar links)
  const { data: connectionRequestData, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connectionRequests', 'incomingSummary', user.id],
    queryFn: async () => {
      const summary = await getIncomingConnectionRequestSummaryForClient();
      return summary || { count: 0 };
    },
    refetchInterval: 60000 * 2, 
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, 
    enabled: !!user?.id, 
  });
  const incomingRequestCount = connectionRequestData?.count ?? 0;

  // Define sidebar links data (copied from app-sidebar)
 
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
  // Logout handler (copied from app-sidebar)
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

  // Generate breadcrumbs dynamically
  const breadcrumbItems = React.useMemo(() => generateBreadcrumbs(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">

      {/* Mobile Sidebar Toggle (using Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 flex flex-col">
           {/* --- Replicated Sidebar Content --- */}
           {/* No TooltipProvider needed here */}
            <div className="flex flex-col justify-between flex-1">
              <div className="flex flex-col gap-4 py-4 overflow-y-auto">
                {/* Logo */}
                <div className="px-3">
                    <Link href="/dashboard" className="flex items-center gap-2 h-10 mb-2 px-2 justify-start">
                        <Image
                            src="/abstrack_logo_light.svg"
                            alt="0Unveiled Logo"
                            width={24}
                            height={24}
                            className="shrink-0"
                            priority
                        />
                        <span className="font-semibold text-lg whitespace-nowrap">0Unveiled</span>
                    </Link>
                </div>
                {/* Navigation Links */}
                <ScrollArea className="flex-1 px-3">
                    <nav className="flex flex-col gap-1">
                    {sidebarLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                            <SidebarMenuButton
                                href={link.href}
                                label={link.label}
                                icon={link.icon}
                                isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')} 
                                isExpanded={true}
                                badgeCount={link.badgeCount}
                                isLoadingBadge={link.isLoading}
                            />
                        </SheetClose>
                    ))}
                    </nav>
                </ScrollArea>
              </div>

              {/* Footer - User Info & Logout */}
              <div className="py-4 px-2 border-t">
                 <SheetClose asChild>
                      <SidebarMenuButton
                        href={`/${user.username}`}
                        label={`${user.firstName} ${user.lastName || ''}`.trim()}
                        isExpanded={true}
                        isActive={pathname === `/${user.username}`}
                        customIcon={
                        <Avatar className="h-7 w-7"> 
                            <AvatarImage src={user.profilePicture ?? undefined} alt={user.firstName || 'User'} />
                            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                        </Avatar>
                        }
                      />
                  </SheetClose>
                  <SidebarMenuButton
                    label="Logout"
                    icon={LogOut}
                    isExpanded={true}
                    onClick={handleLogout}
                    className="mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                  />
              </div>
            </div>
           {/* --- End Replicated Sidebar Content --- */}
        </SheetContent>
      </Sheet>

       {/* Desktop Sidebar Trigger & Breadcrumbs */}
       <div className="hidden md:flex items-center gap-2 min-w-0 shrink-0">
         <SidebarTrigger className="-ml-1 shrink-0" />
         <Separator orientation="vertical" className="h-6 shrink-0" />
        <Breadcrumb className="overflow-hidden whitespace-nowrap">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.href || index}>
                <BreadcrumbItem>
                  {index === breadcrumbItems.length - 1 ? (
                    <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href!}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Combined Search and Right-side Icons */}
      <div className="flex items-center gap-4 ml-auto">
         {/* Search */}
         <div className="relative flex-1 max-w-xs lg:max-w-sm">
            <Search 
              className={cn(
                "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-opacity",
                isSearchOpen ? "opacity-100" : "opacity-0 md:opacity-100"
              )} 
            />
            {/* Desktop Input */}
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full hidden md:block"
            />
            {/* Mobile Search - Toggle Button */}
             <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden rounded-full"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
             >
                 <Search className="h-5 w-5" />
                 <span className="sr-only">Search</span>
             </Button>
             {/* Mobile Search Input - Absolutely positioned */} 
              {isSearchOpen && (
                 <Input
                   type="search"
                   placeholder="Search..."
                   className="absolute right-0 top-full mt-2 w-60 z-50 md:hidden pl-8"
                   autoFocus
                   onBlur={() => setIsSearchOpen(false)}
                 />
               )}
         </div>

        {/* Notification Dropdown - Wrap with DropdownMenu and Trigger */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {/* Optionally show a badge for unread count */}
                {displayNotificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                        {displayNotificationCount}
                    </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            {/* Pass props down to the content component */}
            <NotificationDropdown
              userId={user.id}
              notifications={displayNotifications}
            />
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profilePicture ?? undefined} alt={user.firstName || 'User'} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{`${user.firstName} ${user.lastName || ''}`.trim()}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/${user.username}`}> 
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/profile/edit'> 
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/chat">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Chats</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
