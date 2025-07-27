'use server'

import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/data/user"; // Assuming this fetches the internal DB user
import { users, connections, connectionRequests, projectMembers, projects, projectApplications, userSkills, skills, notifications } from "@0unveiled/database";
import { eq, or, and, desc } from "drizzle-orm";

// Define enum values as constants for Drizzle compatibility
const ProjectStatusValues = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
const ApplicationStatusValues = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
const ConnectionStatusValues = ["PENDING", "ACCEPTED", "REJECTED"] as const;
const ProjectVisibilityValues = ["PUBLIC", "PRIVATE"] as const;
const MemberRoleValues = ["OWNER", "ADMIN", "LEADER", "MEMBER"] as const;
const NotificationTypeValues = ["CONNECTION_REQUEST", "PROJECT_INVITE", "TASK_ASSIGNMENT", "MENTION", "GENERAL"] as const;

// Define the structure for the dashboard data
export interface DashboardData {
  userProfile: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    headline: string | null;
    profilePicture: string | null;
    profileCompletionPercentage: number;
    incompleteFields: string[]; // Added field for incomplete items
  } | null;
  metrics: {
    connectionCount: number;
    pendingConnectionRequestCount: number;
    activeProjectCount: number;
    pendingApplicationsReceivedCount: number;
    pendingApplicationsSentCount: number;
  };
  projects: Array<{
    id: string;
    title: string;
    status: typeof ProjectStatusValues[number];
    visibility: typeof ProjectVisibilityValues[number]; // Use direct enum
    owner: { username: string | null };
    userRole: typeof MemberRoleValues[number]; // Use direct enum
    pendingApplicationCount: number; // Count for projects owned by the user
  }>;
  applicationsSent: Array<{
    id: string;
    project: { id: string; title: string };
    projectRole: { id: string; title: string } | null;
    status: typeof ApplicationStatusValues[number];
    submittedAt: Date;
  }>;
  connectionRequestsReceived: Array<{
    id: string;
    requester: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      profilePicture: string | null;
      headline: string | null;
    };
    createdAt: Date;
  }>;
  // Add other necessary data structures here (e.g., skills, notifications, activity)
  skills: Array<{
      id: string;
      name: string;
      category?: string | null;
      level?: number | null; // Assuming UserSkill might have level
  }>;
   notifications: Array<{
       id: string;
       type: typeof NotificationTypeValues[number]; // Use direct enum
       content: string;
       linkUrl: string | null;
       isRead: boolean;
       createdAt: Date;
   }>;
}

export const getDashboardData = async (): Promise<DashboardData | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error("getDashboardData: User not authenticated.");
      return null;
    }
    const userId = currentUser.id;

    // Fetch all data in parallel using Promise.all
    const [
      userProfileData,
      connectionCount,
      pendingConnectionRequestCount,
      projectsData,
      applicationsSentData,
      connectionRequestsReceivedData,
      skillsData,
      notificationsData
    ] = await Promise.all([
      // 1. User Profile with Completion
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          headline: true,
          profilePicture: true,
          bio: true,
          college: true,
          location: true
        },
        with: {
          skills: {
            columns: {
              skillId: true
            }
          },
          education: {
            columns: {
              id: true
            }
          },
          experience: {
            columns: {
              id: true
            }
          }
        }
      }),
      // 2. Connection Count
      db.query.connections.findMany({
        where: or(eq(connections.userOneId, userId), eq(connections.userTwoId, userId))
      }).then(connections => connections.length),
      // 3. Pending Incoming Connection Requests Count
      db.query.connectionRequests.findMany({
        where: and(eq(connectionRequests.recipientId, userId), eq(connectionRequests.status, "PENDING"))
      }).then(requests => requests.length),
      // 4. Projects (Owned & Member)
      db.query.projectMembers.findMany({
        where: eq(projectMembers.userId, userId),
        with: {
          project: {
            columns: {
              id: true,
              title: true,
              status: true,
              visibility: true,
              ownerId: true
            },
            with: {
              owner: {
                columns: {
                  username: true
                }
              },
              applications: {
                where: eq(projectApplications.status, "PENDING"),
                columns: {
                  id: true
                }
              }
            }
          }
        },
        orderBy: [desc(projectMembers.createdAt)],
        limit: 5
      }),
      // 5. Applications Sent
      db.query.projectApplications.findMany({
        where: eq(projectApplications.userId, userId),
        columns: {
          id: true,
          status: true,
          submittedAt: true
        },
        with: {
          project: {
            columns: {
              id: true,
              title: true
            }
          },
          projectRole: {
            columns: {
              id: true,
              title: true
            }
          }
        },
        orderBy: [desc(projectApplications.submittedAt)],
        limit: 5
      }),
      // 6. Connection Requests Received
      db.query.connectionRequests.findMany({
        where: and(eq(connectionRequests.recipientId, userId), eq(connectionRequests.status, "PENDING")),
        columns: {
          id: true,
          createdAt: true
        },
        with: {
          requester: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              headline: true
            }
          }
        },
        orderBy: [desc(connectionRequests.createdAt)],
        limit: 5
      }),
       // 7. User Skills (for Radar Chart)
       db.query.userSkills.findMany({
           where: eq(userSkills.userId, userId),
           with: {
               skill: {
                   columns: {
                       id: true,
                       name: true,
                       category: true
                   }
               }
           },
           limit: 7
       }),
        // 8. Notifications (Recent Unread)
        db.query.notifications.findMany({
            where: and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
            orderBy: [desc(notifications.createdAt)],
            limit: 5
        }),
    ]);

    // --- Calculate Profile Completion & Incomplete Fields ---
     let profileCompletionPercentage = 0;
     const incompleteFields: string[] = [];
     if (userProfileData) {
         let completedFields = 0;
         const totalFields = 10; // Keep consistent

         if (userProfileData.firstName) completedFields++; // else incompleteFields.push("First Name"); - Usually required
         if (userProfileData.lastName) completedFields++; else incompleteFields.push("Add your Last Name");
         if (userProfileData.headline) completedFields++; else incompleteFields.push("Add a Profile Headline");
         if (userProfileData.bio) completedFields++; else incompleteFields.push("Write a Bio");
         if (userProfileData.college) completedFields++; else incompleteFields.push("Add your College");
         if (userProfileData.location) completedFields++; else incompleteFields.push("Add your Location");
         if (userProfileData.profilePicture) completedFields++; else incompleteFields.push("Upload a Profile Picture");
         if (userProfileData.skills.length > 0) completedFields++; else incompleteFields.push("Add Skills");
         if (userProfileData.education.length > 0) completedFields++; else incompleteFields.push("Add Education History");
         if (userProfileData.experience.length > 0) completedFields++; else incompleteFields.push("Add Work Experience");

         profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
     }
     // --- End Calculation ---


    // Process Projects Data
    const processedProjects = projectsData.map(pm => ({
        id: pm.project.id,
        title: pm.project.title,
        status: pm.project.status,
        visibility: pm.project.visibility,
        owner: pm.project.owner,
        userRole: pm.role,
        pendingApplicationCount: pm.project.applications.length,
    }));

     // Process Skills Data
    const processedSkills = skillsData.map(us => ({
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category,
        level: us.level,
    }));

     // Count active projects and pending apps received/sent
    const activeProjectCount = processedProjects.filter(p => p.status === "ACTIVE").length;
    const pendingApplicationsReceivedCount = processedProjects.reduce((sum, p) => sum + p.pendingApplicationCount, 0);
    const pendingApplicationsSentCount = applicationsSentData.filter(app => app.status === "PENDING").length;


    // Assemble the final DashboardData object
    const dashboardData: DashboardData = {
      userProfile: userProfileData ? {
           id: userProfileData.id,
           firstName: userProfileData.firstName,
           lastName: userProfileData.lastName,
           username: userProfileData.username,
           headline: userProfileData.headline,
           profilePicture: userProfileData.profilePicture,
           profileCompletionPercentage: profileCompletionPercentage,
           incompleteFields: incompleteFields // Include the list
      } : null,
      metrics: {
        connectionCount,
        pendingConnectionRequestCount,
        activeProjectCount,
        pendingApplicationsReceivedCount,
        pendingApplicationsSentCount,
      },
      projects: processedProjects,
      applicationsSent: applicationsSentData,
      connectionRequestsReceived: connectionRequestsReceivedData,
      skills: processedSkills,
      notifications: notificationsData,
    };

    return dashboardData;

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Optionally return partial data or a specific error structure
    return null;
  }
};