CREATE TYPE "public"."badge_category" AS ENUM('TECHNICAL', 'QUALITY', 'SECURITY', 'LEADERSHIP', 'COMMUNITY', 'ACHIEVEMENT');--> statement-breakpoint
CREATE TYPE "public"."badge_rarity" AS ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY');--> statement-breakpoint
CREATE TYPE "public"."candidate_match_status" AS ENUM('SUGGESTED', 'CONTACTED', 'RESPONDED', 'INTERVIEWED', 'HIRED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('CODE_QUALITY', 'SECURITY_EXPERT', 'AI_SPECIALIST', 'HIGH_PERFORMER', 'COMMUNITY_LEADER', 'OPEN_SOURCE_CONTRIBUTOR', 'TECHNICAL_WRITER', 'MENTOR');--> statement-breakpoint
CREATE TABLE "Achievement" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"achievementType" text NOT NULL,
	"achievementData" json,
	"pointsAwarded" integer DEFAULT 0 NOT NULL,
	"earnedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CandidateMatch" (
	"id" text PRIMARY KEY NOT NULL,
	"jobPostingId" text NOT NULL,
	"candidateId" text NOT NULL,
	"aiMatchScore" integer NOT NULL,
	"matchReasoning" json,
	"recruiterRating" integer,
	"status" "candidate_match_status" DEFAULT 'SUGGESTED' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"industry" text,
	"sizeRange" text,
	"logoUrl" text,
	"verified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompanyMember" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'RECRUITER' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "JobPosting" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"recruiterId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" json,
	"location" text,
	"salaryRange" json,
	"employmentType" "employment_type" NOT NULL,
	"aiMatchingCriteria" json,
	"status" "job_status" DEFAULT 'DRAFT' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "MessageTemplate" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiterId" text NOT NULL,
	"companyId" text NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"variables" json,
	"type" text DEFAULT 'INITIAL' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OutreachActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"campaignId" text NOT NULL,
	"candidateId" text NOT NULL,
	"messageTemplateId" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"sentAt" timestamp,
	"deliveredAt" timestamp,
	"openedAt" timestamp,
	"clickedAt" timestamp,
	"repliedAt" timestamp,
	"status" "outreach_status" DEFAULT 'PENDING' NOT NULL,
	"responseText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OutreachCampaign" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiterId" text NOT NULL,
	"jobPostingId" text NOT NULL,
	"name" text NOT NULL,
	"templateId" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"totalCandidates" integer DEFAULT 0 NOT NULL,
	"messagesSent" integer DEFAULT 0 NOT NULL,
	"responsesReceived" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VerificationRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"verificationType" "verification_type" NOT NULL,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"evidence" json,
	"reviewerId" text,
	"reviewNotes" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedAt" timestamp,
	"expiresAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_userId_badgeId_pk";--> statement-breakpoint
ALTER TABLE "Badge" ALTER COLUMN "criteria" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "category" "badge_category" DEFAULT 'TECHNICAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "rarity" "badge_rarity" DEFAULT 'COMMON' NOT NULL;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "pointsValue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Badge" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD COLUMN "verificationRequestId" text;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD COLUMN "expiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD COLUMN "isFeatured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD COLUMN "evidenceUrl" text;--> statement-breakpoint
CREATE INDEX "Achievement_userId_idx" ON "Achievement" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Achievement_achievementType_idx" ON "Achievement" USING btree ("achievementType");--> statement-breakpoint
CREATE INDEX "Achievement_earnedAt_idx" ON "Achievement" USING btree ("earnedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "CandidateMatch_jobPostingId_candidateId_key" ON "CandidateMatch" USING btree ("jobPostingId","candidateId");--> statement-breakpoint
CREATE INDEX "CandidateMatch_jobPostingId_idx" ON "CandidateMatch" USING btree ("jobPostingId");--> statement-breakpoint
CREATE INDEX "CandidateMatch_candidateId_idx" ON "CandidateMatch" USING btree ("candidateId");--> statement-breakpoint
CREATE INDEX "CandidateMatch_status_idx" ON "CandidateMatch" USING btree ("status");--> statement-breakpoint
CREATE INDEX "CandidateMatch_aiMatchScore_idx" ON "CandidateMatch" USING btree ("aiMatchScore");--> statement-breakpoint
CREATE INDEX "Company_name_idx" ON "Company" USING btree ("name");--> statement-breakpoint
CREATE INDEX "Company_industry_idx" ON "Company" USING btree ("industry");--> statement-breakpoint
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember" USING btree ("companyId","userId");--> statement-breakpoint
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "JobPosting_recruiterId_idx" ON "JobPosting" USING btree ("recruiterId");--> statement-breakpoint
CREATE INDEX "JobPosting_status_idx" ON "JobPosting" USING btree ("status");--> statement-breakpoint
CREATE INDEX "JobPosting_employmentType_idx" ON "JobPosting" USING btree ("employmentType");--> statement-breakpoint
CREATE INDEX "MessageTemplate_recruiterId_idx" ON "MessageTemplate" USING btree ("recruiterId");--> statement-breakpoint
CREATE INDEX "MessageTemplate_companyId_idx" ON "MessageTemplate" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "MessageTemplate_type_idx" ON "MessageTemplate" USING btree ("type");--> statement-breakpoint
CREATE INDEX "OutreachActivity_campaignId_idx" ON "OutreachActivity" USING btree ("campaignId");--> statement-breakpoint
CREATE INDEX "OutreachActivity_candidateId_idx" ON "OutreachActivity" USING btree ("candidateId");--> statement-breakpoint
CREATE INDEX "OutreachActivity_status_idx" ON "OutreachActivity" USING btree ("status");--> statement-breakpoint
CREATE INDEX "OutreachActivity_sentAt_idx" ON "OutreachActivity" USING btree ("sentAt");--> statement-breakpoint
CREATE INDEX "OutreachCampaign_recruiterId_idx" ON "OutreachCampaign" USING btree ("recruiterId");--> statement-breakpoint
CREATE INDEX "OutreachCampaign_jobPostingId_idx" ON "OutreachCampaign" USING btree ("jobPostingId");--> statement-breakpoint
CREATE INDEX "OutreachCampaign_status_idx" ON "OutreachCampaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "VerificationRequest_userId_idx" ON "VerificationRequest" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "VerificationRequest_reviewerId_idx" ON "VerificationRequest" USING btree ("reviewerId");--> statement-breakpoint
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "VerificationRequest_verificationType_idx" ON "VerificationRequest" USING btree ("verificationType");--> statement-breakpoint
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge" USING btree ("userId","badgeId");--> statement-breakpoint
CREATE INDEX "UserBadge_verificationRequestId_idx" ON "UserBadge" USING btree ("verificationRequestId");