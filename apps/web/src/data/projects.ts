"use server"

import { db } from "@/lib/drizzle"
import { projects, projectMembers, projectRoles, projectSkills, userSkills, skills, projectApplications, users } from "@0unveiled/database"
import { eq, desc, asc } from "drizzle-orm"
import { getUserBySupabaseId } from "./user"
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Define enum values as constants for Drizzle compatibility
const ProjectStatusValues = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
const ProjectVisibilityValues = ["PUBLIC", "PRIVATE"] as const;
const MemberRoleValues = ["OWNER", "ADMIN", "LEADER", "MEMBER"] as const;

// Define the experience level type from Prisma schema
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"

// --- Define sub-types for the final ProjectProp --- 
interface SkillSummary {
  id: string;
  name: string;
  category?: string | null; // Made category optional as it might not always be present
}

interface RoleSummary {
    id: string;
    title: string;
    description: string | null;
    requiredSkills: SkillSummary[];
}

// --- UPDATED MemberSummary to include user skills and simplify role --- 
export interface MemberSummary {
    user: {
        id: string;
        username: string | null;
        profilePicture: string | null;
        headline: string | null;
        skills: Pick<SkillSummary, 'id' | 'name'>[]; // Added user skills
    };
    role: typeof MemberRoleValues[number]; // Keep the base role enum
    projectRole: { // Removed specific projectRole details for now
        id: string;
        title: string;
    } | null;
}

interface OwnerSummary {
    id: string;
    username: string | null;
    profilePicture: string | null;
    headline: string | null;
    supabaseId?: string | null;
}

// Updated ProjectProp to use the updated MemberSummary
export interface ProjectProp {
  id: string;
  title: string;
  publicSummary: string;
  htmlDescription: string;
  jsonDescription: string;
  description: string;
  status: typeof ProjectStatusValues[number];
  visibility: typeof ProjectVisibilityValues[number];
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner: OwnerSummary;
  members: MemberSummary[];
  requiredSkills: SkillSummary[];
  roles: RoleSummary[];
}

export interface PrivateProjectSummary {
  id: string;
  title: string;
  status: typeof ProjectStatusValues[number];
  publicSummary: string;
  owner: OwnerSummary;
  role: string;
  type: string;
  description: string;
  visibility: typeof ProjectVisibilityValues[number]
}

// Updated transform function with proper type handling
const transformProjectData = (project: any): ProjectProp => {
  // Ensure jsonDescription is always a string
  let jsonString: string;
  if (project.jsonDescription === null || project.jsonDescription === undefined) {
    jsonString = "";
  } else if (typeof project.jsonDescription === 'string') {
    jsonString = project.jsonDescription;
  } else {
    try {
      jsonString = JSON.stringify(project.jsonDescription);
    } catch (e) {
      console.error("Failed to stringify jsonDescription:", e);
      jsonString = ""; // Fallback to empty string on error
    }
  }

  return {
    id: project.id,
    title: project.title,
    publicSummary: project.publicSummary,
    description: project.description,
    htmlDescription: project.htmlDescription ?? "",
    jsonDescription: jsonString, // Use the processed string
    status: project.status,
    visibility: project.visibility,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ownerId: project.ownerId,
    owner: {
      id: project.owner.id,
      username: project.owner.username,
      profilePicture: project.owner.profilePicture,
      headline: project.owner.headline,
    },
    members: project.members?.map((member: any) => ({
      user: {
        id: member.user.id,
        username: member.user.username,
        profilePicture: member.user.profilePicture,
        headline: member.user.headline,
        skills: member.user.skills?.map((userSkill: any) => ({
            id: userSkill.skill.id,
            name: userSkill.skill.name
        })) || [],
      },
      projectRole: member.projectRole ? {
        id: member.projectRole.id,
        title: member.projectRole.title
      } : null,
      role: member.role,
    })) || [],
    requiredSkills: project.requiredSkills?.map((projSkill: any) => ({
      id: projSkill.skill.id,
      name: projSkill.skill.name,
      category: projSkill.skill.category,
    })) || [],
    
    roles: project.roles?.map((role: any) => ({
      id: role.id,
      title: role.title,
      description: role.description,
      requiredSkills: role.requiredSkills?.map((roleSkill: any) => ({
        id: roleSkill.skill.id,
        name: roleSkill.skill.name,
        category: roleSkill.skill.category,
      })) || []
    })) || []
  }
};

// Optimized getAllProjects to fetch only necessary data and reduce payload
export const getAllProjects = async (): Promise<ProjectProp[] | null> => {
  try {
    const projectsData = await db.query.projects.findMany({
      with: {
        owner: {
          columns: {
            id: true,
            username: true,
            supabaseId: true,
            profilePicture: true,
            headline: true,
            role: true
          }
        },
        members: {
          with: {
            projectRole: {
              columns: {
                id: true,
                title: true
              }
            },
            user: {
              columns: {
                id: true,
                username: true,
                profilePicture: true,
                headline: true
              },
              with: {
                skills: {
                  with: {
                    skill: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        requiredSkills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        roles: {
          with: {
            requiredSkills: {
              with: {
                skill: {
                  columns: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return projectsData.map(transformProjectData)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return null
  }
}

// Optimized getAllReviewedProjects similarly
export const getAllReviewedProjects = async (): Promise<ProjectProp[] | null> => {
  try {
    const projectsData = await db.query.projects.findMany({
      where: eq(projects.status, "ACTIVE"),
      with: {
        owner: {
          columns: {
            id: true,
            username: true,
            supabaseId: true,
            profilePicture: true,
            headline: true,
            role: true
          }
        },
        members: {
          with: {
            projectRole: {
              columns: {
                id: true,
                title: true
              }
            },
            user: {
              columns: {
                id: true,
                username: true,
                profilePicture: true,
                headline: true
              },
              with: {
                skills: {
                  with: {
                    skill: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        requiredSkills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        roles: {
          with: {
            requiredSkills: {
              with: {
                skill: {
                  columns: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [desc(projects.createdAt)]
    })

    return projectsData.map(transformProjectData)
  } catch (error) {
    console.error("Get All Reviewed Projects Error: ", error)
    return null
  }
}

// Get project by ID
export const getProjectById = async (id: string): Promise<ProjectProp | null> => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        owner: {
          columns: {
            id: true,
            username: true,
            supabaseId: true,
            profilePicture: true,
            headline: true,
            role: true
          }
        },
        members: {
          with: {
            projectRole: {
              columns: {
                id: true,
                title: true
              }
            },
            user: {
              columns: {
                id: true,
                username: true,
                profilePicture: true,
                headline: true
              },
              with: {
                skills: {
                  with: {
                    skill: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        requiredSkills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        roles: {
          with: {
            requiredSkills: {
              with: {
                skill: {
                  columns: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!project) return null
    return transformProjectData(project)
  } catch (error) {
    console.error("Get Project By ID Error:", error)
    return null
  }
}

// Get projects by user ID
export const getProjectsByUserId = async (userId: string | null): Promise<ProjectProp[] | null> => {
  if (!userId) return null

  try {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.ownerId, userId),
      with: {
        owner: {
          columns: {
            id: true,
            username: true,
            supabaseId: true,
            profilePicture: true,
            headline: true,
            role: true
          }
        },
        members: {
          with: {
            projectRole: {
              columns: {
                id: true,
                title: true
              }
            },
            user: {
              columns: {
                id: true,
                username: true,
                profilePicture: true,
                headline: true
              },
              with: {
                skills: {
                  with: {
                    skill: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        requiredSkills: {
          with: {
            skill: {
              columns: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        roles: {
          with: {
            requiredSkills: {
              with: {
                skill: {
                  columns: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return userProjects.map(transformProjectData)
  } catch (error) {
    console.error("Get Projects By User ID Error:", error)
    return null
  }
}

// Check if project exists
export const isProjectExist = async (title: string): Promise<boolean> => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.title, title)
    })
    return !!project
  } catch (error) {
    console.error("Check Project Exists Error:", error)
    return false
  }
}

// Get all applications for a project
export const getAllProjectApplications = async (projectId: string) => {
  try {
    const applications = await db.query.projectApplications.findMany({
      where: eq(projectApplications.projectId, projectId),
      with: {
        user: {
          with: {
            skills: {
              with: {
                skill: true
              }
            }
          }
        }
      }
    })
    return applications
  } catch (error) {
    console.error("Get Project Applications Error:", error)
    return null
  }
}

// Get user's applications for a project
export const getUserProjectApplications = async (userId: string, projectId: string) => {
    try {
        const applications = await db.query.projectApplications.findMany({
            where: eq(projectApplications.userId, userId) && eq(projectApplications.projectId, projectId),
            with: {
                user: {
                    with: {
                        skills: {
                            with: {
                                skill: true
                            }
                        }
                    }
                }
            }
        });
        return applications;
    } catch (error) {
        console.error("Get User Project Applications Error:", error);
        return null;
    }
};

// Get current user's applications for a specific project
export const getCurrentUserApplicationsForProject = async (projectId: string) => {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return []; // No user logged in, no applications
        }
        
        const dbUser = await getUserBySupabaseId(authUser.id);
        if (!dbUser) {
            console.warn(`No DB user found for Supabase ID: ${authUser.id} when checking applications for project ${projectId}`);
            return []; // User not found in DB
        }

        const applications = await db.query.projectApplications.findMany({
            where: eq(projectApplications.userId, dbUser.id) && eq(projectApplications.projectId, projectId),
            columns: {
                id: true,
                projectRoleId: true, // Need this to map status to role
                status: true
            }
        });
        
        return applications; // Return the raw application data

    } catch (error) {
        console.error("Error fetching current user's project applications:", error);
        return []; // Return empty array on error
    }
};
