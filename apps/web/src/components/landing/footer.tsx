"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { Button } from "@0unveiled/ui/components/button"
import { useTheme } from "next-themes"

export function Footer() {
  const { theme, setTheme } = useTheme()

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-8 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-lg tracking-tight">
              0unveiled
            </Link>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link 
              href="/pricing" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/docs" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="/community" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Community
            </Link>
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
            aria-label="Toggle theme"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </motion.div>
          </Button>
        </div>
      </div>
    </footer>
  )
}
