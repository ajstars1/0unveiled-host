'use server'
import { db } from "@/lib/drizzle"
// Import Drizzle types
import { 
  users, 
  skills, 
  projects, 
  showcasedItems, 
  education, 
  experience, 
  projectMembers, 
  userSkills, 
  connections, 
  connectionRequests,
  aiVerifiedSkills,
  type User,
  type Skill,
  type Project,
  type ShowcasedItem,
  type Education,
  type Experience,
  type ProjectMember,
  type UserSkill,
  type Connection,
  type ConnectionRequest,
  type AIVerifiedSkill
} from "@0unveiled/database";
import { eq, and, or, desc, asc, inArray } from "drizzle-orm";

// Define and export ConnectionStatus type
export type ConnectionStatus = 'NOT_CONNECTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' | 'SELF';

// Type for UserSkill relation
type DetailedUserSkill = UserSkill & { skill: Skill };

// Type for ProjectMember with project relation
type DetailedProjectMember = ProjectMember & { project: Project };

// Type for ShowcasedItem with skills
type DetailedShowcasedItem = ShowcasedItem & { 
  skills: Skill[];
};

// The main user profile type, combining base User with selected/included relations
export type UserProfileDetails = User & {
    headline: string | null;
    skills: DetailedUserSkill[];
    education: Education[];
    experience: Experience[];
    projectsOwned: Project[];
    projectsMemberOf: DetailedProjectMember[];
    showcasedItems: DetailedShowcasedItem[];
    connectionStatus: ConnectionStatus;
    connectionRequestId?: string | null;
    profileCompletionPercentage: number; 
};

/**
 * Fetches a user profile from the database using their Supabase ID.
 * @param supabaseId - The Supabase Auth User ID (UUID string).
 * @returns User profile or null if not found.
 */
export const getUserBySupabaseId = async (supabaseId: string) => {
  try {
    if (!supabaseId) return null

    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId),
      with: {
        skills: {
          with: {
            skill: true,
          },
        },
        education: true,
        experience: true,
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by Supabase ID:", error)
    return null
  }
}

/**
 * Fetches a user profile from the database using their User ID.
 * @param userId - The User ID (UUID string).
 * @returns User profile or null if not found.
 */
export const getUserByUserId = async (userId: string) => {
  try {
    if (!userId) return null

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        skills: {
          with: {
            skill: true,
          },
        },
        education: true,
        experience: true,
      },
    });

    if (!user) return null;

    // Profile Completion Calculation
    let completedFields = 0;
    const totalFields = 10;

    if (user.firstName) completedFields++;
    if (user.lastName) completedFields++;
    if (user.headline) completedFields++;
    if (user.bio) completedFields++;
    if (user.college) completedFields++;
    if (user.location) completedFields++;
    if (user.profilePicture) completedFields++;
    if (user.skills && user.skills.length > 0) completedFields++;
    if (user.education && user.education.length > 0) completedFields++;
    if (user.experience && user.experience.length > 0) completedFields++;

    const profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);

    return { ...user, profileCompletionPercentage };

  } catch (error) {
    console.error("Error fetching user by User ID:", error)
    return null
  }
}

/**
 * Fetches a user profile from the database using their email address.
 * @param email - The user's email address.
 * @returns User profile or null if not found.
 */
export const getUserByEmail = async (email: string) => {
  try {
    if (!email) return null

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        skills: {
          with: {
            skill: true,
          },
        },
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

/**
 * Fetches all users from the database with their basic profile information.
 * @returns Array of users or null if error occurs.
 */
export const getAllUsers = async () => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        bio: true,
        location: true,
        websiteUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        role: true,
        onboarded: true,
        updatedAt: true,
        headline: true,
        college: true,
      },
      with: {
        skills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: desc(users.updatedAt),
    })
    return allUsers
  } catch (error) {
    console.error("Error fetching all users:", error)
    return null
  }
}

/**
 * Fetches a detailed user profile from the database using their username.
 * @param username - The user's username.
 * @param currentUserId - Optional: ID of the user viewing the profile
 * @returns Detailed user profile or null if not found/error.
 */
export const getUserByUsername = async (
  username: string,
  currentUserId?: string
): Promise<UserProfileDetails | null> => {
  try {
    if (!username || typeof username !== 'string') {
      console.warn('getUserByUsername: Invalid username provided:', username);
      return null;
    }

    // Validate username format (no file extensions, special chars)
    if (username.includes('.') || username.includes('/') || username.startsWith('_')) {
      console.warn('getUserByUsername: Invalid username format:', username);
      return null;
    }

    // Get basic user info with connection timeout
    const profileUser = await Promise.race([
      db.query.users.findFirst({
        where: eq(users.username, username.toLowerCase()),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as any;

    if (!profileUser) {
      console.log('getUserByUsername: User not found:', username);
      return null;
    }

    // Get related data separately
    const userSkillsData = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, profileUser.id),
      with: {
        skill: true,
      },
    });

    const educationData = await db.query.education.findMany({
      where: eq(education.userId, profileUser.id),
      orderBy: desc(education.startDate),
    });

    const experienceData = await db.query.experience.findMany({
      where: eq(experience.userId, profileUser.id),
      orderBy: desc(experience.startDate),
    });

    const projectsOwnedData = await db.query.projects.findMany({
      where: eq(projects.ownerId, profileUser.id),
      orderBy: desc(projects.updatedAt),
    });

    const projectsMemberData = await db.query.projectMembers.findMany({
      where: eq(projectMembers.userId, profileUser.id),
      with: {
        project: true,
      },
    });

    const showcasedItemsData = await db.query.showcasedItems.findMany({
      where: eq(showcasedItems.userId, profileUser.id),
      orderBy: [desc(showcasedItems.isPinned), asc(showcasedItems.order), desc(showcasedItems.showcasedAt)],
    });

    // Profile Completion Calculation
    let completedFields = 0;
    const totalFields = 10;

    if (profileUser.firstName) completedFields++;
    if (profileUser.lastName) completedFields++;
    if (profileUser.headline) completedFields++;
    if (profileUser.bio) completedFields++;
    if (profileUser.college) completedFields++;
    if (profileUser.location) completedFields++;
    if (profileUser.profilePicture) completedFields++;
    if (userSkillsData && userSkillsData.length > 0) completedFields++;
    if (educationData && educationData.length > 0) completedFields++;
    if (experienceData && experienceData.length > 0) completedFields++;

    const profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);

    // Connection Status Calculation
    let connectionStatus: ConnectionStatus = 'NOT_CONNECTED';
    let connectionRequestId: string | null = null;

    if (currentUserId) {
        if (currentUserId === profileUser.id) {
            connectionStatus = 'SELF';
        } else {
            // Check for existing connection
            const [userOneId, userTwoId] = [currentUserId, profileUser.id].sort();
            const connection = await db.query.connections.findFirst({
                where: and(
                    eq(connections.userOneId, userOneId),
                    eq(connections.userTwoId, userTwoId)
                ),
            });

            if (connection) {
                connectionStatus = 'CONNECTED';
            } else {
                // Check for pending connection request
                const request = await db.query.connectionRequests.findFirst({
                    where: and(
                        eq(connectionRequests.status, 'PENDING'),
                        or(
                            and(eq(connectionRequests.requesterId, currentUserId), eq(connectionRequests.recipientId, profileUser.id)),
                            and(eq(connectionRequests.requesterId, profileUser.id), eq(connectionRequests.recipientId, currentUserId))
                        )
                    ),
                });

                if (request) {
                    connectionRequestId = request.id;
                    connectionStatus = request.requesterId === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
                }
            }
        }
    }
    interface UserProfileSkills extends DetailedUserSkill {}
    interface UserProfileEducation extends Education {}
    interface UserProfileExperience extends Experience {}
    interface UserProfileProjectOwned extends Project {}
    interface UserProfileProjectMemberOf extends DetailedProjectMember {}
    interface UserProfileShowcasedItem extends DetailedShowcasedItem {}

    const userProfile: UserProfileDetails = {
      ...profileUser,
      skills: userSkillsData as UserProfileSkills[],
      education: educationData as UserProfileEducation[],
      experience: experienceData as UserProfileExperience[],
      projectsOwned: projectsOwnedData as UserProfileProjectOwned[],
      projectsMemberOf: projectsMemberData as UserProfileProjectMemberOf[],
      showcasedItems: showcasedItemsData.map(
      (item: ShowcasedItem): UserProfileShowcasedItem => ({
        ...item,
        skills: [] as Skill[], // No skills relation since you don't want the junction table
      })
      ),
      connectionStatus,
      connectionRequestId,
      profileCompletionPercentage,
    };

    return userProfile;

  } catch (error) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

/**
 * Type for the basic details of a connection requester.
 */
export type ConnectionRequesterInfo = Pick<
  User,
  'id' | 'username' | 'firstName' | 'lastName' | 'profilePicture' | 'headline'
>;

/**
 * Type for an incoming connection request with requester details.
 */
export type DetailedIncomingConnectionRequest = ConnectionRequest & {
  requester: ConnectionRequesterInfo;
};

/**
 * Fetches pending incoming connection requests for a given user.
 * @param userId - The ID of the user whose incoming requests are to be fetched.
 * @returns Array of detailed connection requests, or null on error.
 */
export const getIncomingConnectionRequests = async (
  userId: string
): Promise<DetailedIncomingConnectionRequest[] | null> => {
  try {
    if (!userId) return null;

    const requests = await db.query.connectionRequests.findMany({
      where: and(
        eq(connectionRequests.recipientId, userId),
        eq(connectionRequests.status, 'PENDING')
      ),
      with: {
        requester: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            headline: true,
          },
        },
      },
      orderBy: desc(connectionRequests.createdAt),
    });

    return requests as DetailedIncomingConnectionRequest[];

  } catch (error) {
    console.error("Error fetching incoming connection requests:", error);
    return null;
  }
};

/**
 * Fetches a summary (count) of incoming connection requests for the current user.
 * @returns An object with the count, or null if not authenticated/error.
 */
export const getIncomingConnectionRequestSummaryForClient = async (): Promise<{
  count: number;
} | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const requests = await db.query.connectionRequests.findMany({
      where: and(
        eq(connectionRequests.recipientId, currentUser.id),
        eq(connectionRequests.status, 'PENDING')
      ),
    });

    return { count: requests.length };
  } catch (error) {
    console.error("Error fetching incoming connection request count:", error);
    return null;
  }
};

// Example: Get user for server components using the server client
import { getAuthenticatedUser as getAuthUserAction } from "@/actions/auth"

export const getCurrentUser = async () => {
  const { data, error } = await getAuthUserAction()
  if (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
  return data
}

// Define a type for the Connection details including the connected user's profile
type ConnectedUser = Pick<
  User,
  'id' | 'username' | 'firstName' | 'lastName' | 'profilePicture' | 'headline'
>;

export type DetailedConnection = Omit<Connection, 'userOne' | 'userTwo'> & {
  connectedUser: ConnectedUser;
};

/**
 * Fetches established connections for a given user.
 * @param userId - The ID of the user whose connections are to be fetched.
 * @returns Array of detailed connections including the connected user's basic profile, or null on error.
 */
export const getEstablishedConnections = async (
  userId: string
): Promise<DetailedConnection[] | null> => {
  try {
    if (!userId) return null;

    const connectionsData = await db.query.connections.findMany({
      where: or(
        eq(connections.userOneId, userId),
        eq(connections.userTwoId, userId)
      ),
      with: {
        userOne: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            headline: true,
          },
        },
        userTwo: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            headline: true,
          },
        },
      },
      orderBy: desc(connections.createdAt),
    });

    // Map the results to the DetailedConnection format
    const detailedConnections: DetailedConnection[] = connectionsData.map((conn: any) => ({
      ...conn,
      connectedUser: conn.userOneId === userId ? conn.userTwo : conn.userOne,
    }));

    return detailedConnections;

  } catch (error) {
    console.error("Error fetching established connections:", error);
    return null;
  }
};

/**
 * Fetches AI-verified skills for a given user.
 * @param userId - The ID of the user whose AI-verified skills are to be fetched.
 * @returns Array of AI-verified skills, or null on error.
 */
export const getAIVerifiedSkillsByUserId = async (
  userId: string
): Promise<AIVerifiedSkill[] | null> => {
  try {
    if (!userId) return null;

    const verifiedSkills = await db.query.aiVerifiedSkills.findMany({
      where: and(
        eq(aiVerifiedSkills.userId, userId),
        eq(aiVerifiedSkills.isVisible, true)
      ),
      orderBy: [
        desc(aiVerifiedSkills.confidenceScore),
        desc(aiVerifiedSkills.repositoryCount),
        asc(aiVerifiedSkills.skillName)
      ],
    });

    return verifiedSkills;

  } catch (error) {
    console.error("Error fetching AI-verified skills:", error);
    return null;
  }
};

/**
 * Fetches AI-verified skills for a user by username.
 * @param username - The username of the user whose AI-verified skills are to be fetched.
 * @returns Array of AI-verified skills grouped by skill type, or null on error.
 */
export const getAIVerifiedSkillsByUsername = async (
  username: string
): Promise<{
  languages: AIVerifiedSkill[];
  frameworks: AIVerifiedSkill[];
  libraries: AIVerifiedSkill[];
  tools: AIVerifiedSkill[];
  databases: AIVerifiedSkill[];
  cloud: AIVerifiedSkill[];
  totalSkills: number;
  lastVerified: string | null;
} | null> => {
  try {
    if (!username) return null;

    // First get the user ID from username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
      columns: { id: true },
    });

    if (!user) return null;

    const verifiedSkills = await getAIVerifiedSkillsByUserId(user.id);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AI Skills Debug] Username:', username, 'UserId:', user.id);
      console.log('[AI Skills Debug] Raw verified skills count:', verifiedSkills?.length || 0);
      if (verifiedSkills && verifiedSkills.length > 0) {
        console.log('[AI Skills Debug] First 3 skills sample:', verifiedSkills.slice(0,3).map(s => ({
          skillName: s.skillName,
          skillType: s.skillType,
          confidenceScore: s.confidenceScore,
          isVisible: s.isVisible,
          verifiedAt: s.verifiedAt
        })));
      }
    }

    if (!verifiedSkills) {
      return {
        languages: [],
        frameworks: [],
        libraries: [],
        tools: [],
        databases: [],
        cloud: [],
        totalSkills: 0,
        lastVerified: null
      };
    }

    const groupedSkills = {
      languages: verifiedSkills.filter(skill => skill.skillType === 'LANGUAGE'),
      frameworks: verifiedSkills.filter(skill => skill.skillType === 'FRAMEWORK'),
      libraries: verifiedSkills.filter(skill => skill.skillType === 'LIBRARY'),
      tools: verifiedSkills.filter(skill => skill.skillType === 'TOOL'),
      databases: verifiedSkills.filter(skill => skill.skillType === 'DATABASE'),
      cloud: verifiedSkills.filter(skill => skill.skillType === 'CLOUD'),
      totalSkills: verifiedSkills.length,
      lastVerified: verifiedSkills.length > 0 
        ? verifiedSkills.sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime())[0].verifiedAt.toISOString()
        : null
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AI Skills Debug] Grouped counts:', {
        languages: groupedSkills.languages.length,
        frameworks: groupedSkills.frameworks.length,
        libraries: groupedSkills.libraries.length,
        tools: groupedSkills.tools.length,
        databases: groupedSkills.databases.length,
        cloud: groupedSkills.cloud.length,
        total: groupedSkills.totalSkills
      });
    }

    return groupedSkills;

  } catch (error) {
    console.error("Error fetching AI-verified skills by username:", error);
    return null;
  }
};


