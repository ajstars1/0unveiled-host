"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Users, DollarSign, LogIn, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";;
import type { User } from "@supabase/supabase-js";
import { UserNav } from "../global/navbar/user-nav";
import Link from "next/link";

export function FloatingNav() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState("home");
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    });

    return () => {
      clearTimeout(timer);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setIsExpanded(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "#" },
    { id: "pricing", icon: DollarSign, label: "Pricing", href: "/pricing" },
    { id: "docs", icon: FileText, label: "Docs", href: "#docs" },
    { id: "community", icon: Users, label: "Community", href: "#community" },
  ];

  const renderAuthContent = () => {
    if (loading) {
      return <div className="w-28 h-8 rounded-full bg-white/10 animate-pulse" />;
    }

    if (sessionUser) {
      return (
        <motion.div 
          key="user-nav"
          whileHover={{ scale: 1.05, y: -1 }} 
          whileTap={{ scale: 0.95 }}
        >
          <UserNav user={sessionUser} />
        </motion.div>
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
                <motion.button
                  key={item.id}
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
