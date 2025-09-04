"use client"

import { useState, useEffect } from "react"
import { Search, Menu, X, User, Mail, Lock, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
  { name: "Leaderboards", href: "/leaderboards" },
  { name: "Recruit", href: "/recruit" },
]

interface NavbarProps {
  className?: string
}

export default function Navbar({ className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [signUpData, setSignUpData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = { email: "", password: "" }
    
    if (!signUpData.email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!signUpData.password) {
      newErrors.password = "Password is required"
    } else if (!validatePassword(signUpData.password)) {
      newErrors.password = "Password must be at least 8 characters"
    }
    
    setErrors(newErrors)
    
    if (newErrors.email || newErrors.password) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setIsSignUpOpen(false)
    setSignUpData({ email: "", password: "" })
    setErrors({ email: "", password: "" })
    
    toast.success("Account created successfully! Welcome to 0Unveiled.")
  }

  const handleSocialSignUp = (provider: string) => {
    toast.success(`Signing up with ${provider}...`)
  }

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
        isScrolled ? "shadow-sm border-b border-border" : ""
      } ${className}`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-18 md:h-20 px-4 md:px-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="font-heading font-bold text-xl text-foreground">
              0Unveiled
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-sm font-medium text-foreground hover:text-primary transition-all duration-200 group py-2"
              >
                <span className="transition-all duration-200 group-hover:tracking-wide">
                  {link.name}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            
            <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative text-sm font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 group"
                >
                  <span className="transition-all duration-200 group-hover:tracking-wide">
                    Sign Up
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading font-bold text-center">
                    Join 0Unveiled
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSignUpSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      className={`${errors.email ? "border-destructive" : ""}`}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Create a password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      className={`${errors.password ? "border-destructive" : ""}`}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignUp("Google")}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignUp("GitHub")}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="w-4 h-4" />
              <span className="sr-only">Search</span>
            </Button>
            
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-muted">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden p-2">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left font-heading font-bold">
                    0Unveiled
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        className="block px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full mb-4">
                          Sign Up
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-heading font-bold text-center">
                            Join 0Unveiled
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSignUpSubmit} className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              value={signUpData.email}
                              onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                              className={`${errors.email ? "border-destructive" : ""}`}
                              disabled={isLoading}
                            />
                            {errors.email && (
                              <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              type="password"
                              placeholder="Create a password"
                              value={signUpData.password}
                              onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                              className={`${errors.password ? "border-destructive" : ""}`}
                              disabled={isLoading}
                            />
                            {errors.password && (
                              <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading}
                          >
                            {isLoading ? "Creating Account..." : "Create Account"}
                          </Button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSocialSignUp("Google")}
                              disabled={isLoading}
                              className="flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Google
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSocialSignUp("GitHub")}
                              disabled={isLoading}
                              className="flex items-center gap-2"
                            >
                              <Github className="w-4 h-4" />
                              GitHub
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground px-3">Connect with us</p>
                      <div className="flex space-x-2 px-3">
                        <Button variant="ghost" size="sm" className="p-2">
                          <Github className="w-4 h-4" />
                          <span className="sr-only">GitHub</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}