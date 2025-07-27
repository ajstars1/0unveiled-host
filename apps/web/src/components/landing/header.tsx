"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useIsMobile } from "@0unveiled/ui/hooks/use-mobile"

export default function Header() {
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl">
            0Unveiled
          </Link>
        </div>

        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {isMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b p-4 flex flex-col gap-4">
                <Link href="#features" onClick={toggleMenu} className="px-4 py-2 hover:bg-muted rounded-md">
                  Features
                </Link>
                <Link href="/projects" onClick={toggleMenu} className="px-4 py-2 hover:bg-muted rounded-md">
                  Explore Projects
                </Link>
                <Link href="/profiles" onClick={toggleMenu} className="px-4 py-2 hover:bg-muted rounded-md">
                  Explore Profiles
                </Link>
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 text-sm">
              <Link href="#features" className="transition-colors hover:text-foreground/80">
                Features
              </Link>
              <Link href="/projects" className="transition-colors hover:text-foreground/80">
                Explore Projects
              </Link>
              <Link href="/profiles" className="transition-colors hover:text-foreground/80">
                Explore Profiles
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
