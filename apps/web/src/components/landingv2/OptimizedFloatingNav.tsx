"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Users, DollarSign, LogIn, Sparkles, Bell, User, Settings, LogOut, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User as DatabaseUser, Notification } from "@0unveiled/database";
import Link from "next/link";
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
  const [activeItem, setActiveItem] = useState("home");
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const queryClient = useQueryClient();

  // Only run queries if user is logged in
  const isLoggedIn = !!userId && !!initialUser;
  
  // Preload notification data for better performance
  useNotificationPreloader(userId, isLoggedIn);

  // Optimized notification count query with caching
  const { data: notificationCount } = useQuery({
    queryKey: ['notificationCount', userId],
    queryFn: async () => {
      const count = await getUnreadNotificationCount();
      return count;
    },
    initialData: initialNotificationCount,
    refetchInterval: 30000, // Reduced frequency
    refetchOnWindowFocus: true,
    staleTime: 15000, // Consider data fresh for 15 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData,
    enabled: isLoggedIn, // Only run if logged in
  });

  // Optimized recent notifications query
  const { data: recentNotifications } = useQuery({
    queryKey: ['recentNotifications', userId],
    queryFn: async () => {
      const notifications = await getRecentNotifications(5);
      return notifications;
    },
    initialData: initialRecentNotifications,
    refetchInterval: 60000, // Less frequent updates
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData,
    enabled: isLoggedIn, // Only run if logged in
  });

  // Memoized user initials calculation
  const userInitials = useMemo(() => {
    if (!initialUser?.firstName) return 'U';
    const firstInitial = initialUser.firstName.charAt(0).toUpperCase();
    const lastInitial = initialUser.lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial;
  }, [initialUser?.firstName, initialUser?.lastName]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    const supabase = createClient();
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSessionUser(user);
      setLoading(false);
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
      clearTimeout(timer);
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 200;
          setIsExpanded(scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "pricing", icon: DollarSign, label: "Pricing", href: "/pricing" },
    { id: "explore", icon: FileText, label: "Explore", href: "/profiles" },
    // { id: "recruitment", icon: Briefcase, label: "Recruitment", href: "/recruitment" },
    { id: "leaderboard", icon: Sparkles, label: "Leaderboard", href: "/leaderboard" },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Clear all cached data on logout
    queryClient.clear();
    
    // Redirect to home
    window.location.href = '/';
  };

  const renderAuthContent = () => {
    if (loading) {
      return <div className="w-28 h-8 rounded-full bg-white/10 animate-pulse" />;
    }

    if (sessionUser && initialUser) {
      return (
        <div className="flex items-center gap-2">
          {/* Notification Bell - only shows when logged in */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full p-0">
                <Bell className="h-4 w-4" />
                {(notificationCount ?? 0) > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <OptimizedNotificationDropdown 
              notifications={recentNotifications ?? []} 
              userId={userId}
            />
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={initialUser.profilePicture || undefined} 
                    alt={initialUser.firstName || 'User'} 
                    className="" 
                  />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {initialUser.firstName} {initialUser.lastName}
                  </p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    {initialUser.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="" />
              <DropdownMenuItem asChild className="" inset={false}>
                <Link href={`/${initialUser.username}`} className="w-full  cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="" inset={false}>
                <Link href="/settings" className="w-full  cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600  cursor-pointer" inset={false}>
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
                "text-xs h-7 px-3 rounded-full backdrop-blur-sm",
                "hover:bg-white/10 text-muted-foreground hover:text-foreground"
              )}
            >
              <LogIn className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Sign in</span>
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
                "text-xs h-7 px-3 rounded-full backdrop-blur-sm",
                "bg-white/20 hover:bg-white/30 text-foreground shadow-lg"
              )}
            >
              <Sparkles className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Get started</span>
            </Button>
          </motion.div>
        </Link>
      </div>
    );
  };

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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
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
              isExpanded ? "px-3" : "px-2"
            )}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Logo - only when expanded */}
            <AnimatePresence mode="wait">
              {isExpanded && (
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
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.id} href={item.href}>
                  <motion.button
                    onClick={() => setActiveItem(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium",
                      "transition-all duration-300 hover:bg-white/10",
                      "backdrop-blur-sm",
                      activeItem === item.id 
                        ? "bg-white/20 text-foreground shadow-lg shadow-black/20" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </motion.button>
                </Link>
              ))}
            </div>

            {/* Auth Actions - only when expanded */}
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  <div className="w-px h-5 bg-white/20 mx-1" />
                  <div className="flex items-center gap-1">
                    {renderAuthContent()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background/20 to-background/10 blur-xl -z-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
