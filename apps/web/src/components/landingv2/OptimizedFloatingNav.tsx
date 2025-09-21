"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, DollarSign, LogIn, Sparkles, Bell, User, Settings, LogOut, MessageCircle, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User as DatabaseUser, Notification } from "@0unveiled/database";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getUnreadNotificationCount, getRecentNotifications } from '@/actions/optimized-notifications';
import { useNotificationPreloader } from '@/hooks/use-notification-performance';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { OptimizedNotificationDropdown } from "@/components/dashboard/optimized-notification-dropdown";
import { useDeviceDetection } from '@/hooks/use-device-detection';

interface OptimizedFloatingNavProps {
  userId: string;
  initialUser: DatabaseUser | null;
  initialNotificationCount: number;
  initialRecentNotifications: Notification[];
}

export function OptimizedFloatingNav({ 
  userId, 
  initialUser, 
  initialNotificationCount, 
  initialRecentNotifications 
}: OptimizedFloatingNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isMobile } = useDeviceDetection();

  // Use available user data (prefer initialUser if available, fallback to sessionUser)
  const userData = initialUser || (sessionUser ? {
    id: sessionUser.id,
    firstName: sessionUser.user_metadata?.firstName || sessionUser.email?.split('@')[0] || 'User',
    lastName: sessionUser.user_metadata?.lastName || '',
    email: sessionUser.email || '',
    username: sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || '',
    profilePicture: sessionUser.user_metadata?.profilePicture || null,
  } : null);

  const isLoggedIn = !!userData;
  
  // Preload notification data for better performance
  useNotificationPreloader(userData?.id || '', isLoggedIn);

  // Optimized notification count query with caching
  const { data: notificationCount } = useQuery({
    queryKey: ['notificationCount', userData?.id],
    queryFn: async () => getUnreadNotificationCount(),
    initialData: initialNotificationCount,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 15000,
    gcTime: 300000,
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  // Optimized recent notifications query
  const { data: recentNotifications } = useQuery({
    queryKey: ['recentNotifications', userData?.id],
    queryFn: async () => getRecentNotifications(5),
    initialData: initialRecentNotifications,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    staleTime: 30000,
    gcTime: 300000,
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  // Memoized user initials calculation
  const userInitials = useMemo(() => {
    if (!userData?.firstName) return 'U';
    return `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName?.charAt(0).toUpperCase() || ''}`;
  }, [userData?.firstName, userData?.lastName]);

  useEffect(() => {
    const supabase = createClient();
    let visibilityTimer: NodeJS.Timeout | null = null;
    
    visibilityTimer = setTimeout(() => setIsVisible(true), 500);
    
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSessionUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      setLoading(false);
      
      // Invalidate queries when auth state changes
      if (!session?.user) {
        queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
        queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      }
    });

    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 200;
          setIsExpanded(isMobile || scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  const navItems = useMemo(() => [
    { id: "home", icon: Home, label: "Home", href: "/" },
    // { id: "pricing", icon: DollarSign, label: "Pricing", href: "/pricing" },
    { id: "explore", icon: FileText, label: "Explore", href: "/profiles" },
    { id: "leaderboard", icon: Sparkles, label: "Leaderboard", href: "/leaderboard" },
  ], []);
  
  const isRouteActive = useCallback((href: string): boolean => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      queryClient.clear();
      
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [queryClient]);

  const renderAuthContent = useCallback(() => {
    if (loading) {
      return <div className={cn(
        "rounded-full bg-white/10 animate-pulse",
        isMobile ? "w-16 h-6" : "w-28 h-8"
      )} />;
    }

    if (userData) {
      return (
        <div className="flex items-center gap-1">
          {/* Notification Bell - only shows when logged in */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                "relative rounded-full p-0",
                isMobile ? "h-6 w-6" : "h-8 w-8"
              )}>
                <Bell className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                {(notificationCount ?? 0) > 0 && (
                  <Badge
                    variant="destructive"
                    className={cn(
                      "absolute flex items-center justify-center text-[10px] rounded-full",
                      isMobile ? "-top-1 -right-1 h-3 w-3 p-0 text-[8px]" : "-top-1 -right-1 h-4 w-4 p-0"
                    )}
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <OptimizedNotificationDropdown 
              notifications={recentNotifications ?? []} 
              userId={userData.id}
            />
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                "relative rounded-full p-0",
                isMobile ? "h-6 w-6" : "h-8 w-8"
              )}>
                <Avatar className={isMobile ? "h-6 w-6" : "h-8 w-8"}>
                  <AvatarImage 
                    src={userData.profilePicture || undefined} 
                    alt={userData.firstName || 'User'} 
                  />
                  <AvatarFallback className={cn(
                    "text-xs",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {userData.firstName} {userData.lastName}
                  </p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    {userData.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild inset={false}>
                <Link href={`/${userData.username}`} className="w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                 My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild inset={false}>
                <Link href="/profile/edit" className="w-full cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild inset={false}>
                <Link href="/chat" className="w-full cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chats
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild inset={false}>
                <Link href="/notifications" className="w-full cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem asChild inset={false}>
                <Link href="/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer" inset={false}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Link href="/login">
          <motion.div 
            key="signin" 
            whileHover={{ scale: 1.05, y: -1 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "rounded-full backdrop-blur-sm",
                "hover:bg-white/10 text-muted-foreground hover:text-foreground",
                isMobile ? "text-[10px] h-6 px-2" : "text-xs h-7 px-3"
              )}
            >
              <LogIn className={isMobile ? "w-2 h-2 mr-1" : "w-3 h-3 sm:mr-1"} />
              <span className={isMobile ? "inline" : "hidden sm:inline"}>Sign in</span>
            </Button>
          </motion.div>
        </Link>
        <Link href="/register">
          <motion.div 
            key="getstarted" 
            whileHover={{ scale: 1.05, y: -1 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="default" 
              size="sm" 
              className={cn(
                "rounded-full backdrop-blur-sm",
                "bg-white/20 hover:bg-white/30 text-foreground shadow-lg",
                isMobile ? "text-[10px] h-6 px-2" : "text-xs h-7 px-3"
              )}
            >
              <Sparkles className={isMobile ? "w-2 h-2 mr-1" : "w-3 h-3 sm:mr-1"} />
              <span className={isMobile ? "inline" : "hidden sm:inline"}>Get started</span>
            </Button>
          </motion.div>
        </Link>
      </div>
    );
  }, [loading, userData, notificationCount, recentNotifications, userInitials, handleLogout, isMobile]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 200,
            duration: 0.6 
          }}
          className={cn(
            "fixed z-50",
            isMobile 
              ? "bottom-0 left-0 right-0" 
              : "bottom-6 left-1/2 -translate-x-1/2"
          )}
        >
          <motion.div 
            layout
            className={cn(
              "relative flex items-center gap-1 p-2 rounded-full",
              "bg-background/20 backdrop-blur-3xl border border-white/10",
              "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
              "before:absolute before:inset-0 before:rounded-full",
              "before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent",
              "before:backdrop-blur-sm before:-z-10",
              "after:absolute after:inset-0 after:rounded-full",
              "after:bg-gradient-to-t after:from-black/20 after:via-transparent after:to-white/10",
              "after:-z-10",
              isMobile 
                ? "rounded-none border-x-0 border-b-0 px-4 py-3" 
                : (isExpanded ? "px-3" : "px-2")
            )}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Logo - only when expanded and not mobile */}
            <AnimatePresence mode="wait">
              {isExpanded && !isMobile && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center overflow-hidden"
                >
                  <div className="flex items-center px-3 py-1">
                    <span className="text-sm font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent whitespace-nowrap">
                      0unveiled
                    </span>
                  </div>
                  <div className="w-px h-5 bg-white/20 mx-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Items */}
            <div className={cn(
              "flex items-center",
              isMobile ? "flex-1 justify-around gap-0" : "gap-1"
            )}>
              {navItems.map((item) => (
                <Link key={item.id} href={item.href}>
                  <motion.button
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium",
                      "transition-all duration-300 hover:bg-white/10",
                      "backdrop-blur-sm",
                      isMobile ? "flex-col gap-1 px-2 py-1 text-[10px]" : "",
                      isRouteActive(item.href)
                        ? "bg-white/20 text-foreground shadow-lg shadow-black/20" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                    <span className={cn(isMobile ? "block" : "hidden sm:inline")}>{item.label}</span>
                  </motion.button>
                </Link>
              ))}
            </div>

            {/* Auth Actions - only when expanded on desktop, always on mobile */}
            <AnimatePresence mode="wait">
              {(isExpanded || isMobile) && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  {!isMobile && <div className="w-px h-5 bg-white/20 mx-1" />}
                  <div className="flex items-center gap-1">
                    {renderAuthContent()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-r from-background/20 to-background/10 blur-xl -z-20",
            isMobile ? "rounded-none" : ""
          )} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
