"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Eye, EyeOff, Github, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    setIsLoading(true)

    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Registration successful",
        description: "Your account has been created. Redirecting to onboarding...",
      })
      // Redirect to onboarding
      window.location.href = "/onboarding"
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-950 to-neutral-900 flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12 px-4 md:px-6">
        <div className="grid w-full gap-6 sm:grid-cols-1 md:grid-cols-2 lg:gap-12">
          {/* Left side - Registration form */}
          <div className="flex flex-col justify-center space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-xl">
            <div className="space-y-2 text-center">
              <Link href="/" className="inline-block">
                <ArrowLeft className="h-4 w-4 mb-4" />
              </Link>
              <Image src="/logo.png" alt="0Unveiled Logo" width={60} height={60} className="mx-auto mb-2" />
              <h1 className="text-3xl font-bold">Create an account</h1>
              <p className="text-gray-500 dark:text-gray-400">Enter your information to get started</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label className="" htmlFor="name">Full Name</Label>
                    <Input type="text" id="name" placeholder="John Doe" required className="mt-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="" htmlFor="email">Email</Label>
                    <Input id="email" placeholder="m@example.com" required type="email" className="mt-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="" htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" placeholder="••••••••" required type={showPassword ? "text" : "password"} className="mt-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="" htmlFor="institution">Institution/Organization</Label>
                    <Input type="text" id="institution" placeholder="University or Company Name" required className="mt-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="" htmlFor="role">Role</Label>
                    <Input type="text" id="role" placeholder="Student, Professional, etc." required className="mt-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="" htmlFor="bio">Short Bio</Label>
                    <Input type="text" id="bio" placeholder="Tell us a bit about yourself" required className="mt-1" />
                  </div>
                </>
              )}
              <Button size="default" variant="default" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : step === 1 ? (
                  "Continue"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-neutral-900 px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="default" variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Right side - Image and text */}
          <div className="hidden md:flex flex-col justify-center space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Join Our Community</h2>
              <p className="text-gray-300 md:text-xl max-w-[500px] mx-auto">
                Connect with like-minded individuals, collaborate on projects, and showcase your skills to potential
                employers.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/register-illustration.png"
                alt="Community Illustration"
                width={400}
                height={400}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
