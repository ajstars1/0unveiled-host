"use server"

import { db } from "@/lib/drizzle" // Updated to use Drizzle client
import { createSupabaseServerClient } from "@/lib/supabase/server"; // Use the server utility
import { 
  users, 
  accounts, 
  education, 
  experience, 
  userSkills, 
  projects, 
  projectMembers, 
  showcasedItems,
  type User,
  type Account,
  type Education,
  type Experience,
  type UserSkill,
  type Project,
  type ProjectMember,
  type ShowcasedItem
} from "@0unveiled/database"; // Import Drizzle types
import { eq, and, or, desc, asc } from "drizzle-orm";
import { getUserBySupabaseId } from "@/data/user"

// Define the type for the user profile including expected relations
type UserProfileWithRelations = User & {
  education: Education[];
  experience: Experience[];
  skills: (UserSkill & { skill: { id: string; name: string; description: string | null; category: string | null } })[];
  accounts: Account[];
};

// Type for SignUpUser payload (adjust based on your form/needs)
type SignUpUserPayload = {
  email: string
  supabaseId: string
  firstName?: string
  lastName?: string
  profilePicture?: string // Add profile picture field
  // Add other fields needed for initial profile creation
}

/**
 * Called after successful Supabase signUp (even before email verification).
 * Creates or updates the user profile in the database, linking it
 * to the Supabase Auth user via supabaseId.
 * Includes relations to satisfy potential downstream type expectations.
 */
export const onSignUpUser = async ({
  email,
  supabaseId,
  firstName,
  lastName,
}: SignUpUserPayload): Promise<{ 
    data?: UserProfileWithRelations; // Use the detailed type here
    error?: string; 
    message?: string; 
    needsVerification?: boolean; // Add this optional flag
}> => {
  const supabase = await createSupabaseServerClient(); // Need Supabase client for resend

  try {
    // 1. Check if user already exists by email, including relations
    let existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        education: true,
        experience: true,
        skills: {
          with: {
            skill: true,
          },
        },
        accounts: true,
      },
    });

    if (existingUser) {
      // 2. User exists: Update supabaseId if it's missing or different
      if (existingUser.supabaseId !== supabaseId) {
        // Update first
        await db.update(users)
          .set({ supabaseId: supabaseId })
          .where(eq(users.email, email));
        
        // Re-fetch with relations to return the consistent type
        existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
          with: {
            education: true,
            experience: true,
            skills: {
              with: {
                skill: true,
              },
            },
            accounts: true,
          },
        });
        if (!existingUser) { // Safety check after re-fetch
          throw new Error("Failed to re-fetch user after updating supabaseId.");
        }
      }

      // 3. Trigger verification email resend for the existing Supabase user
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (resendError) {
        // It's okay to have an error here, don't block the process
      }

      // Return the full existing user object with relations
      return { data: existingUser, message: "Existing user found. Verification email resent if needed.", needsVerification: true };

    } else {
      // 4. User does not exist: Create new user profile, including empty relations
      const newUserData = {
        supabaseId: supabaseId,
        email: email,
        firstName: firstName || "", // Use provided or default
        lastName: lastName || null, // Use provided or default
        onboarded: false,
      };

      const [newUser] = await db.insert(users).values(newUserData).returning();

      // Fetch the new user with relations
      const newUserWithRelations = await db.query.users.findFirst({
        where: eq(users.id, newUser.id),
        with: {
          education: true,
          experience: true,
          skills: {
            with: {
              skill: true,
            },
          },
          accounts: true,
        },
      });

      return { data: newUserWithRelations };
    }
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      await supabase.auth.resend({ type: 'signup', email: email }).catch(e => {}); // Best effort resend
      return { error: "An account with this email already exists. We've resent the verification email.", needsVerification: true };
    }
    else if (error.code === 'P2002' && error.meta?.target?.includes('supabaseId')) {
       return { error: "A conflicting user record exists. Please contact support." };
    }
    else {
      return { error: `Sign-up profile processing failed: ${error.message}` };
    }
  }
};

// Define a type for the user profile returned by onSignInUser, including accounts
type UserProfileWithAccounts = User & {
    accounts?: Account[]; // Made optional
    skills?: (UserSkill & { skill: { id: string; name: string; description: string | null; category: string | null } })[] // Added optional skills relation
};

/**
 * Called after successful Supabase signInWithPassword or OAuth callback.
 * Ensures the user profile exists in database and returns its status (e.g., onboarding).
 * Also attempts to link missing OAuth provider identities from Supabase to Account table.
 * Relies on the Supabase session already being established by the client/middleware.
 */
export const onSignInUser = async (
    supabaseId: string
): Promise<{ data?: User; error?: string }> => { 
  const supabase = await createSupabaseServerClient(); // Use server client
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return { error: "Failed to retrieve session details." };
    }

    const { session } = sessionData;

    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();

    if (authUserError || !authUser) {
      return { error: "Authentication error. Cannot retrieve user details for account linking." };
    }

    if (authUser.id !== supabaseId) {
       return { error: "User ID mismatch. Cannot proceed with account linking."};
    }

    let user = await getUserBySupabaseId(supabaseId); 

    if (!user) {
      if (!authUser.email) {
        return { error: "Cannot create profile without an email address." };
      }
      try {
        const newUserData = {
          supabaseId: supabaseId,
          email: authUser.email,
          firstName: authUser.user_metadata?.first_name || authUser.user_metadata?.full_name || 'User',
          lastName: authUser.user_metadata?.last_name || null,
          profilePicture: authUser.user_metadata?.avatar_url || null,
          onboarded: false,
        };

        const [newUser] = await db.insert(users).values(newUserData).returning();
        
        // Fetch the new user with relations to match the expected type
        const newUserWithRelations = await db.query.users.findFirst({
          where: eq(users.id, newUser.id),
          with: {
            education: true,
            experience: true,
            skills: {
              with: {
                skill: true,
              },
            },
            accounts: true,
          },
        });
        
        user = newUserWithRelations;
      } catch (creationError: any) {
        return { error: "Failed to create user profile during sign-in. Please try again or contact support." };
      }
    }

    if (!user) { 
        return { error: "Failed to retrieve or create user profile." };
    }

    if (authUser.identities && authUser.identities.length > 0 && session.provider_token) {
      for (const identity of authUser.identities) {
        if (identity.provider && identity.id) {
          try {
            const accountData = {
              userId: user.id, 
              provider: identity.provider,
              providerAccountId: identity.id,
              accessToken: session.provider_token, 
              refreshToken: session.provider_refresh_token || null, 
              expiresAt: session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : null,
              tokenType: session.token_type || null, 
            };

            // Use upsert pattern for Drizzle
            const existingAccount = await db.query.accounts.findFirst({
              where: and(
                eq(accounts.provider, identity.provider),
                eq(accounts.providerAccountId, identity.id)
              ),
            });

            if (existingAccount) {
              // Update existing account
              await db.update(accounts)
                .set({
                  accessToken: accountData.accessToken,
                  refreshToken: accountData.refreshToken,
                  expiresAt: accountData.expiresAt,
                  tokenType: accountData.tokenType,
                })
                .where(eq(accounts.id, existingAccount.id));
            } else {
              // Create new account
              await db.insert(accounts).values(accountData);
            }
          } catch (accountError: any) {
            // Log to a more persistent system in production if necessary
            // For now, fail silently for this part or return a non-blocking warning.
          }
        } else {
          // Identity missing provider or ID, skip.
        }
      }
    } else {
      // No OAuth identities or no provider token, normal for email/password or if session lacks token.
    }
    
    return { data: user }
  } catch (error: any) {
    return { error: `Sign-in failed: ${error.message}` }
  }
}

/**
 * Gets the current authenticated user's profile from database.
 * Assumes Supabase session is handled by middleware/server client setup.
 */
export const getAuthenticatedUser = async () => {
  try {
    // Add timeout and better error handling
    const supabase = await createSupabaseServerClient()
    
    // Add timeout to prevent hanging connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase client timeout')), 5000)
    })
    
    const authPromise = supabase.auth.getUser()
    
    const { data: { user: authUserWithMeta }, error: metaError } = await Promise.race([
      authPromise,
      timeoutPromise
    ]) as any;
    
    if (metaError || !authUserWithMeta) {
       return { error: "Failed to retrieve user metadata." };
    }
    
    const userProfile = await db.query.users.findFirst({
      where: eq(users.supabaseId, authUserWithMeta.id), 
      with: {
        skills: { 
          with: { skill: true }, 
          orderBy: asc(userSkills.skillId) 
        },
        accounts: true, 
        education: { orderBy: desc(education.startDate) }, 
        experience: { orderBy: desc(experience.startDate) }, 
        projectsOwned: { 
          columns: {
             id: true,
             title: true,
            description: true,
            publicSummary: true,
             status: true,
             visibility: true,
          },
          orderBy: desc(projects.createdAt),
        },
        projectsMemberOf: { 
          with: {
            project: {
              columns: {
                id: true,
                title: true,
                description: true,
                publicSummary: true,
                status: true,
                visibility: true,
              },
              with: {
                requiredSkills: { with: { skill: true } },
                owner: { columns: { id: true } },
              },
            },
          },
          orderBy: desc(projectMembers.joinedAt),
        },
        showcasedItems: { 
           columns: {
               id: true,
               provider: true,
               externalId: true,
               title: true,
               description: true,
               url: true,
               imageUrl: true,
               metadata: true,
               showcasedAt: true,
               order: true,
               roleInItem: true,
               lastSyncedAt: true,
               isPinned: true,
           },
           orderBy: [
               desc(showcasedItems.isPinned),
               asc(showcasedItems.order),
               desc(showcasedItems.showcasedAt)
           ]
        },
      },
    });

    if (!userProfile) {
       return { error: "User profile not found in database." }
    }

    const combinedUserProfile = {
        ...userProfile, 
        app_metadata: authUserWithMeta.app_metadata 
    }; 

    return { data: combinedUserProfile }
  } catch (error) {
    return { error: "Could not create Supabase client or an unexpected error occurred." }
  }
}

/**
 * Signs out the current user using Supabase.
 */
export const logout = async (): Promise<{ error?: string }> => {
  const supabase = await createSupabaseServerClient()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: "Failed to sign out." }
    }
    return {}
  } catch (err) {
    return { error: "An unexpected error occurred during sign out." }
  }
}
