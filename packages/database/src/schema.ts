import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);
export const projectStatusEnum = pgEnum("project_status", [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);
export const projectVisibilityEnum = pgEnum("project_visibility", [
  "PUBLIC",
  "PRIVATE",
]);
export const memberRoleEnum = pgEnum("member_role", [
  "LEADER",
  "MEMBER",
  "ADMIN",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export const channelTypeEnum = pgEnum("channel_type", [
  "PUBLIC_PROJECT",
  "PRIVATE_PROJECT",
  "PUBLIC_CLUB",
  "PRIVATE_CLUB",
  "DIRECT_MESSAGE",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "PROJECT_INVITE",
  "PROJECT_UPDATE",
  "APPLICATION_RECEIVED",
  "APPLICATION_STATUS_UPDATE",
  "NEW_MESSAGE",
  "NEW_FOLLOWER",
  "SYSTEM_ALERT",
  "INTEGRATION_UPDATE",
  "CONNECTION_REQUEST_RECEIVED",
  "CONNECTION_REQUEST_ACCEPTED",
  "TASK_ASSIGNED",
  "TASK_UPDATED",
]);
export const integrationProviderEnum = pgEnum("integration_provider", [
  "GITHUB",
  "DRIBBBLE",
  "BEHANCE",
  "MEDIUM",
  "FIGMA",
  "YOUTUBE",
  "NOTION",
  "SUBSTACK",
  "CUSTOM",
]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "BLOCKED",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
]);
export const emailFrequencyEnum = pgEnum("email_frequency", [
  "IMMEDIATE",
  "DAILY",
  "WEEKLY",
  "NEVER",
]);

// Users table
export const users = pgTable(
  "User",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supabaseId: text("supabaseId").notNull().unique(),
    email: text("email").notNull().unique(),
    username: text("username").unique(),
    firstName: text("firstName").notNull(),
    lastName: text("lastName"),
    profilePicture: text("profilePicture"),
    bio: text("bio"),
    role: roleEnum("role").notNull().default("USER"),
    onboarded: boolean("onboarded").notNull().default(false),
    lastLogin: timestamp("lastLogin"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    location: text("location"),
    websiteUrl: text("websiteUrl"),
    githubUrl: text("githubUrl"),
    linkedinUrl: text("linkedinUrl"),
    twitterUrl: text("twitterUrl"),
    behanceUrl: text("behanceUrl"),
    dribbbleUrl: text("dribbbleUrl"),
    college: text("college"),
    headline: text("headline"),
    emailFrequency: emailFrequencyEnum("emailFrequency")
      .notNull()
      .default("IMMEDIATE"),
    notifyAchievements: boolean("notifyAchievements").notNull().default(true),
    notifyConnections: boolean("notifyConnections").notNull().default(true),
    notifyEvents: boolean("notifyEvents").notNull().default(true),
    notifyMessages: boolean("notifyMessages").notNull().default(true),
    notifyProjects: boolean("notifyProjects").notNull().default(true),
  },
  (table) => ({
    emailIdx: index("User_email_idx").on(table.email),
    usernameIdx: index("User_username_idx").on(table.username),
    supabaseIdIdx: index("User_supabaseId_idx").on(table.supabaseId),
  }),
);

// Accounts table
export const accounts = pgTable(
  "Account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    expiresAt: integer("expiresAt"),
    idToken: text("idToken"),
    scope: text("scope"),
    sessionState: text("sessionState"),
    tokenType: text("tokenType"),
    installationId: text("installationId"),
  },
  (table) => ({
    providerAccountIdIdx: uniqueIndex(
      "Account_provider_providerAccountId_key",
    ).on(table.provider, table.providerAccountId),
    userIdIdx: index("Account_userId_idx").on(table.userId),
  }),
);

// Skills table
export const skills = pgTable(
  "Skill",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    category: text("category"),
  },
  (table) => ({
    nameIdx: index("Skill_name_idx").on(table.name),
  }),
);

// UserSkills table (many-to-many)
export const userSkills = pgTable(
  "UserSkill",
  {
    userId: text("userId").notNull(),
    skillId: text("skillId").notNull(),
    level: integer("level"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.skillId] }),
    userIdIdx: index("UserSkill_userId_idx").on(table.userId),
    skillIdIdx: index("UserSkill_skillId_idx").on(table.skillId),
  }),
);

// Projects table
export const projects = pgTable(
  "Project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").notNull().default("PLANNING"),
    visibility: projectVisibilityEnum("visibility").notNull().default("PUBLIC"),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    ownerId: text("ownerId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    publicSummary: text("publicSummary").notNull(),
    htmlDescription: text("htmlDescription"),
    jsonDescription: json("jsonDescription"),
  },
  (table) => ({
    ownerIdIdx: index("Project_ownerId_idx").on(table.ownerId),
    statusIdx: index("Project_status_idx").on(table.status),
    visibilityIdx: index("Project_visibility_idx").on(table.visibility),
  }),
);

// ProjectMembers table (many-to-many)
export const projectMembers = pgTable(
  "ProjectMember",
  {
    userId: text("userId").notNull(),
    projectId: text("projectId").notNull(),
    role: memberRoleEnum("role").notNull().default("MEMBER"),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
    projectRoleId: text("projectRoleId"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.projectId] }),
    userIdIdx: index("ProjectMember_userId_idx").on(table.userId),
    projectIdIdx: index("ProjectMember_projectId_idx").on(table.projectId),
    projectRoleIdIdx: index("ProjectMember_projectRoleId_idx").on(
      table.projectRoleId,
    ),
  }),
);

// ProjectSkills table (many-to-many)
export const projectSkills = pgTable(
  "ProjectSkill",
  {
    projectId: text("projectId").notNull(),
    skillId: text("skillId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.skillId] }),
    projectIdIdx: index("ProjectSkill_projectId_idx").on(table.projectId),
    skillIdIdx: index("ProjectSkill_skillId_idx").on(table.skillId),
  }),
);

// ProjectApplications table
export const projectApplications = pgTable(
  "ProjectApplication",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    projectId: text("projectId").notNull(),
    message: text("message"),
    status: applicationStatusEnum("status").notNull().default("PENDING"),
    submittedAt: timestamp("submittedAt").notNull().defaultNow(),
    reviewedAt: timestamp("reviewedAt"),
    projectRoleId: text("projectRoleId"),
  },
  (table) => ({
    uniqueApplication: uniqueIndex(
      "ProjectApplication_userId_projectId_projectRoleId_key",
    ).on(table.userId, table.projectId, table.projectRoleId),
    userIdIdx: index("ProjectApplication_userId_idx").on(table.userId),
    projectIdIdx: index("ProjectApplication_projectId_idx").on(table.projectId),
    projectRoleIdIdx: index("ProjectApplication_projectRoleId_idx").on(
      table.projectRoleId,
    ),
    statusIdx: index("ProjectApplication_status_idx").on(table.status),
  }),
);

// Clubs table
export const clubs = pgTable(
  "Club",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    ownerId: text("ownerId").notNull(),
    isPrivate: boolean("isPrivate").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("Club_ownerId_idx").on(table.ownerId),
    nameIdx: index("Club_name_idx").on(table.name),
  }),
);

// ClubMembers table (many-to-many)
export const clubMembers = pgTable(
  "ClubMember",
  {
    userId: text("userId").notNull(),
    clubId: text("clubId").notNull(),
    role: memberRoleEnum("role").notNull().default("MEMBER"),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.clubId] }),
    userIdIdx: index("ClubMember_userId_idx").on(table.userId),
    clubIdIdx: index("ClubMember_clubId_idx").on(table.clubId),
  }),
);

// Channels table
export const channels = pgTable(
  "Channel",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    type: channelTypeEnum("type").notNull(),
    projectId: text("projectId"),
    clubId: text("clubId"),
    isPublic: boolean("isPublic").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("Channel_projectId_idx").on(table.projectId),
    clubIdIdx: index("Channel_clubId_idx").on(table.clubId),
    typeIdx: index("Channel_type_idx").on(table.type),
  }),
);

// ChannelMembers table (many-to-many)
export const channelMembers = pgTable(
  "ChannelMember",
  {
    userId: text("userId").notNull(),
    channelId: text("channelId").notNull(),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
    lastReadAt: timestamp("lastReadAt"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.channelId] }),
    userIdIdx: index("ChannelMember_userId_idx").on(table.userId),
    channelIdIdx: index("ChannelMember_channelId_idx").on(table.channelId),
  }),
);

// Messages table
export const messages = pgTable(
  "Message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    content: text("content").notNull(),
    channelId: text("channelId").notNull(),
    authorId: text("authorId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    deleted: boolean("deleted").notNull().default(false),
    readAt: timestamp("readAt"),
  },
  (table) => ({
    channelIdCreatedAtIdx: index("Message_channelId_createdAt_idx").on(
      table.channelId,
      table.createdAt,
    ),
    authorIdIdx: index("Message_authorId_idx").on(table.authorId),
  }),
);

// Notifications table
export const notifications = pgTable(
  "Notification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    type: notificationTypeEnum("type").notNull(),
    content: text("content").notNull(),
    linkUrl: text("linkUrl"),
    isRead: boolean("isRead").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIsReadCreatedAtIdx: index(
      "Notification_userId_isRead_createdAt_idx",
    ).on(table.userId, table.isRead, table.createdAt),
  }),
);

// VerificationTokens table
export const verificationTokens = pgTable(
  "VerificationToken",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    emailTokenIdx: uniqueIndex("VerificationToken_email_token_key").on(
      table.email,
      table.token,
    ),
  }),
);

// Posts table
export const posts = pgTable(
  "Post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    content: text("content").notNull(),
    authorId: text("authorId").notNull(),
    projectId: text("projectId"),
    clubId: text("clubId"),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    authorIdIdx: index("Post_authorId_idx").on(table.authorId),
    projectIdIdx: index("Post_projectId_idx").on(table.projectId),
    clubIdIdx: index("Post_clubId_idx").on(table.clubId),
    publishedPublishedAtIdx: index("Post_published_publishedAt_idx").on(
      table.published,
      table.publishedAt,
    ),
  }),
);

// Huddles table
export const huddles = pgTable(
  "Huddle",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime"),
    meetingUrl: text("meetingUrl"),
    organizerId: text("organizerId").notNull(),
    relatedProjectId: text("relatedProjectId"),
    relatedClubId: text("relatedClubId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    organizerIdIdx: index("Huddle_organizerId_idx").on(table.organizerId),
    startTimeIdx: index("Huddle_startTime_idx").on(table.startTime),
  }),
);

// HuddleAttendees table (many-to-many)
export const huddleAttendees = pgTable(
  "HuddleAttendee",
  {
    userId: text("userId").notNull(),
    huddleId: text("huddleId").notNull(),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.huddleId] }),
    userIdIdx: index("HuddleAttendee_userId_idx").on(table.userId),
    huddleIdIdx: index("HuddleAttendee_huddleId_idx").on(table.huddleId),
  }),
);

// Education table
export const education = pgTable(
  "Education",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    institution: text("institution").notNull(),
    degree: text("degree"),
    fieldOfStudy: text("fieldOfStudy"),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),
    description: text("description"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    current: boolean("current").notNull().default(false),
  },
  (table) => ({
    userIdIdx: index("Education_userId_idx").on(table.userId),
  }),
);

// Experience table
export const experience = pgTable(
  "Experience",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    companyName: text("companyName").notNull(),
    jobTitle: text("jobTitle").notNull(),
    location: text("location"),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),
    description: text("description"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    current: boolean("current").notNull().default(false),
  },
  (table) => ({
    userIdIdx: index("Experience_userId_idx").on(table.userId),
  }),
);

// Badges table
export const badges = pgTable("Badge", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconUrl: text("iconUrl"),
  criteria: text("criteria"),
});

// UserBadges table (many-to-many)
export const userBadges = pgTable(
  "UserBadge",
  {
    userId: text("userId").notNull(),
    badgeId: text("badgeId").notNull(),
    awardedAt: timestamp("awardedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.badgeId] }),
    userIdIdx: index("UserBadge_userId_idx").on(table.userId),
    badgeIdIdx: index("UserBadge_badgeId_idx").on(table.badgeId),
  }),
);

// ConnectionRequests table
export const connectionRequests = pgTable(
  "ConnectionRequest",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requesterId").notNull(),
    recipientId: text("recipientId").notNull(),
    status: connectionStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    uniqueRequest: uniqueIndex(
      "ConnectionRequest_requesterId_recipientId_key",
    ).on(table.requesterId, table.recipientId),
    requesterIdIdx: index("ConnectionRequest_requesterId_idx").on(
      table.requesterId,
    ),
    recipientIdIdx: index("ConnectionRequest_recipientId_idx").on(
      table.recipientId,
    ),
    statusIdx: index("ConnectionRequest_status_idx").on(table.status),
  }),
);

// Connections table (many-to-many)
export const connections = pgTable(
  "Connection",
  {
    userOneId: text("userOneId").notNull(),
    userTwoId: text("userTwoId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userOneId, table.userTwoId] }),
    userOneIdIdx: index("Connection_userOneId_idx").on(table.userOneId),
    userTwoIdIdx: index("Connection_userTwoId_idx").on(table.userTwoId),
  }),
);

// ProjectRoles table
export const projectRoles = pgTable(
  "ProjectRole",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    projectId: text("projectId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("ProjectRole_projectId_idx").on(table.projectId),
  }),
);

// ProjectRoleSkills table (many-to-many)
export const projectRoleSkills = pgTable(
  "ProjectRoleSkill",
  {
    projectRoleId: text("projectRoleId").notNull(),
    skillId: text("skillId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectRoleId, table.skillId] }),
    projectRoleIdIdx: index("ProjectRoleSkill_projectRoleId_idx").on(
      table.projectRoleId,
    ),
    skillIdIdx: index("ProjectRoleSkill_skillId_idx").on(table.skillId),
  }),
);

// Tasks table
export const tasks = pgTable(
  "Task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("TODO"),
    priority: integer("priority"),
    dueDate: timestamp("dueDate"),
    projectId: text("projectId").notNull(),
    assigneeId: text("assigneeId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    order: integer("order"),
  },
  (table) => ({
    projectIdIdx: index("Task_projectId_idx").on(table.projectId),
    assigneeIdIdx: index("Task_assigneeId_idx").on(table.assigneeId),
    statusIdx: index("Task_status_idx").on(table.status),
    dueDateIdx: index("Task_dueDate_idx").on(table.dueDate),
    projectIdStatusOrderIdx: index("Task_projectId_status_order_idx").on(
      table.projectId,
      table.status,
      table.order,
    ),
  }),
);

// ShowcasedItems table
export const showcasedItems = pgTable(
  "ShowcasedItem",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    provider: integrationProviderEnum("provider").notNull(),
    externalId: text("externalId").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    imageUrl: text("imageUrl"),
    metadata: json("metadata"),
    showcasedAt: timestamp("showcasedAt").notNull().defaultNow(),
    lastSyncedAt: timestamp("lastSyncedAt"),
    order: integer("order"),
    internalProjectId: text("internalProjectId"),
    roleInItem: text("roleInItem"),
    isPinned: boolean("isPinned").notNull().default(false),
  },
  (table) => ({
    uniqueShowcasedItem: uniqueIndex(
      "ShowcasedItem_userId_provider_externalId_key",
    ).on(table.userId, table.provider, table.externalId),
    userIdIdx: index("ShowcasedItem_userId_idx").on(table.userId),
    providerIdx: index("ShowcasedItem_provider_idx").on(table.provider),
    internalProjectIdIdx: index("ShowcasedItem_internalProjectId_idx").on(
      table.internalProjectId,
    ),
  }),
);

// ShowcasedItemSkills table (many-to-many)
export const showcasedItemSkills = pgTable(
  "ShowcasedItemSkills",
  {
    showcasedItemId: text("showcasedItemId").notNull(),
    skillId: text("skillId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.showcasedItemId, table.skillId] }),
    showcasedItemIdIdx: index("ShowcasedItemSkills_showcasedItemId_idx").on(
      table.showcasedItemId,
    ),
    skillIdIdx: index("ShowcasedItemSkills_skillId_idx").on(table.skillId),
  }),
);

// KnowledgeArticles table
export const knowledgeArticles = pgTable("KnowledgeArticle", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  sourceUrl: text("sourceUrl"),
  content: text("content").notNull(),
  embedding: text("embedding"), // pgvector type - will be handled in migrations
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  channelMemberships: many(channelMembers),
  clubsOwned: many(clubs, { relationName: "ClubOwner" }),
  clubsMemberOf: many(clubMembers),
  connectionsAsUserOne: many(connections, {
    relationName: "ConnectionsAsUserOne",
  }),
  connectionsAsUserTwo: many(connections, {
    relationName: "ConnectionsAsUserTwo",
  }),
  receivedConnectionRequests: many(connectionRequests, {
    relationName: "ReceivedConnectionRequests",
  }),
  sentConnectionRequests: many(connectionRequests, {
    relationName: "SentConnectionRequests",
  }),
  education: many(education),
  experience: many(experience),
  huddlesOrganized: many(huddles, { relationName: "HuddleOrganizer" }),
  huddleAttendees: many(huddleAttendees),
  messagesSent: many(messages, { relationName: "MessageAuthor" }),
  notifications: many(notifications),
  posts: many(posts),
  projectsOwned: many(projects, { relationName: "ProjectOwner" }),
  applications: many(projectApplications),
  projectsMemberOf: many(projectMembers),
  showcasedItems: many(showcasedItems),
  assignedTasks: many(tasks, { relationName: "AssignedTasks" }),
  badges: many(userBadges),
  skills: many(userSkills),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  projectRoles: many(projectRoleSkills),
  projects: many(projectSkills),
  users: many(userSkills),
  showcasedItems: many(showcasedItemSkills, {
    relationName: "ShowcasedItemSkills",
  }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  channels: many(channels, { relationName: "ProjectChannels" }),
  posts: many(posts),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "ProjectOwner",
  }),
  applications: many(projectApplications),
  members: many(projectMembers),
  roles: many(projectRoles),
  requiredSkills: many(projectSkills),
  showcasedItems: many(showcasedItems),
  tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  projectRole: one(projectRoles, {
    fields: [projectMembers.projectRoleId],
    references: [projectRoles.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
  project: one(projects, {
    fields: [projectSkills.projectId],
    references: [projects.id],
  }),
  skill: one(skills, {
    fields: [projectSkills.skillId],
    references: [skills.id],
  }),
}));

export const projectApplicationsRelations = relations(
  projectApplications,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectApplications.projectId],
      references: [projects.id],
    }),
    projectRole: one(projectRoles, {
      fields: [projectApplications.projectRoleId],
      references: [projectRoles.id],
    }),
    user: one(users, {
      fields: [projectApplications.userId],
      references: [users.id],
    }),
  }),
);

export const clubsRelations = relations(clubs, ({ many, one }) => ({
  channels: many(channels, { relationName: "ClubChannels" }),
  owner: one(users, {
    fields: [clubs.ownerId],
    references: [users.id],
    relationName: "ClubOwner",
  }),
  members: many(clubMembers),
  posts: many(posts),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ many, one }) => ({
  club: one(clubs, {
    fields: [channels.clubId],
    references: [clubs.id],
    relationName: "ClubChannels",
  }),
  project: one(projects, {
    fields: [channels.projectId],
    references: [projects.id],
    relationName: "ProjectChannels",
  }),
  members: many(channelMembers),
  messages: many(messages),
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [channelMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
    relationName: "MessageAuthor",
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [posts.clubId],
    references: [clubs.id],
  }),
  project: one(projects, {
    fields: [posts.projectId],
    references: [projects.id],
  }),
}));

export const huddlesRelations = relations(huddles, ({ many, one }) => ({
  organizer: one(users, {
    fields: [huddles.organizerId],
    references: [users.id],
    relationName: "HuddleOrganizer",
  }),
  attendees: many(huddleAttendees),
}));

export const huddleAttendeesRelations = relations(
  huddleAttendees,
  ({ one }) => ({
    huddle: one(huddles, {
      fields: [huddleAttendees.huddleId],
      references: [huddles.id],
    }),
    user: one(users, {
      fields: [huddleAttendees.userId],
      references: [users.id],
    }),
  }),
);

export const educationRelations = relations(education, ({ one }) => ({
  user: one(users, {
    fields: [education.userId],
    references: [users.id],
  }),
}));

export const experienceRelations = relations(experience, ({ one }) => ({
  user: one(users, {
    fields: [experience.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  users: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

export const connectionRequestsRelations = relations(
  connectionRequests,
  ({ one }) => ({
    recipient: one(users, {
      fields: [connectionRequests.recipientId],
      references: [users.id],
      relationName: "ReceivedConnectionRequests",
    }),
    requester: one(users, {
      fields: [connectionRequests.requesterId],
      references: [users.id],
      relationName: "SentConnectionRequests",
    }),
  }),
);

export const connectionsRelations = relations(connections, ({ one }) => ({
  userOne: one(users, {
    fields: [connections.userOneId],
    references: [users.id],
    relationName: "ConnectionsAsUserOne",
  }),
  userTwo: one(users, {
    fields: [connections.userTwoId],
    references: [users.id],
    relationName: "ConnectionsAsUserTwo",
  }),
}));

export const projectRolesRelations = relations(
  projectRoles,
  ({ many, one }) => ({
    applications: many(projectApplications),
    members: many(projectMembers),
    project: one(projects, {
      fields: [projectRoles.projectId],
      references: [projects.id],
    }),
    requiredSkills: many(projectRoleSkills),
  }),
);

export const projectRoleSkillsRelations = relations(
  projectRoleSkills,
  ({ one }) => ({
    projectRole: one(projectRoles, {
      fields: [projectRoleSkills.projectRoleId],
      references: [projectRoles.id],
    }),
    skill: one(skills, {
      fields: [projectRoleSkills.skillId],
      references: [skills.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "AssignedTasks",
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const showcasedItemsRelations = relations(
  showcasedItems,
  ({ many, one }) => ({
    project: one(projects, {
      fields: [showcasedItems.internalProjectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [showcasedItems.userId],
      references: [users.id],
    }),
    skills: many(showcasedItemSkills, { relationName: "ShowcasedItemSkills" }),
  }),
);

export const showcasedItemSkillsRelations = relations(
  showcasedItemSkills,
  ({ one }) => ({
    showcasedItem: one(showcasedItems, {
      fields: [showcasedItemSkills.showcasedItemId],
      references: [showcasedItems.id],
    }),
    skill: one(skills, {
      fields: [showcasedItemSkills.skillId],
      references: [skills.id],
      relationName: "ShowcasedItemSkills",
    }),
  }),
);

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
export type ProjectSkill = typeof projectSkills.$inferSelect;
export type NewProjectSkill = typeof projectSkills.$inferInsert;
export type ProjectApplication = typeof projectApplications.$inferSelect;
export type NewProjectApplication = typeof projectApplications.$inferInsert;
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;
export type ClubMember = typeof clubMembers.$inferSelect;
export type NewClubMember = typeof clubMembers.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type ChannelMember = typeof channelMembers.$inferSelect;
export type NewChannelMember = typeof channelMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Huddle = typeof huddles.$inferSelect;
export type NewHuddle = typeof huddles.$inferInsert;
export type HuddleAttendee = typeof huddleAttendees.$inferSelect;
export type NewHuddleAttendee = typeof huddleAttendees.$inferInsert;
export type Education = typeof education.$inferSelect;
export type NewEducation = typeof education.$inferInsert;
export type Experience = typeof experience.$inferSelect;
export type NewExperience = typeof experience.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type NewConnectionRequest = typeof connectionRequests.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
export type ProjectRole = typeof projectRoles.$inferSelect;
export type NewProjectRole = typeof projectRoles.$inferInsert;
export type ProjectRoleSkill = typeof projectRoleSkills.$inferSelect;
export type NewProjectRoleSkill = typeof projectRoleSkills.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ShowcasedItem = typeof showcasedItems.$inferSelect;
export type NewShowcasedItem = typeof showcasedItems.$inferInsert;
export type ShowcasedItemSkill = typeof showcasedItemSkills.$inferSelect;
export type NewShowcasedItemSkill = typeof showcasedItemSkills.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type NewKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
