"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import {
  useAuthSignUp,
  useGoogleAuth,
  useGithubAuth,
} from "@/hooks/authentication"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"; // Import Supabase client

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FaGithub, FaGoogle } from "react-icons/fa6"

import authSideImage from "@/public/images/features/feature4.png"
import logoGif from "@/public/logo/logo.gif"

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { form, handleSignUp, isLoading: isEmailLoading, showVerification } = useAuthSignUp()
  const { handleGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth()
  const { handleGithubSignIn, isLoading: isGithubLoading } = useGithubAuth()
  const { toast } = useToast()
  const supabase = createClient() // Initialize Supabase client
  const [isResending, setIsResending] = useState(false) // Add state for resend loading
  const [resendCooldown, setResendCooldown] = useState(0); // State for cooldown timer
  const [isCooldownActive, setIsCooldownActive] = useState(false); // State to track if cooldown is running
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store interval ID

  const isLoading = isEmailLoading || isGoogleLoading || isGithubLoading;

  const { register, handleSubmit, formState: { errors }, watch, getValues } = form;

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setIsCooldownActive(true);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current); // Clear existing interval just in case

    intervalRef.current = setInterval(() => {
      setResendCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(intervalRef.current!);
          setIsCooldownActive(false);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);
  };

  // --- Handler to Resend Verification Email ---
  const handleResendVerification = async () => {
    // Prevent triggering if cooldown is active
    if (isCooldownActive) return; 
    
    const email = getValues("email");
    // Log the email being used
    console.log("[handleResendVerification] Attempting to resend for email:", email);

    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get email address to resend verification.",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email: email 
      });

      if (error) {
        // Log the full error object from Supabase
        console.error("[handleResendVerification] Supabase resend Error:", error);
        let description = "Failed to resend verification email. Please try again later.";
        // Check specific error codes/messages if known
        if (error.message.includes("rate limit") || error.message.includes("try again later")) { 
          description = "Rate limit exceeded. Please wait before trying to resend.";
          startCooldown(); 
        }
        toast({
          variant: "destructive",
          title: "Error Resending Email",
          description: description,
        });
      } else {
        console.log("[handleResendVerification] Resend successful for:", email);
        toast({
          title: "Verification Email Resent",
          description: `A new verification link has been sent to ${email}. Please check your inbox (and spam folder).`,
        });
        startCooldown(); // Start cooldown on successful send
      }
    } catch (error) {
      console.error("[handleResendVerification] Catch Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while resending the email.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-950 to-neutral-900 flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12 px-4 md:px-6">
        <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col justify-center space-y-6 bg-white text-black p-8 rounded-xl shadow-xl">
            <div className="space-y-2 text-center">
              <Link href="/" className="inline-block text-neutral-600 hover:text-black">
              <Image src={logoGif} alt="Abstrack Logo" width={80} height={80} className="mx-auto" /> 
              </Link>
              <h1 className="text-3xl font-bold">Create an account</h1>
              <p className="text-gray-600">Enter your information to get started</p>
            </div>
              {/* OAuth and Sign In Link (Only show if verification message isn't shown) */} 
            {!showVerification && (
              <>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    size="default"
                     variant="outline" 
                     className="w-full border-gray-300 bg-white text-black hover:bg-black"
                     onClick={handleGoogleSignIn} 
                     disabled={isLoading}
                   >
                     {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaGoogle className="mr-2 h-4 w-4" />} 
                     Google
                   </Button>
                   <Button 
                    size="default"
                     variant="outline" 
                     className="w-full border-gray-300 text-gray-300 bg-black hover:bg-gray-800"
                     onClick={handleGithubSignIn} 
                     disabled={isLoading}
                   >
                     {isGithubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaGithub className="mr-2 h-4 w-4" />} 
                     GitHub
                   </Button>
                </div>
                 <div className="relative">
                   <div className="absolute inset-0 flex items-center">
                     <Separator className="bg-gray-300" />
                   </div>
                   <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-white px-2 text-gray-500">Or continue with</span>
                   </div>
                 </div>
                
               </>
             )}
            <form onSubmit={handleSubmit(handleSignUp)} className="space-y-4">
                {/* Step 1 Fields (First/Last Name, Email, Passwords) */}
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-black">First Name</Label> 
                      <Input 
                        type="text"
                        id="firstName" 
                        placeholder="Your first name" 
                        {...register("firstName")} 
                        disabled={isLoading || showVerification} // Disable when verification shown too
                        className="bg-white border-gray-300 focus:border-black focus:ring-black"
                      />
                      {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-black">Last Name</Label> 
                      <Input 
                        type="text"
                        id="lastName" 
                        placeholder="Your last name" 
                        {...register("lastName")} 
                        disabled={isLoading || showVerification}
                        className="bg-white border-gray-300 focus:border-black focus:ring-black"
                      />
                      {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Type your email here" 
                      type="email" 
                      {...register("email")} 
                      disabled={isLoading || showVerification}
                      className="bg-white border-gray-300 focus:border-black focus:ring-black"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-black">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        placeholder="••••••••" 
                        type={showPassword ? "text" : "password"} 
                        {...register("password")} 
                        disabled={isLoading || showVerification}
                        className="bg-white border-gray-300 focus:border-black focus:ring-black"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-black"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || showVerification}
                      >
                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>} 
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        placeholder="••••••••" 
                        type={showConfirmPassword ? "text" : "password"} 
                        {...register("confirmPassword")} 
                        disabled={isLoading || showVerification}
                        className="bg-white border-gray-300 focus:border-black focus:ring-black"
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-black"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        disabled={isLoading || showVerification}
                      >
                         {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>} 
                  </div>
                </>

                {/* Verification Message and Resend Button */} 
                {showVerification && (
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm">
                        Check your email ({getValues("email")}) for a verification link to complete your signup.
                    </div>
                    <Button 
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={handleResendVerification}
                       disabled={isResending || isLoading || isCooldownActive} // Disable during cooldown
                       className="w-full border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {isResending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                       ) : null}
                       {isCooldownActive ? `Resend in ${resendCooldown}s` : "Resend Verification Email"} {/* Show cooldown */} 
                    </Button>
                  </div>
                 )}

                 {/* Submit Button (Only show if verification message isn't shown) */} 
                 {!showVerification && (
                   <Button size="default" variant="default" type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                     {isEmailLoading ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Creating account...
                       </>
                     ) : (
                       "Create Account & Verify Email"
                     )}
                   </Button>
                 )}
            </form>

          
            {!showVerification && (
               <p className="text-center text-sm text-gray-500">
                   Already have an account?{" "}
                   <Link href="/login" className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline">
                     Sign in
                   </Link>
                 </p>
)}
            
             {/* Sign In Link (Show when verification message is visible) */} 
             {showVerification && ( 
                  <p className="text-center text-sm text-gray-500 pt-4">
                   Already verified?{" "}
                   <Link href="/login" className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline">
                     Sign in
                   </Link>
                 </p>
             )}

          </div>

          {/* Right side illustration */} 
          <div className="hidden md:flex flex-col justify-center space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Join Our Community</h2>
              <p className="text-gray-300 md:text-xl lg:text-base xl:text-xl max-w-[500px] mx-auto">
                Connect with like-minded individuals, collaborate on projects, and showcase your skills to potential
                employers.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src={authSideImage}
                alt="Community Illustration"
                width={600}
                height={600}
                className="object-contain rounded-sm" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
