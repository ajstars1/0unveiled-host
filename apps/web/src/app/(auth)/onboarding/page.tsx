"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

// Form & Validation
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { onboardingFormSchema } from "@/schemas" // Assuming this schema matches the desired fields
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ControllerRenderProps } from "react-hook-form"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"

// Backend & Utils
import { createClient } from "@/lib/supabase/client";
import { onboarding as submitOnboardingData } from "@/actions/settings"
import { SKILLS_Beta } from "@/constants/skills"
import { toast } from "@/hooks/use-toast"

import logoAbstract from "@/public/abstrack_logo_light.svg"
// Define types based on the schema
type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

// Mock search for skills selector (replace if needed)
const mockSearch = async (value: string): Promise<Option[]> => {
  return new Promise((resolve) => {
      const res = SKILLS_Beta.filter((option) => 
          option.label.toLowerCase().includes(value.toLowerCase())
      );
      resolve(res);
  });
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSupabaseUserId(user.id);
        setUserEmail(user.email);
        // Set initial form values *after* user data is fetched
        form.reset({
            username: "", // Or prefill based on email/name?
            email: user.email, // Set the fetched email
            headline: "",
            skills: [],
        });
      } else {
        console.error("Onboarding: User not logged in.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "User session not found. Redirecting to login.",
        })
        router.push("/login");
      }
    };
    fetchUser();
  }, [supabase.auth, router]); // form is added as dependency below after definition

  // Initialize the form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    // Default values are set in useEffect after fetching user email
    defaultValues: {
        username: "",
        email: "", // Initial empty, will be set by useEffect
        headline: "",
        skills: [],
    },
    mode: "onChange",
  });

   // Add form to useEffect dependencies after it's defined
   useEffect(() => {
        if (userEmail) {
            form.reset({ email: userEmail }, { keepDefaultValues: true });
        }
   }, [userEmail, form]); // Now form is defined

  // Handle form submission
  async function onSubmit(values: OnboardingFormValues) {
    if (!supabaseUserId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User session lost. Please log in again.",
      })
      return;
    }
    setIsLoading(true);

    try {
       // Prepare data for the action (adjust if action expects different format)
       // Note: The 'onboarding' action from settings.ts expects {firstName, lastName, ...}
       // We need to either adjust the action or the data sent. Let's adjust data sent for now.
       const firstName = values.username; // Placeholder: Using username as firstName
       const onboardingData = {
          firstName: firstName,
          // lastName: undefined, // Add if needed
          username: values.username,
          headline: values.headline,
          bio: undefined, // Not collected in this form
          skills: values.skills?.map(skill => ({ 
              name: skill.name, // Assuming schema provides name/label
              group: skill.group // Assuming schema provides group
          }))
       }

      // Cast to 'any' remains as workaround for potential lingering TS issues
      const result = await submitOnboardingData(onboardingData as any, supabaseUserId);

      if (result.error) {
        console.error("Onboarding Action Error:", result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Could not save your profile.",
        });
      } else {
        toast({
          title: "Success",
          description: "Your profile is set up. Redirecting...",
        });
        const callback = searchParams.get('callback');
        router.push(callback || "/profile/edit"); // Redirect to profile edit page or callback
        router.refresh();
      }
    } catch (error) {
      console.error("Onboarding submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-950 to-neutral-900 flex flex-col">
      <div className="container mx-auto py-12 px-4 md:px-6 flex-1 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <Image src={logoAbstract} alt="Abstrack Logo" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
            <p className="text-gray-300 mt-2">Fill in your details to get started on Abstrack</p>
          </div>

          <div className="bg-white text-black rounded-xl shadow-xl p-8">
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                   <FormField
                     control={form.control}
                     name="username"
                     render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "username"> }) => (
                       <FormItem className="space-y-2">
                         <FormLabel className="text-black">Username</FormLabel>
                         <FormControl>
                           <Input
                             placeholder="@username" 
                             disabled={isLoading}
                             type="text"
                             {...field}
                             className="bg-white border-gray-300 focus:border-black focus:ring-black"
                           />
                         </FormControl>
                         <FormDescription className="text-gray-600">
                           Your unique profile handle and URL.
                         </FormDescription>
                         <FormMessage className="" />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="email"
                     render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "email"> }) => (
                       <FormItem className="space-y-2">
                         <FormLabel className="text-black!">Email</FormLabel>
                         <FormControl>
                           <Input
                             type="email"
                             disabled // Always disable email field
                             placeholder="Loading email..."
                             {...field}
                             className="bg-gray-100 border-gray-300 text-gray-500" // Indicate disabled state visually
                           />
                         </FormControl>
                         <FormDescription className="text-gray-600">
                           Your login email address.
                         </FormDescription>
                         <FormMessage className="" />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                           name="headline"
                           render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "headline"> }) => (
                             <FormItem className="md:col-span-2 space-y-2">
                               <FormLabel className="text-black">Headline</FormLabel>
                               <FormControl>
                                 <Input 
                                  {...field} 
                                  placeholder="e.g., Aspiring Software Engineer | Design Student" 
                                  disabled={isLoading} 
                                  type="text"
                                  className="bg-white border-gray-300 focus:border-black focus:ring-black"
                                />
                              </FormControl>
                               <FormDescription className="text-gray-600">A short professional headline (max 100 chars).</FormDescription>
                               <FormMessage className="" />
                             </FormItem>
                           )}
                   />
                   <FormField
                     control={form.control}
                     name="skills"
                     render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "skills"> }) => (
                       <FormItem className="col-span-1 md:col-span-2">
                         <FormLabel className="text-black">Skills</FormLabel>
                         <FormControl>
                           <MultipleSelector
                             {...field} // Spread field props here after adjustments
                             // Ensure value mapping is correct
                             value={field.value?.map((skill: z.infer<typeof onboardingFormSchema>["skills"][number]) => ({ 
                                label: skill.label || skill.name,
                                value: skill.value,
                                group: skill.group
                             })) || []}
                             onChange={(options: Option[]) => field.onChange(
                               options.map(option => ({
                                 name: option.label,
                                 label: option.label,
                                 value: option.value,
                                 group: option.group,
                                 // rank is not part of Option, handle default if needed
                               }))
                             )}
                             onSearch={mockSearch}
                             defaultOptions={SKILLS_Beta}
                             creatable
                             groupBy="group"
                             placeholder="Select or create skills..."
                             disabled={isLoading}
                             // Add specific classes if needed to force light theme appearance
                             className="bg-white border-gray-300 text-black"
                             loadingIndicator={
                               <div className="w-full flex flex-col gap-2 p-3">
                                 <Skeleton className="w-[70%] h-2 animate-pulse bg-gray-200" />
                                 <Skeleton className="w-[60%] h-2 animate-pulse bg-gray-200" />
                               </div>
                             }
                             emptyIndicator={
                               <p className="w-full text-center text-sm leading-10 text-gray-500">
                                 No results found. Type to add a new skill.
                               </p>
                             }
                             badgeClassName="bg-gray-200 text-black hover:bg-gray-300"
                           />
                         </FormControl>
                          <FormDescription className="text-gray-600">
                            Add skills relevant to your profile and interests.
                         </FormDescription>
                         <FormMessage className="sr-only" />
                       </FormItem>
                     )}
                   />
                 </div>
                 <div className="flex justify-end">
                   <Button variant="default" size="default" disabled={isLoading} type="submit" className="bg-black text-white hover:bg-gray-800">
                     {isLoading ? (
                       <> 
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Saving Profile...
                       </> 
                     ) : (
                       "Create Profile"
                     )}
                   </Button>
                 </div>
               </form>
             </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
