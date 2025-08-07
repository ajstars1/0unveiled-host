DO $$ BEGIN
 CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."channel_type" AS ENUM('PUBLIC_PROJECT', 'PRIVATE_PROJECT', 'PUBLIC_CLUB', 'PRIVATE_CLUB', 'DIRECT_MESSAGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."connection_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."email_frequency" AS ENUM('IMMEDIATE', 'DAILY', 'WEEKLY', 'NEVER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."integration_provider" AS ENUM('GITHUB', 'DRIBBBLE', 'BEHANCE', 'MEDIUM', 'FIGMA', 'YOUTUBE', 'NOTION', 'SUBSTACK', 'CUSTOM');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."member_role" AS ENUM('LEADER', 'MEMBER', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('PROJECT_INVITE', 'PROJECT_UPDATE', 'APPLICATION_RECEIVED', 'APPLICATION_STATUS_UPDATE', 'NEW_MESSAGE', 'NEW_FOLLOWER', 'SYSTEM_ALERT', 'INTEGRATION_UPDATE', 'CONNECTION_REQUEST_RECEIVED', 'CONNECTION_REQUEST_ACCEPTED', 'TASK_ASSIGNED', 'TASK_UPDATED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."project_status" AS ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."project_visibility" AS ENUM('PUBLIC', 'PRIVATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_status" AS ENUM('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"expiresAt" integer,
	"idToken" text,
	"scope" text,
	"sessionState" text,
	"tokenType" text,
	"installationId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Badge" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"iconUrl" text,
	"criteria" text,
	CONSTRAINT "Badge_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChannelMember" (
	"userId" text NOT NULL,
	"channelId" text NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastReadAt" timestamp,
	CONSTRAINT "ChannelMember_userId_channelId_pk" PRIMARY KEY("userId","channelId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Channel" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"type" "channel_type" NOT NULL,
	"projectId" text,
	"clubId" text,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ClubMember" (
	"userId" text NOT NULL,
	"clubId" text NOT NULL,
	"role" "member_role" DEFAULT 'MEMBER' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ClubMember_userId_clubId_pk" PRIMARY KEY("userId","clubId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Club" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ownerId" text NOT NULL,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Club_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ConnectionRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"requesterId" text NOT NULL,
	"recipientId" text NOT NULL,
	"status" "connection_status" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Connection" (
	"userOneId" text NOT NULL,
	"userTwoId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Connection_userOneId_userTwoId_pk" PRIMARY KEY("userOneId","userTwoId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Education" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"institution" text NOT NULL,
	"degree" text,
	"fieldOfStudy" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Experience" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"companyName" text NOT NULL,
	"jobTitle" text NOT NULL,
	"location" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "HuddleAttendee" (
	"userId" text NOT NULL,
	"huddleId" text NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "HuddleAttendee_userId_huddleId_pk" PRIMARY KEY("userId","huddleId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Huddle" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp,
	"meetingUrl" text,
	"organizerId" text NOT NULL,
	"relatedProjectId" text,
	"relatedClubId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "KnowledgeArticle" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"sourceUrl" text,
	"content" text NOT NULL,
	"embedding" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"channelId" text NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"readAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"content" text NOT NULL,
	"linkUrl" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"authorId" text NOT NULL,
	"projectId" text,
	"clubId" text,
	"published" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectApplication" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"projectId" text NOT NULL,
	"message" text,
	"status" "application_status" DEFAULT 'PENDING' NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedAt" timestamp,
	"projectRoleId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectMember" (
	"userId" text NOT NULL,
	"projectId" text NOT NULL,
	"role" "member_role" DEFAULT 'MEMBER' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"projectRoleId" text,
	CONSTRAINT "ProjectMember_userId_projectId_pk" PRIMARY KEY("userId","projectId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectRoleSkill" (
	"projectRoleId" text NOT NULL,
	"skillId" text NOT NULL,
	CONSTRAINT "ProjectRoleSkill_projectRoleId_skillId_pk" PRIMARY KEY("projectRoleId","skillId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectRole" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"projectId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectSkill" (
	"projectId" text NOT NULL,
	"skillId" text NOT NULL,
	CONSTRAINT "ProjectSkill_projectId_skillId_pk" PRIMARY KEY("projectId","skillId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "project_status" DEFAULT 'PLANNING' NOT NULL,
	"visibility" "project_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"ownerId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"publicSummary" text NOT NULL,
	"htmlDescription" text,
	"jsonDescription" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ShowcasedItem" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"externalId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"imageUrl" text,
	"metadata" json,
	"showcasedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp,
	"order" integer,
	"internalProjectId" text,
	"roleInItem" text,
	"isPinned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Skill" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	CONSTRAINT "Skill_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Task" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'TODO' NOT NULL,
	"priority" integer,
	"dueDate" timestamp,
	"projectId" text NOT NULL,
	"assigneeId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"order" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserBadge" (
	"userId" text NOT NULL,
	"badgeId" text NOT NULL,
	"awardedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserBadge_userId_badgeId_pk" PRIMARY KEY("userId","badgeId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserSkill" (
	"userId" text NOT NULL,
	"skillId" text NOT NULL,
	"level" integer,
	CONSTRAINT "UserSkill_userId_skillId_pk" PRIMARY KEY("userId","skillId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" text PRIMARY KEY NOT NULL,
	"supabaseId" text NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"firstName" text NOT NULL,
	"lastName" text,
	"profilePicture" text,
	"bio" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"lastLogin" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"location" text,
	"websiteUrl" text,
	"githubUrl" text,
	"linkedinUrl" text,
	"twitterUrl" text,
	"behanceUrl" text,
	"dribbbleUrl" text,
	"college" text,
	"headline" text,
	"emailFrequency" "email_frequency" DEFAULT 'IMMEDIATE' NOT NULL,
	"notifyAchievements" boolean DEFAULT true NOT NULL,
	"notifyConnections" boolean DEFAULT true NOT NULL,
	"notifyEvents" boolean DEFAULT true NOT NULL,
	"notifyMessages" boolean DEFAULT true NOT NULL,
	"notifyProjects" boolean DEFAULT true NOT NULL,
	CONSTRAINT "User_supabaseId_unique" UNIQUE("supabaseId"),
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "VerificationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ChannelMember_userId_idx" ON "ChannelMember" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ChannelMember_channelId_idx" ON "ChannelMember" USING btree ("channelId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Channel_projectId_idx" ON "Channel" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Channel_clubId_idx" ON "Channel" USING btree ("clubId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Channel_type_idx" ON "Channel" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ClubMember_userId_idx" ON "ClubMember" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ClubMember_clubId_idx" ON "ClubMember" USING btree ("clubId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Club_ownerId_idx" ON "Club" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Club_name_idx" ON "Club" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ConnectionRequest_requesterId_recipientId_key" ON "ConnectionRequest" USING btree ("requesterId","recipientId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ConnectionRequest_requesterId_idx" ON "ConnectionRequest" USING btree ("requesterId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ConnectionRequest_recipientId_idx" ON "ConnectionRequest" USING btree ("recipientId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ConnectionRequest_status_idx" ON "ConnectionRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Connection_userOneId_idx" ON "Connection" USING btree ("userOneId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Connection_userTwoId_idx" ON "Connection" USING btree ("userTwoId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Education_userId_idx" ON "Education" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Experience_userId_idx" ON "Experience" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "HuddleAttendee_userId_idx" ON "HuddleAttendee" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "HuddleAttendee_huddleId_idx" ON "HuddleAttendee" USING btree ("huddleId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Huddle_organizerId_idx" ON "Huddle" USING btree ("organizerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Huddle_startTime_idx" ON "Huddle" USING btree ("startTime");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_channelId_createdAt_idx" ON "Message" USING btree ("channelId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_authorId_idx" ON "Message" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification" USING btree ("userId","isRead","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_projectId_idx" ON "Post" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_clubId_idx" ON "Post" USING btree ("clubId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_published_publishedAt_idx" ON "Post" USING btree ("published","publishedAt");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectApplication_userId_projectId_projectRoleId_key" ON "ProjectApplication" USING btree ("userId","projectId","projectRoleId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectApplication_userId_idx" ON "ProjectApplication" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectApplication_projectId_idx" ON "ProjectApplication" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectApplication_projectRoleId_idx" ON "ProjectApplication" USING btree ("projectRoleId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectApplication_status_idx" ON "ProjectApplication" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectMember_projectId_idx" ON "ProjectMember" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectMember_projectRoleId_idx" ON "ProjectMember" USING btree ("projectRoleId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectRoleSkill_projectRoleId_idx" ON "ProjectRoleSkill" USING btree ("projectRoleId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectRoleSkill_skillId_idx" ON "ProjectRoleSkill" USING btree ("skillId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectRole_projectId_idx" ON "ProjectRole" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectSkill_projectId_idx" ON "ProjectSkill" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectSkill_skillId_idx" ON "ProjectSkill" USING btree ("skillId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Project_ownerId_idx" ON "Project" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Project_visibility_idx" ON "Project" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ShowcasedItem_userId_provider_externalId_key" ON "ShowcasedItem" USING btree ("userId","provider","externalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ShowcasedItem_userId_idx" ON "ShowcasedItem" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ShowcasedItem_provider_idx" ON "ShowcasedItem" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ShowcasedItem_internalProjectId_idx" ON "ShowcasedItem" USING btree ("internalProjectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Skill_name_idx" ON "Skill" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task" USING btree ("assigneeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task" USING btree ("dueDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Task_projectId_status_order_idx" ON "Task" USING btree ("projectId","status","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserBadge_badgeId_idx" ON "UserBadge" USING btree ("badgeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserSkill_userId_idx" ON "UserSkill" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserSkill_skillId_idx" ON "UserSkill" USING btree ("skillId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "User_supabaseId_idx" ON "User" USING btree ("supabaseId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_email_token_key" ON "VerificationToken" USING btree ("email","token");