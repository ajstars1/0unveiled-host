"use server"

import * as z from "zod"
import {
  ProfileOnboardingSchema,
  onboardingFormSchema,
  profileFormSchema,
  skillSchema,
  skillsFormSchema,
  experienceEducationFormSchema,
  portfolioItemSchema, 
  optionSchema, 
  passwordSettingsSchema, 
  notificationSettingsFormSchema
} from "@/schemas"
import { getUserBySupabaseId } from "@/data/user"
import { isSkillExist } from "@/data/skills"
import { db } from "@/lib/drizzle"
import { createSupabaseServerClient } from "@0unveiled/lib/supabase"
import { 
  users, 
  showcasedItems, 
  experience as experienceTable, 
  education as educationTable, 
  skills, 
  userSkills,
  integrationProviderEnum
} from "@0unveiled/database"
import { eq, and, or, not, ne, desc } from "drizzle-orm"
import { getCurrentUser } from '@/data/user'
import { revalidatePath } from 'next/cache'

// Define types for map parameters based on the schema
type ExperienceInput = z.infer<typeof experienceEducationFormSchema>["experience"][number]
type EducationInput = z.infer<typeof experienceEducationFormSchema>["education"][number]

type AuthorizedParams = {
  isAuthorizationChecked?: boolean
  userId?: string
}

type UnauthorizedParams = {
  isAuthorizationChecked?: false
  userId?: never
}

type SkillsParams = AuthorizedParams | UnauthorizedParams

export interface OnboardingFormValues extends z.infer<typeof onboardingFormSchema> {}

// Define the full onboarding schema including fields handled by the action
const onboardingActionSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).optional(), // Make optional on backend?
  headline: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.object({ // Assuming skills come in this format from the frontend form
      name: z.string(),
      group: z.string().optional(),
  })).optional(),
});

// Moved the schema definition above the interface that uses it
export interface OnboardingActionValues extends z.infer<typeof onboardingActionSchema> {}

export const updateExperienceEducation = async (values: z.infer<typeof experienceEducationFormSchema>) => {
  // const supabase = createServerComponentClient({ cookies })
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  // Validate input data using the schema
  const validatedFields = experienceEducationFormSchema.safeParse(values);
  if (!validatedFields.success) {
      console.error("Server validation failed for Experience/Education:", validatedFields.error.flatten().fieldErrors);
      return { error: "Invalid experience/education data." };
  }
  const { experience, education } = validatedFields.data;

  // Delete existing experience and education records
  await db.delete(experienceTable).where(eq(experienceTable.userId, dbUser.id))
  await db.delete(educationTable).where(eq(educationTable.userId, dbUser.id))

  // Create new experience records
  if (experience.length > 0) {
    await db.insert(experienceTable).values(
      experience.map((exp: ExperienceInput) => ({
        userId: dbUser.id,
        companyName: exp.company,
        jobTitle: exp.position,
        location: exp.location || null,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : null,
        current: exp.current,
        description: exp.description || null
      }))
    )
  }

  // Create new education records
  if (education.length > 0) {
    await db.insert(educationTable).values(
      education.map((edu: EducationInput) => ({
        userId: dbUser.id,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : null,
        current: edu.current,
        description: edu.description || null
      }))
    )
  }

  return { success: "Experience and Education Updated" }
}

export const profile = async (values: z.infer<typeof profileFormSchema>) => {
  // const supabase = createServerComponentClient({ cookies })
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  // Validate username uniqueness if provided and different
  if (values.username && values.username.toLowerCase() !== dbUser.username) {
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.username, values.username.toLowerCase()),
        ne(users.id, dbUser.id)
      )
    })
    if (existingUser) {
      return { error: "Username already exists" }
    }
  }
  
  // Validate schema server-side
  const validatedFields = profileFormSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Server validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: "Invalid input data." };
  }
  
  const { /* skills, socialLinks, */ ...userData } = validatedFields.data;

  // Prepare the data for the User model update
  const updateData: Partial<typeof users.$inferInsert> = {
    // Spread validated user data (excluding skills, which are handled separately)
    firstName: userData.firstName !== undefined ? userData.firstName : dbUser.firstName,
    lastName: userData.lastName !== undefined ? userData.lastName : dbUser.lastName,
    // username: userData.username?.toLowerCase() || dbUser.username, // Keep existing username if not provided or invalid
    bio: userData.bio !== undefined ? userData.bio : dbUser.bio,
    // Add headline to the update data
    headline: userData.headline !== undefined ? userData.headline : (dbUser.headline || null),
    location: userData.location !== undefined ? userData.location : (dbUser.location || null),
    college: userData.college !== undefined ? userData.college : (dbUser.college || null),
    
    // Update social links
    githubUrl: userData.githubUrl !== undefined ? userData.githubUrl : dbUser.githubUrl,
    linkedinUrl: userData.linkedinUrl !== undefined ? userData.linkedinUrl : dbUser.linkedinUrl,
    websiteUrl: userData.websiteUrl !== undefined ? userData.websiteUrl : dbUser.websiteUrl,
    twitterUrl: userData.twitterUrl !== undefined ? userData.twitterUrl : dbUser.twitterUrl, // Ensure twitter is handled

    // DO NOT update email or username here usually
    // profilePicture is handled by uploadProfilePicture action
  };

  // Remove undefined keys to avoid overwriting existing data with undefined
  Object.keys(updateData).forEach(key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]);

  // Update user data in the database
  try {
      await db.update(users).set(updateData).where(eq(users.id, dbUser.id));
      return { success: "Profile Updated" };
  } catch (error) {
       console.error("Error updating profile:", error);
       return { error: "Database error during profile update." };
  }
}

export async function onboarding(data: z.infer<typeof onboardingFormSchema>, supabaseId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId),
    });

    if (!user) {
      return { error: "User not found" };
    }
    const supabase = await createSupabaseServerClient()
    
    // --- Add username uniqueness check ---
    if (data.username) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.username, data.username),
          ne(users.supabaseId, supabaseId)
        ),
      });
      if (existingUser) {
        return { error: "Username is already taken. Please choose another." };
      }
    }
    // --- End username uniqueness check ---

    // Update user profile
    const updatedUser = await db.update(users).set({
      username: data.username,
      headline: data.headline || null,
      onboarded: true,
    }).where(eq(users.supabaseId, supabaseId)).returning();
     const { data: { user: supabaseUser }, error } = await supabase.auth.updateUser({
      data: { isOnboarded: true }
    })

    // Handle skills
    if (data.skills && data.skills.length > 0) {
      for (const skill of data.skills) {
        // Check if skill exists
        let dbSkill = await db.query.skills.findFirst({
          where: eq(skills.name, skill.name),
        });

        // Create skill if it doesn't exist
        if (!dbSkill) {
          const [newSkill] = await db.insert(skills).values({
            name: skill.name,
            category: skill.group || null,
          }).returning();
          dbSkill = newSkill;
        }

        // Connect skill to user with default level 1
        await db.insert(userSkills).values({
          userId: user.id,
          skillId: dbSkill.id,
          level: 1, // Default level for all skills
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in onboarding:", error);
    return { error: "Failed to update profile" };
  }
}

export const Skills = async (
  skills: z.infer<typeof skillsFormSchema>,
  params: SkillsParams
): Promise<{ error?: string; success?: string }> => {
  let userId: string
  if (params.isAuthorizationChecked && 'userId' in params && params.userId) {
    userId = params.userId
  } else {
     const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return { error: "Unauthorized" }
    }

    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) {
      return { error: "Unauthorized" }
    }
    userId = dbUser.id
  }

  for (const skill of skills) {
    const skillExists = await isSkillExist(skill.value)
    if (skillExists) {
      await connectSkill(skill, { isAuthorizationChecked: true, userId })
    } else {
      await createSkill(skill, { isAuthorizationChecked: true, userId })
    }
  }

  return { success: "Skills Updated" }
}

export const createSkill = async (
  skill: z.infer<typeof skillSchema>,
  params: SkillsParams
): Promise<{ error?: string; success?: string }> => {
  let userId: string

  if (params.isAuthorizationChecked && params.userId) {
    userId = params.userId
  } else {
     const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { error: "Unauthorized" }
    
    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) return { error: "Unauthorized" }
    userId = dbUser.id
  }

  if (!skill.name) {
    return { error: "Skill name is required" }
  }

  const isSkillPresent = await isSkillExist(skill.name)
  if (isSkillPresent) {
    return { error: `${skill.name} skill already exists in 0unveiled` }
  }

  const skillData = {
    name: skill.name,
    description: null,
    category: skill.group || null,
    users: {
      create: {
        user: {
          connect: { id: userId }
        },
        level: 1
      }
    }
  }

  await db.insert(skills).values({
    name: skillData.name,
    description: skillData.description,
    category: skillData.category,
  })

  return { success: "Skills Updated" }
}

export const disconnectSkill = async (
  skill: z.infer<typeof skillSchema>,
  params: SkillsParams
): Promise<{ error?: string; success?: string }> => {
  let userId: string
  if (params.isAuthorizationChecked && params.userId) {
    userId = params.userId
  } else {
     const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { error: "Unauthorized" }
    
    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) return { error: "Unauthorized" }
    userId = dbUser.id
  }

  // Find the skill and its user connection
  const skillRecord = await db.query.skills.findFirst({
    where: eq(skills.name, skill.name),
  })

  if (!skillRecord) {
    return { error: "Skill not found" }
  }

  // Check if user-skill connection exists
  const userSkillRecord = await db.query.userSkills.findFirst({
    where: and(
      eq(userSkills.userId, userId),
      eq(userSkills.skillId, skillRecord.id)
    ),
  })

  if (!userSkillRecord) {
    return { error: "Skill is not connected to user" }
  }

  // Delete the user-skill connection
  await db.delete(userSkills).where(
    and(
      eq(userSkills.userId, userId),
      eq(userSkills.skillId, skillRecord.id)
    )
  )

  return { success: "Skill removed from your profile" }
}

export const connectSkill = async (
  skill: z.infer<typeof skillSchema>,
  params: SkillsParams
): Promise<{ error?: string; success?: string }> => {
  let userId: string

  if (params.isAuthorizationChecked && params.userId) {
    userId = params.userId
  } else {
    // const supabase = createServerComponentClient({ cookies })
     const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { error: "Unauthorized" }
    
    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) return { error: "Unauthorized" }
    userId = dbUser.id
  }

  if (!skill.name) {
    return { error: "Skill name is required" }
  }

  const skillRecord = await db.query.skills.findFirst({
    where: eq(skills.name, skill.name),
  })

  if (!skillRecord) {
    return { error: "Skill not found" }
  }

  // Check if user-skill connection already exists
  const existingUserSkill = await db.query.userSkills.findFirst({
    where: and(
      eq(userSkills.userId, userId),
      eq(userSkills.skillId, skillRecord.id)
    ),
  })

  if (existingUserSkill) {
    return { error: `${skill.name} skill is already connected to user` }
  }

  await db.insert(userSkills).values({
    userId,
    skillId: skillRecord.id,
    level: 1
  })

  return { success: "Skill Connected" }
}

export const profileOnboarding = async (
  values: z.infer<typeof ProfileOnboardingSchema>,
) => {
  // const supabase = createServerComponentClient({ cookies })
   const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  if (values.username) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, values.username.toLowerCase()),
    })
    if (existingUser && existingUser.id !== dbUser.id) {
      return { error: "Username already exists" }
    }
  }

  const result = ProfileOnboardingSchema.safeParse(values)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await db.update(users).set({
      ...values,
    }).where(eq(users.id, dbUser.id))
    return { success: "Profile Updated" }
  } catch (error) {
    console.error("Profile Update Error:", error)
    return { error: "Failed to update profile" }
  }
}

export const uploadProfilePicture = async (
  formData: FormData
): Promise<{ error?: string; success?: string; url?: string }> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserBySupabaseId(user.id);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("profilePicture") as File | null;

  if (!file) {
    return { error: "No profile picture file provided." };
  }

  // Basic validation (consider adding more robust checks)
  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type. Please upload an image." };
  }
  if (file.size > 1 * 1024 * 1024) { // 1MB limit
    return { error: "File is too large. Maximum size is 1MB." };
  }

  // Construct a unique file path
  const fileExtension = file.name.split('.').pop();
  const filePath = `public/${dbUser.id}/${Date.now()}.${fileExtension}`; // Ensure 'public' folder exists or adjust path/policies

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("profile-pictures") // Ensure this bucket exists and has policies set
    .upload(filePath, file, {
      upsert: true, // Overwrite if file exists (optional)
    });

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError);
    return { error: `Storage error: ${uploadError.message}` };
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(filePath);

   if (!publicUrlData?.publicUrl) {
      console.error("Failed to get public URL for:", filePath);
      // Attempt cleanup if URL fails
      await supabase.storage.from("profile-pictures").remove([filePath]);
      return { error: "Could not get public URL for the uploaded image." };
   }

  const newProfilePictureUrl = publicUrlData.publicUrl;

  // Update the user's profile picture URL in the database
  try {
    const oldProfilePictureUrl = dbUser.profilePicture;
    await db.update(users).set({
      profilePicture: newProfilePictureUrl,
    }).where(eq(users.id, dbUser.id))
    if (oldProfilePictureUrl) {
      const oldFilePath = oldProfilePictureUrl.split("/profile-pictures/").pop();
      if (oldFilePath) {
        await supabase.storage.from("profile-pictures").remove([oldFilePath]);
      }
    }

    return { success: "Profile picture updated successfully.", url: newProfilePictureUrl };
  } catch (dbError) {
    console.error("Database update error after upload:", dbError);
    // Attempt cleanup: Remove the file from storage if DB update fails
    await supabase.storage.from("profile-pictures").remove([filePath]);
    return { error: "Failed to save profile picture URL to profile." };
  }
};

// --- Portfolio Actions ---

// Type Alias for clarity (still using the frontend form schema structure for input)
type PortfolioFormInput = z.infer<typeof portfolioItemSchema>

// Type for return data structure matching frontend expectation
interface FrontendPortfolioItem {
    id: string;
    title: string;
    description?: string | null;
    role?: string | null; // Extracted from metadata
    projectUrl?: string | null; // Mapped from url
    skillsUsed: string[]; // Extracted from metadata
    imageUrls: string[]; // Will be empty for now
    isGithubRepo?: boolean | null; // Mapped based on provider
    githubRepoUrl?: string | null; // Mapped from url if provider is GITHUB
    provider?: string;
    metadata?: Record<string, any> | null;
}

// Fetch Portfolio Items (Adapted for ShowcasedItem)
export const getPortfolio = async (userId: string): Promise<FrontendPortfolioItem[]> => {
  const showcasedItemsData = await db.query.showcasedItems.findMany({
    where: eq(showcasedItems.userId, userId),
    orderBy: [desc(showcasedItems.showcasedAt)],
  })
  // Map ShowcasedItem to the structure expected by the frontend form/display
  return showcasedItemsData.map((item: any) => {
      let role: string | null = null;
      let skillsUsed: string[] = [];
      const fullMetadata = (item.metadata && typeof item.metadata === 'object') ? item.metadata : {}; // Keep the full metadata

      // Safely parse specific fields needed for direct mapping or manipulation
      if (fullMetadata) {
          const meta = fullMetadata as Record<string, unknown>; // Cast for easier access
          role = typeof meta.role === 'string' ? meta.role : null;
          // Keep skillsUsed extraction as it was, assuming it might still be needed directly
          skillsUsed = Array.isArray(meta.skillsUsed) ? meta.skillsUsed.filter((s: unknown): s is string => typeof s === 'string') : [];
      }

      return {
          id: item.id,
          title: item.title,
          description: item.description,
          role: role,
          projectUrl: item.provider === 'CUSTOM' ? item.url : undefined,
          skillsUsed: skillsUsed, // Still return the extracted string array if needed by form
          imageUrls: item.imageUrl ? [item.imageUrl] : [],
          isGithubRepo: item.provider === 'GITHUB',
          githubRepoUrl: item.provider === 'GITHUB' ? item.url : undefined,
          metadata: fullMetadata, // <--- Include the full metadata object
          provider: item.provider,
      };
  });
}

// Create Portfolio Item (Adapted for ShowcasedItem)
export const createPortfolioItem = async (
  values: PortfolioFormInput
): Promise<{ success?: string; error?: string; data?: FrontendPortfolioItem }> => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) return { error: "Unauthorized" }
  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) return { error: "User not found" }

  // Use the form schema, but adapt data for ShowcasedItem
  const validatedFields = portfolioItemSchema.safeParse(values)
  if (!validatedFields.success) {
    console.error("Server validation failed (createPortfolioItem):", validatedFields.error.flatten().fieldErrors);
    return { error: "Invalid portfolio item data." }
  }

  const { skillsUsed, projectUrl, role, imageUrls, ...itemData } = validatedFields.data // Destructure fields to map

  // Prepare metadata
  const metadata = {
      role: role || null,
      // Convert Option[] from form to string[] for metadata
      skillsUsed: (skillsUsed || []).map(option => option.value),
  };

  try {
    const [newItem] = await db.insert(showcasedItems).values({
      userId: dbUser.id,
      provider: 'CUSTOM', // Set provider as CUSTOM for manual entries
      // Provide a placeholder or generate a unique value for externalId
      externalId: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Example placeholder
      title: itemData.title,
      description: itemData.description || null,
      url: projectUrl || '', // Use url field for projectUrl
      metadata: metadata,
    }).returning()

     // Map back to frontend structure for return data
     const returnData: FrontendPortfolioItem = {
       id: newItem.id,
       title: newItem.title,
       description: newItem.description,
       role: metadata.role,
       projectUrl: newItem.url,
       skillsUsed: metadata.skillsUsed,
       imageUrls: newItem.imageUrl ? [newItem.imageUrl] : [],
       isGithubRepo: false,
       provider: newItem.provider,
     };

    return { success: "Portfolio item created successfully.", data: returnData }
  } catch (error) {
    console.error("Error creating portfolio item (ShowcasedItem):", error)
    return { error: "Database error during portfolio item creation." }
  }
}

// Update Portfolio Item (Adapted for ShowcasedItem)
export const updatePortfolioItem = async (
  values: PortfolioFormInput
): Promise<{ success?: string; error?: string; data?: FrontendPortfolioItem }> => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) return { error: "Unauthorized" }
  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) return { error: "User not found" }

  if (!values.id) return { error: "Portfolio item ID is missing." };

  const validatedFields = portfolioItemSchema.safeParse(values)
  if (!validatedFields.success) {
     console.error("Server validation failed (updatePortfolioItem):", validatedFields.error.flatten().fieldErrors);
    return { error: "Invalid portfolio item data." }
  }

  const { skillsUsed, projectUrl, role, imageUrls, id, ...itemData } = validatedFields.data

   // Prepare metadata
   const metadata = {
       role: role || null,
       skillsUsed: (skillsUsed || []).map(option => option.value), // Convert Option[] to string[]
   };

  try {
    // Verify ownership and that it's a CUSTOM item if we only want to edit those
    const existingItem = await db.query.showcasedItems.findFirst({
        where: and(
          eq(showcasedItems.id, id!),
          eq(showcasedItems.userId, dbUser.id)
        )
    });

    if (!existingItem) {
        return { error: "Portfolio item not found or you don't have permission to edit it." };
    }
    // Optional: Check if existingItem.provider === 'CUSTOM'

    const [updatedItem] = await db.update(showcasedItems).set({
      title: itemData.title,
      description: itemData.description || null,
      url: projectUrl || '',
      // imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : existingItem.imageUrl, // Update image if provided (ignoring for now)
      metadata: metadata,
      // Only update fields relevant to CUSTOM type
    }).where(eq(showcasedItems.id, id!)).returning()

      // Map back to frontend structure for return data
     const returnData: FrontendPortfolioItem = {
       id: updatedItem.id,
       title: updatedItem.title,
       description: updatedItem.description,
       role: metadata.role,
       projectUrl: updatedItem.url,
       skillsUsed: metadata.skillsUsed,
       imageUrls: updatedItem.imageUrl ? [updatedItem.imageUrl] : [],
       isGithubRepo: updatedItem.provider === 'GITHUB',
       provider: updatedItem.provider,
     };

    return { success: "Portfolio item updated successfully.", data: returnData }
  } catch (error) {
    console.error("Error updating portfolio item (ShowcasedItem):", error)
    return { error: "Database error during portfolio item update." }
  }
}

// Delete Portfolio Item (Adapted for ShowcasedItem)
export const deletePortfolioItem = async (
  itemId: string // Keep accepting itemId
): Promise<{ success?: string; error?: string }> => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) return { error: "Unauthorized" }
  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) return { error: "User not found" }

  try {
    // Verify ownership before deleting
     const itemToDelete = await db.query.showcasedItems.findFirst({
         where: and(
           eq(showcasedItems.id, itemId),
           eq(showcasedItems.userId, dbUser.id)
         )
     });

     if (!itemToDelete) {
         return { error: "Portfolio item not found or you don't have permission to delete it." };
     }
     // Optional: Check provider if only CUSTOM items should be deletable via this action

    await db.delete(showcasedItems).where(eq(showcasedItems.id, itemId))
    return { success: "Portfolio item deleted successfully." }
  } catch (error) {
    console.error("Error deleting portfolio item (ShowcasedItem):", error)
    return { error: "Database error during portfolio item deletion." }
  }
}

// --- End Portfolio Actions ---

// --- NEW: Update Password Action --- 
export const updatePassword = async (
  prevState: { message?: string; errors?: Record<string, string[]> } | null,
  formData: FormData
): Promise<{ message?: string; errors?: Record<string, string[]> }> => {
  const supabase = await createSupabaseServerClient();
  
  // 1. Get Authenticated User
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { message: "Unauthorized. Please log in again." }; // Use message for general errors
  }

  // 2. Validate Form Data
  const formDataObj: Record<string, string> = {};
  const entries = formData.entries();
  for (const [key, value] of entries) {
    formDataObj[key] = value.toString();
  }
  const validatedFields = passwordSettingsSchema.safeParse(formDataObj);

  if (!validatedFields.success) {
    console.error("Password validation failed:", validatedFields.error.flatten().fieldErrors);
    return {
      message: "Invalid input. Please check the fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  // 3. Verify Current Password (Attempt to sign in with it)
  // Note: Supabase doesn't have a direct "verify current password" method.
  // The common workaround is to attempt a sign-in with the *current* password.
  // If it succeeds, the password is correct. If it fails, it's incorrect.
  // This requires the user's email.
  const email = user.email;
  if (!email) {
      return { message: "Could not retrieve user email for verification." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: currentPassword,
  });

  if (signInError) {
      // Handle specific errors if needed, otherwise assume incorrect password
      console.warn("Current password verification failed:", signInError.message);
      return {
          message: "Incorrect current password.",
          errors: { currentPassword: ["The password you entered is incorrect."] },
      };
  }

  // 4. Update Password in Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Supabase password update error:", updateError);
    return { message: `Failed to update password: ${updateError.message}` };
  }

  // 5. Success
  return { message: "Password updated successfully!" };
};

// --- End NEW: Update Password Action ---

/**
 * Updates user notification settings.
 * @param formData - Form data containing notification settings
 * @returns Object indicating success or error
 */
export const updateNotificationSettings = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const notifyAchievements = formData.get('notifyAchievements') === 'true'
    const notifyConnections = formData.get('notifyConnections') === 'true'
    const notifyEvents = formData.get('notifyEvents') === 'true'
    const notifyMessages = formData.get('notifyMessages') === 'true'
    const notifyProjects = formData.get('notifyProjects') === 'true'
    const emailFrequency = formData.get('emailFrequency') as string

    const [updatedUser] = await db.update(users)
      .set({
        notifyAchievements,
        notifyConnections,
        notifyEvents,
        notifyMessages,
        notifyProjects,
        emailFrequency: emailFrequency as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning()

    revalidatePath('/dashboard/settings')
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return { error: 'Failed to update notification settings' }
  }
}

/**
 * Updates user privacy settings.
 * @param formData - Form data containing privacy settings
 * @returns Object indicating success or error
 */
export const updatePrivacySettings = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Note: Privacy settings would typically be stored in a separate table
    // For now, we'll update the user's profile visibility through existing fields
    const profileVisibility = formData.get('profileVisibility') as string

    const [updatedUser] = await db.update(users)
      .set({
        // Add privacy-related fields here when they exist in the schema
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning()

    revalidatePath('/dashboard/settings')
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return { error: 'Failed to update privacy settings' }
  }
}

/**
 * Updates user display settings.
 * @param formData - Form data containing display settings
 * @returns Object indicating success or error
 */
export const updateDisplaySettings = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Note: Display settings would typically be stored in a separate table
    // For now, we'll update basic user preferences
    const theme = formData.get('theme') as string
    const language = formData.get('language') as string

    const [updatedUser] = await db.update(users)
      .set({
        // Add display-related fields here when they exist in the schema
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning()

    revalidatePath('/dashboard/settings')
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating display settings:', error)
    return { error: 'Failed to update display settings' }
  }
}

/**
 * Deletes the user's account.
 * @param formData - Form data containing confirmation
 * @returns Object indicating success or error
 */
export const deleteAccount = async (formData: FormData) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    const confirmation = formData.get('confirmation') as string
    if (confirmation !== 'DELETE') {
      return { error: 'Please type DELETE to confirm account deletion' }
    }

    // Note: In a real application, you might want to:
    // 1. Soft delete the user (mark as deleted but keep data)
    // 2. Anonymize the data
    // 3. Delete related data in a specific order
    // 4. Handle external service cleanup (Supabase auth, etc.)

    // For now, we'll just delete the user record
    // This will cascade to related records based on foreign key constraints
    await db.delete(users)
      .where(eq(users.id, currentUser.id))

    // Note: You'll need to handle Supabase auth deletion separately
    // This is just the database record deletion

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { error: 'Failed to delete account' }
  }
}

/**
 * Exports user data.
 * @returns Object containing user data or error
 */
export const exportUserData = async () => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Fetch all user data including related records
    const userData = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
      with: {
        education: true,
        experience: true,
        skills: {
          with: {
            skill: true,
          },
        },
        projectsOwned: true,
        projectsMemberOf: {
          with: {
            project: true,
          },
        },
        showcasedItems: true,
        // Add other relations as needed
      },
    })

    if (!userData) {
      return { error: 'User data not found' }
    }

    return { success: true, data: userData }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return { error: 'Failed to export user data' }
  }
}