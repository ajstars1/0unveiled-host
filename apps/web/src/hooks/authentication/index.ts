import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { redirect, useRouter } from "next/navigation" // Use next/navigation
// import { toast } from "sonner"
import { toast } from "@/hooks/use-toast"
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Import your Zod schemas (assuming they remain the same for email/password structure)
import {
  type SignInSchema,
  signInSchema,
} from "@/components/forms/sign-in/schema"
import {
  type SignUpSchema,
  signUpSchema,
} from "@/components/forms/sign-up/schema"

// Import the Supabase client utility
import { createClient } from "@/lib/supabase/client";

// Import the server actions we'll update later
import { onSignInUser, onSignUpUser } from "@/actions/auth"

// --- Sign In Hook ---
export const useAuthSignIn = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient() // Get Supabase client instance

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const handleSignIn = async (values: SignInSchema) => {
    setIsLoading(true)
    try {
      // 1. Sign in with Supabase Auth
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
  

      if (signInError) {
        console.error("Supabase Sign In Error:", signInError)
        // Provide more specific error messages based on signInError.message or code
        let friendlyMessage = "Sign in failed. Please check your credentials."
        if (signInError.message.includes("Invalid login credentials")) {
          friendlyMessage = "Invalid email or password."
        } else if (signInError.message.includes("Email not confirmed")) {
          friendlyMessage = "Please confirm your email address first."
          // Optionally redirect to a page explaining email confirmation
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: friendlyMessage,
        })
        setIsLoading(false)
        return
      }
      if (!signInData.user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Sign in failed. No user data received.",
        })
        setIsLoading(false)
        return
      }


      // 2. Call server action to ensure user profile exists in Prisma/handle onboarding status etc.
      // This action now uses the Supabase user ID.
      const profileResult = await onSignInUser(signInData.user.id)

      if (profileResult?.error) {
        console.error("Profile Sync Error:", profileResult.error)
        // Sign the user out from Supabase if profile sync fails? Or let them proceed? Depends on flow.
        // await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Error",
          description: profileResult.error,
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Success",
        description: "Signed in successfully!",
      })

      // Redirect based on onboarding status or to dashboard
      if (profileResult?.data?.onboarded === false) {
        router.push("/onboarding")
      } else {
        // Check for redirect_to param from middleware
        const searchParams = new URLSearchParams(window.location.search)
        const redirectTo = searchParams.get("redirect_to")
        router.push(redirectTo || "/profile/edit") // Redirect to intended page or profile edit
      }
      router.refresh() // Refresh server components
    } catch (error) {
      console.error("Sign In Catch Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign in.",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { form, handleSignIn, isLoading }
}

// --- Sign Up Hook ---
export const useAuthSignUp = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false) // State for email verification message
  const supabase = createClient()

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    // Include default values for all fields in the schema if they exist
    defaultValues: { email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }, 
  })

  const handleSignUp = async (values: SignUpSchema) => {
    setIsLoading(true)
    setShowVerification(false) // Reset verification message state

    try {
      // 1. Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: values.firstName, 
              last_name: values.lastName,   
            }
          }
        })

      if (signUpError) {
        console.error("Supabase Sign Up Error:", signUpError)
        let friendlyMessage = "Sign up failed. Please try again."
        if (signUpError.message.includes("User already registered")) {
          // Even if Supabase says already registered, we proceed to ensure Prisma profile exists & trigger resend
           console.warn("Supabase reports user already registered, proceeding to Prisma check/resend.");
        } else if (signUpError.message.includes("Password should be at least 6 characters")) {
          friendlyMessage = "Password must be at least 6 characters long."
           toast({ variant: "destructive", title: "Error", description: friendlyMessage });
           setIsLoading(false);
           return; // Stop if it's a clear input error like short password
        } else {
           // Handle other Supabase sign-up errors
           toast({ variant: "destructive", title: "Sign Up Error", description: signUpError.message });
           setIsLoading(false);
           return;
        }
        // Don't return immediately for "already registered" error, let onSignUpUser handle it.
      }

      // Check if user data exists from Supabase response
      if (signUpData.user) {
          // Check if user is already confirmed
          if (signUpData.user.email_confirmed_at) {
              console.log("User already confirmed via Supabase. Ensuring Prisma profile exists.");
              // Still call onSignUpUser to ensure Prisma record is linked
              await onSignUpUser({
                email: signUpData.user.email!, 
                supabaseId: signUpData.user.id, 
                firstName: values.firstName || "", 
                lastName: values.lastName || "",  
              }); 
              // No need to check result rigorously here, focus is on informing the user
              
              toast({
                  title: "Account Already Verified",
                  description: "This email is already registered and verified. Please log in.",
              });
              // Do NOT set showVerification = true
              // Optionally redirect to login? router.push('/login');
          } else {
              // User is not confirmed yet, proceed with profile creation/link and verification flow
              const profileResult = await onSignUpUser({
                email: signUpData.user.email!, 
                supabaseId: signUpData.user.id, 
                firstName: values.firstName || "", 
                lastName: values.lastName || "",  
              });

              if (profileResult?.error) {
                console.error("Profile Creation/Link Error:", profileResult.error)
                toast({
                  variant: "destructive",
                  title: "Account Error", // More generic title
                  description: profileResult.error, // Show the specific error from the action
                });
                // Don't set showVerification true if profile action failed
              } else {
                // Profile action succeeded (either created or found existing)
                setShowVerification(true);
                let toastDescription = "A verification link has been sent to your email address. Please verify to complete sign up.";
                if (profileResult?.needsVerification && profileResult?.message?.includes("Existing user found")) {
                    toastDescription = "Account found. A new verification link has been sent. Please check your email.";
                }
                toast({
                  title: "Check Your Email",
                  description: toastDescription,
                });
              }
          }
      } else if (!signUpError) { // Only show this if Supabase didn't error but also didn't return a user (edge case)
        console.error("Supabase Sign Up - No user data returned, but no error.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Sign up process incomplete. Please try again or contact support.",
        })
      }
      // If Supabase reported "already registered", and we landed here without user data (unlikely), show generic error
      else if (signUpError?.message.includes("User already registered")) {
           toast({ variant: "destructive", title: "Error", description: "Sign up failed. Please try logging in." });
      }

    } catch (error) {
      console.error("Sign Up Catch Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign up.",
      })
    } finally {
      setIsLoading(false)
      // Still don't redirect, user needs to act on email or login prompt.
    }
  }

  // Return form, handleSignUp, isLoading, and showVerification
  // Omit OTP-related values: verifying, code, setCode, onGenerateCode, onInitiateUserRegistration
  return { form, handleSignUp, isLoading, showVerification }
}

// --- Google OAuth Hook ---
export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  // const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Your callback route
        },
      })
      if (data.url) {
        redirect(data.url) // use the redirect API for your server framework
      }

      if (error) {
        console.error("Google OAuth Error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Google Sign-In failed: ${error.message}`,
        })
        setIsLoading(false)
      }
      // No need to setIsLoading(false) here if successful, as the page will redirect.
    } catch (error) {
      console.error("Google OAuth Catch Error:", error)
      // toast({
      //   variant: "destructive",
      //   title: "Error",
      //   description: "An unexpected error occurred during Google Sign-In.",
      // })
      setIsLoading(false)
    }
  }

  return { handleGoogleSignIn, isLoading }
}

// --- GitHub OAuth Hook ---
export const useGithubAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  // const router = useRouter()

  const handleGithubSignIn = async () => {
    try {
      setIsLoading(true)
      const {  data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          scopes: 'repo read:user user:email'
        }
      })

      if (error) {
        throw error
      }

      if (data?.url) {
        window.location.href = data.url
      }
      
    } catch (error) {
      console.error('Authentication failed:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication failed. Please try again.",
      })
    } finally {
      setIsLoading(false)

    }
  }


  return {
    handleGithubSignIn,
    isLoading
  }
}

// --- Sign Out Hook ---
export const useAuthSignOut = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign Out Error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Sign out failed: ${error.message}`,
        })
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully.",
        })
        router.push("/") // Redirect to homepage
        router.refresh() // Ensure server components update
      }
    } catch (error) {
      console.error("Sign Out Catch Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign out.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return { handleSignOut, isLoading }
}
