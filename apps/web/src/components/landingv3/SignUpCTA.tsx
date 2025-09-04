"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Github, Mail, Chrome } from "lucide-react"

interface SignUpCTAProps {
  className?: string
}

export default function SignUpCTA({ className }: SignUpCTAProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState("")

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setEmailError("Email is required")
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }
    
    setEmailError("")
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Welcome aboard! Check your email to get started.", {
        description: "We've sent you a verification link to complete your profile.",
      })
      
      setEmail("")
    } catch (error) {
      toast.error("Something went wrong. Please try again.", {
        description: "If the problem persists, please contact support.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialSignUp = (provider: string) => {
    toast.success(`Redirecting to ${provider}...`, {
      description: "This is a demo. In production, this would redirect to the OAuth flow.",
    })
  }

  const handleExploreFirst = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-8 shadow-sm ${className || ""}`}>
      <div className="text-center space-y-6">
        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            Start Your Journey Today
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of users discovering new possibilities
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>30-second setup</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>Free forever plan</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                className="pl-10 h-12 text-base"
                aria-label="Email address"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
            </div>
            {emailError && (
              <p 
                id="email-error" 
                className="text-destructive text-sm text-left"
                role="alert"
                aria-live="polite"
              >
                {emailError}
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Creating your profile...
              </div>
            ) : (
              "Get Started Free"
            )}
          </Button>
          
          {isSubmitting && (
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div className="bg-accent h-full animate-pulse"></div>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-3 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Social Sign-up */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleSocialSignUp("GitHub")}
            className="h-11 border-border hover:bg-muted/50"
          >
            <Github className="h-4 w-4 mr-2" />
            GitHub
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignUp("Google")}
            className="h-11 border-border hover:bg-muted/50"
          >
            <Chrome className="h-4 w-4 mr-2" />
            Google
          </Button>
        </div>

        {/* Secondary Action */}
        <div className="pt-2">
          <button
            onClick={handleExploreFirst}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Explore first without signing up
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}