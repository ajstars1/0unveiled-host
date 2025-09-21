"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Eye, EyeOff, Github, Loader2, Chrome } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
// import authSideImage from "@/public/images/features/feature6.png"

// Import Auth Hooks
import {
  useAuthSignIn, // Email/Password
  useGoogleAuth, // Google OAuth
  useGithubAuth, // GitHub OAuth
} from "@/hooks/authentication"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FaGithub, FaGoogle } from "react-icons/fa6"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  // Use the hooks
  const { form, handleSignIn, isLoading: isEmailLoading } = useAuthSignIn()
  const { handleGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth()
  const { handleGithubSignIn, isLoading: isGithubLoading } = useGithubAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Combined loading state for disabling elements
  const isLoading = isEmailLoading || isGoogleLoading || isGithubLoading;

  // We use the form instance from the hook now
  const { register, handleSubmit, formState: { errors } } = form;

  // Effect to check for verification errors on load
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    const hash = window.location.hash; // Get the hash fragment

    let isExpiredLinkError = false;
    let errorMessage = "";

    // Check query params
    if (errorParam === "oauth_provider_error" && messageParam?.toLowerCase().includes("email link is invalid or has expired")) {
      isExpiredLinkError = true;
      errorMessage = messageParam;
    }

    // Check hash fragment (more robust check)
    if (hash.includes("error=access_denied") || hash.includes("error_code=otp_expired")) {
        if (hash.includes("error_description=Email+link+is+invalid+or+has+expired")) {
             isExpiredLinkError = true;
             errorMessage = "Email link is invalid or has expired.";
        }
    }

    // Show toast if specific error detected
    if (isExpiredLinkError) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: `${errorMessage} Please try signing up again or request a new verification link if available.`, // Added suggestion
      });
       // Optional: Clean the URL to remove error params after showing the toast
      // window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]); // Dependencies

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12 px-4 md:px-6">
        <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2 md:gap-16">
          {/* Left side - Login form */}
          <div className="flex flex-col justify-center space-y-6 bg-white text-black p-8 rounded-xl shadow-xl">
            <div className="space-y-2 text-center">
              <Link
                href="/"
                className="inline-block text-neutral-600 hover:text-black"
              >
                <Image
                  src="/logo.png"
                  alt="Abstrack Logo"
                  width={80}
                  height={80}
                  className="mx-auto"
                />
              </Link>
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="text-gray-600">
                Enter your credentials to access your account
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gray-300 text-gray-800 bg-white hover:bg-gray-800"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGoogle className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gray-300 text-gray-300 bg-black hover:bg-gray-800"
                onClick={handleGithubSignIn}
                disabled={isLoading}
              >
                {isGithubLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGithub className="mr-2 h-4 w-4" />
                )}
                GitHub
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="Type your email here"
                  type="email"
                  {...register("email")}
                  disabled={isLoading}
                  className="bg-white border-gray-300 focus:border-black focus:ring-black"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    disabled={isLoading}
                    className="bg-white border-gray-300 focus:border-black focus:ring-black"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-black"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                size="lg"
                variant="default"
                className="w-full bg-black text-white hover:bg-gray-800"
                type="submit"
                disabled={isLoading}
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Right side - Image and text */}
          <div className="hidden md:flex flex-col justify-center space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
                Showcase Your Skills
              </h2>
              <p className="text-gray-600 md:text-xl lg:text-base xl:text-xl max-w-[500px] mx-auto">
                Join our platform to collaborate on projects and demonstrate
                your abilities to potential employers.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src={"/images/features/feature6.png"}
                alt="Collaboration Illustration"
                width={400}
                height={400}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
