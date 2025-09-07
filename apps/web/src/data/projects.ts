// Frontend-safe project data types and placeholders
// Keep client components decoupled from server-only schema by defining minimal shapes here.

// Basic skill summary used in project forms and lists
export type SkillSummary = {
  id: string;
  name: string;
  category?: string | null;
};

// Member role values (mirror of memberRoleEnum on the server)
export type MemberRole = "LEADER" | "MEMBER" | "ADMIN";

// Lightweight user summary used in project team views
export type UserSummary = {
  id: string;
  username?: string | null;
  profilePicture?: string | null;
  skills?: SkillSummary[];
};

// Project role brief
export type ProjectRoleBrief = {
  id: string;
  title?: string | null;
  description?: string | null;
  requiredSkills: SkillSummary[];
};

// Member summary used by team components
export type MemberSummary = {
  user: UserSummary;
  role: MemberRole;
  projectRole?: { id?: string; title?: string | null } | null;
};

// Project status/visibility (mirror server enums without importing them client-side)
export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type ProjectVisibility = "PUBLIC" | "PRIVATE";

// Project shape used by forms and preview components
export type ProjectProp = {
  id: string;
  title: string;
  publicSummary: string;
  description?: string | null;
  htmlDescription?: string | null;
  jsonDescription?: any;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  requiredSkills: SkillSummary[];
  roles?: ProjectRoleBrief[];
  members?: MemberSummary[];
};

// Placeholder fetchers – wire these to real APIs/DB when ready
export async function getAllReviewedProjects(): Promise<ProjectProp[]> {
  return [];
}

export async function getProjectById(id: string): Promise<ProjectProp | null> {
  return null;
}