import { pgTable, index, uniqueIndex, text, timestamp, integer, boolean, unique, json, serial, bigint, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const application_status = pgEnum("application_status", ['PENDING', 'ACCEPTED', 'REJECTED'])
export const badge_category = pgEnum("badge_category", ['TECHNICAL', 'QUALITY', 'SECURITY', 'LEADERSHIP', 'COMMUNITY', 'ACHIEVEMENT'])
export const badge_rarity = pgEnum("badge_rarity", ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'])
export const candidate_match_status = pgEnum("candidate_match_status", ['SUGGESTED', 'CONTACTED', 'RESPONDED', 'INTERVIEWED', 'HIRED', 'REJECTED', 'WITHDRAWN'])
export const channel_type = pgEnum("channel_type", ['PUBLIC_PROJECT', 'PRIVATE_PROJECT', 'PUBLIC_CLUB', 'PRIVATE_CLUB', 'DIRECT_MESSAGE'])
export const connection_status = pgEnum("connection_status", ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'])
export const email_frequency = pgEnum("email_frequency", ['IMMEDIATE', 'DAILY', 'WEEKLY', 'NEVER'])
export const employment_type = pgEnum("employment_type", ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'])
export const integration_provider = pgEnum("integration_provider", ['GITHUB', 'DRIBBBLE', 'BEHANCE', 'MEDIUM', 'FIGMA', 'YOUTUBE', 'NOTION', 'SUBSTACK', 'CUSTOM'])
export const job_status = pgEnum("job_status", ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED'])
export const leaderboard_type = pgEnum("leaderboard_type", ['GENERAL', 'TECH_STACK', 'DOMAIN'])
export const member_role = pgEnum("member_role", ['LEADER', 'MEMBER', 'ADMIN'])
export const notification_type = pgEnum("notification_type", ['PROJECT_INVITE', 'PROJECT_UPDATE', 'APPLICATION_RECEIVED', 'APPLICATION_STATUS_UPDATE', 'NEW_MESSAGE', 'NEW_FOLLOWER', 'SYSTEM_ALERT', 'INTEGRATION_UPDATE', 'CONNECTION_REQUEST_RECEIVED', 'CONNECTION_REQUEST_ACCEPTED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'LEADERBOARD_RANK_UPDATE'])
export const outreach_status = pgEnum("outreach_status", ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'FAILED'])
export const project_status = pgEnum("project_status", ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'])
export const project_visibility = pgEnum("project_visibility", ['PUBLIC', 'PRIVATE'])
export const role = pgEnum("role", ['USER', 'ADMIN'])
export const task_status = pgEnum("task_status", ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'])
export const verification_status = pgEnum("verification_status", ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'])
export const verification_type = pgEnum("verification_type", ['CODE_QUALITY', 'SECURITY_EXPERT', 'AI_SPECIALIST', 'HIGH_PERFORMER', 'COMMUNITY_LEADER', 'OPEN_SOURCE_CONTRIBUTOR', 'TECHNICAL_WRITER', 'MENTOR'])


export const ConnectionRequest = pgTable("ConnectionRequest", {
	id: text().primaryKey().notNull(),
	requesterId: text().notNull(),
	recipientId: text().notNull(),
	status: connection_status().default('PENDING').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ConnectionRequest_recipientId_idx").using("btree", table.recipientId.asc().nullsLast().op("text_ops")),
	index("ConnectionRequest_requesterId_idx").using("btree", table.requesterId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ConnectionRequest_requesterId_recipientId_key").using("btree", table.requesterId.asc().nullsLast().op("text_ops"), table.recipientId.asc().nullsLast().op("text_ops")),
	index("ConnectionRequest_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const Account = pgTable("Account", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	expiresAt: integer(),
	idToken: text(),
	scope: text(),
	sessionState: text(),
	tokenType: text(),
	installationId: text(),
}, (table) => [
	uniqueIndex("Account_provider_providerAccountId_key").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerAccountId.asc().nullsLast().op("text_ops")),
	index("Account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const Channel = pgTable("Channel", {
	id: text().primaryKey().notNull(),
	name: text(),
	type: channel_type().notNull(),
	projectId: text(),
	clubId: text(),
	isPublic: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Channel_clubId_idx").using("btree", table.clubId.asc().nullsLast().op("text_ops")),
	index("Channel_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("Channel_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
]);

export const Club = pgTable("Club", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	ownerId: text().notNull(),
	isPrivate: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Club_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("Club_ownerId_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	unique("Club_name_unique").on(table.name),
]);

export const Education = pgTable("Education", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	institution: text().notNull(),
	degree: text(),
	fieldOfStudy: text(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	current: boolean().default(false).notNull(),
}, (table) => [
	index("Education_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const Badge = pgTable("Badge", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	iconUrl: text(),
	criteria: json(),
	category: badge_category().default('TECHNICAL').notNull(),
	rarity: badge_rarity().default('COMMON').notNull(),
	pointsValue: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("Badge_name_unique").on(table.name),
]);

export const KnowledgeArticle = pgTable("KnowledgeArticle", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	sourceUrl: text(),
	content: text().notNull(),
	embedding: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const Huddle = pgTable("Huddle", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp({ mode: 'string' }).notNull(),
	endTime: timestamp({ mode: 'string' }),
	meetingUrl: text(),
	organizerId: text().notNull(),
	relatedProjectId: text(),
	relatedClubId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Huddle_organizerId_idx").using("btree", table.organizerId.asc().nullsLast().op("text_ops")),
	index("Huddle_startTime_idx").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
]);

export const Message = pgTable("Message", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	channelId: text().notNull(),
	authorId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	deleted: boolean().default(false).notNull(),
	readAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("Message_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("Message_channelId_createdAt_idx").using("btree", table.channelId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
]);

export const Project = pgTable("Project", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	status: project_status().default('PLANNING').notNull(),
	visibility: project_visibility().default('PUBLIC').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	ownerId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	publicSummary: text().notNull(),
	htmlDescription: text(),
	jsonDescription: json(),
}, (table) => [
	index("Project_ownerId_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("Project_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("Project_visibility_idx").using("btree", table.visibility.asc().nullsLast().op("enum_ops")),
]);

export const Notification = pgTable("Notification", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	type: notification_type().notNull(),
	content: text().notNull(),
	linkUrl: text(),
	isRead: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Notification_userId_isRead_createdAt_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.isRead.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
]);

export const ProjectApplication = pgTable("ProjectApplication", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	projectId: text().notNull(),
	message: text(),
	status: application_status().default('PENDING').notNull(),
	submittedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	projectRoleId: text(),
}, (table) => [
	index("ProjectApplication_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("ProjectApplication_projectRoleId_idx").using("btree", table.projectRoleId.asc().nullsLast().op("text_ops")),
	index("ProjectApplication_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("ProjectApplication_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ProjectApplication_userId_projectId_projectRoleId_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.projectId.asc().nullsLast().op("text_ops"), table.projectRoleId.asc().nullsLast().op("text_ops")),
]);

export const Post = pgTable("Post", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	authorId: text().notNull(),
	projectId: text(),
	clubId: text(),
	published: boolean().default(false).notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Post_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("Post_clubId_idx").using("btree", table.clubId.asc().nullsLast().op("text_ops")),
	index("Post_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("Post_published_publishedAt_idx").using("btree", table.published.asc().nullsLast().op("timestamp_ops"), table.publishedAt.asc().nullsLast().op("timestamp_ops")),
]);

export const Experience = pgTable("Experience", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	companyName: text().notNull(),
	jobTitle: text().notNull(),
	location: text(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	current: boolean().default(false).notNull(),
}, (table) => [
	index("Experience_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const __drizzle_migrations__ = pgTable("__drizzle_migrations__", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	created_at: bigint({ mode: "number" }),
});

export const ProjectRole = pgTable("ProjectRole", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	projectId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ProjectRole_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
]);

export const User = pgTable("User", {
	id: text().primaryKey().notNull(),
	supabaseId: text().notNull(),
	email: text().notNull(),
	username: text(),
	firstName: text().notNull(),
	lastName: text(),
	profilePicture: text(),
	bio: text(),
	role: role().default('USER').notNull(),
	onboarded: boolean().default(false).notNull(),
	lastLogin: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	location: text(),
	websiteUrl: text(),
	githubUrl: text(),
	linkedinUrl: text(),
	twitterUrl: text(),
	behanceUrl: text(),
	dribbbleUrl: text(),
	college: text(),
	headline: text(),
	emailFrequency: email_frequency().default('IMMEDIATE').notNull(),
	notifyAchievements: boolean().default(true).notNull(),
	notifyConnections: boolean().default(true).notNull(),
	notifyEvents: boolean().default(true).notNull(),
	notifyMessages: boolean().default(true).notNull(),
	notifyProjects: boolean().default(true).notNull(),
}, (table) => [
	index("User_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("User_supabaseId_idx").using("btree", table.supabaseId.asc().nullsLast().op("text_ops")),
	index("User_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("User_supabaseId_unique").on(table.supabaseId),
	unique("User_email_unique").on(table.email),
	unique("User_username_unique").on(table.username),
]);

export const UserBadge = pgTable("UserBadge", {
	userId: text().notNull(),
	badgeId: text().notNull(),
	awardedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	id: text().primaryKey().notNull(),
	verificationRequestId: text(),
	expiresAt: timestamp({ mode: 'string' }),
	isFeatured: boolean().default(false).notNull(),
	evidenceUrl: text(),
}, (table) => [
	index("UserBadge_badgeId_idx").using("btree", table.badgeId.asc().nullsLast().op("text_ops")),
	uniqueIndex("UserBadge_userId_badgeId_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.badgeId.asc().nullsLast().op("text_ops")),
	index("UserBadge_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("UserBadge_verificationRequestId_idx").using("btree", table.verificationRequestId.asc().nullsLast().op("text_ops")),
]);

export const Skill = pgTable("Skill", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
}, (table) => [
	index("Skill_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("Skill_name_unique").on(table.name),
]);

export const VerificationToken = pgTable("VerificationToken", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("VerificationToken_email_token_key").using("btree", table.email.asc().nullsLast().op("text_ops"), table.token.asc().nullsLast().op("text_ops")),
	unique("VerificationToken_token_unique").on(table.token),
]);

export const Task = pgTable("Task", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	status: task_status().default('TODO').notNull(),
	priority: integer(),
	dueDate: timestamp({ mode: 'string' }),
	projectId: text().notNull(),
	assigneeId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	order: integer(),
}, (table) => [
	index("Task_assigneeId_idx").using("btree", table.assigneeId.asc().nullsLast().op("text_ops")),
	index("Task_dueDate_idx").using("btree", table.dueDate.asc().nullsLast().op("timestamp_ops")),
	index("Task_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("Task_projectId_status_order_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.status.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	index("Task_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const ShowcasedItem = pgTable("ShowcasedItem", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	provider: integration_provider().notNull(),
	externalId: text().notNull(),
	title: text().notNull(),
	description: text(),
	url: text().notNull(),
	imageUrl: text(),
	metadata: json(),
	showcasedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastSyncedAt: timestamp({ mode: 'string' }),
	order: integer(),
	internalProjectId: text(),
	roleInItem: text(),
	isPinned: boolean().default(false).notNull(),
}, (table) => [
	index("ShowcasedItem_internalProjectId_idx").using("btree", table.internalProjectId.asc().nullsLast().op("text_ops")),
	index("ShowcasedItem_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
	index("ShowcasedItem_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ShowcasedItem_userId_provider_externalId_key").using("btree", table.userId.asc().nullsLast().op("enum_ops"), table.provider.asc().nullsLast().op("text_ops"), table.externalId.asc().nullsLast().op("text_ops")),
]);

export const Achievement = pgTable("Achievement", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	achievementType: text().notNull(),
	achievementData: json(),
	pointsAwarded: integer().default(0).notNull(),
	earnedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Achievement_achievementType_idx").using("btree", table.achievementType.asc().nullsLast().op("text_ops")),
	index("Achievement_earnedAt_idx").using("btree", table.earnedAt.asc().nullsLast().op("timestamp_ops")),
	index("Achievement_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const Company = pgTable("Company", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	website: text(),
	industry: text(),
	sizeRange: text(),
	logoUrl: text(),
	verified: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Company_industry_idx").using("btree", table.industry.asc().nullsLast().op("text_ops")),
	index("Company_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const CandidateMatch = pgTable("CandidateMatch", {
	id: text().primaryKey().notNull(),
	jobPostingId: text().notNull(),
	candidateId: text().notNull(),
	aiMatchScore: integer().notNull(),
	matchReasoning: json(),
	recruiterRating: integer(),
	status: candidate_match_status().default('SUGGESTED').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("CandidateMatch_aiMatchScore_idx").using("btree", table.aiMatchScore.asc().nullsLast().op("int4_ops")),
	index("CandidateMatch_candidateId_idx").using("btree", table.candidateId.asc().nullsLast().op("text_ops")),
	uniqueIndex("CandidateMatch_jobPostingId_candidateId_key").using("btree", table.jobPostingId.asc().nullsLast().op("text_ops"), table.candidateId.asc().nullsLast().op("text_ops")),
	index("CandidateMatch_jobPostingId_idx").using("btree", table.jobPostingId.asc().nullsLast().op("text_ops")),
	index("CandidateMatch_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const CompanyMember = pgTable("CompanyMember", {
	id: text().primaryKey().notNull(),
	companyId: text().notNull(),
	userId: text().notNull(),
	role: text().default('RECRUITER').notNull(),
	isActive: boolean().default(true).notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("CompanyMember_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	uniqueIndex("CompanyMember_companyId_userId_key").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("CompanyMember_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const JobPosting = pgTable("JobPosting", {
	id: text().primaryKey().notNull(),
	companyId: text().notNull(),
	recruiterId: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	requirements: json(),
	location: text(),
	salaryRange: json(),
	employmentType: employment_type().notNull(),
	aiMatchingCriteria: json(),
	status: job_status().default('DRAFT').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("JobPosting_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("JobPosting_employmentType_idx").using("btree", table.employmentType.asc().nullsLast().op("enum_ops")),
	index("JobPosting_recruiterId_idx").using("btree", table.recruiterId.asc().nullsLast().op("text_ops")),
	index("JobPosting_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const MessageTemplate = pgTable("MessageTemplate", {
	id: text().primaryKey().notNull(),
	recruiterId: text().notNull(),
	companyId: text().notNull(),
	name: text().notNull(),
	subject: text(),
	content: text().notNull(),
	variables: json(),
	type: text().default('INITIAL').notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("MessageTemplate_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("MessageTemplate_recruiterId_idx").using("btree", table.recruiterId.asc().nullsLast().op("text_ops")),
	index("MessageTemplate_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const OutreachActivity = pgTable("OutreachActivity", {
	id: text().primaryKey().notNull(),
	campaignId: text().notNull(),
	candidateId: text().notNull(),
	messageTemplateId: text().notNull(),
	subject: text(),
	content: text().notNull(),
	sentAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	repliedAt: timestamp({ mode: 'string' }),
	status: outreach_status().default('PENDING').notNull(),
	responseText: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("OutreachActivity_campaignId_idx").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
	index("OutreachActivity_candidateId_idx").using("btree", table.candidateId.asc().nullsLast().op("text_ops")),
	index("OutreachActivity_sentAt_idx").using("btree", table.sentAt.asc().nullsLast().op("timestamp_ops")),
	index("OutreachActivity_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const LeaderboardScore = pgTable("LeaderboardScore", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	leaderboardType: leaderboard_type().notNull(),
	score: integer().notNull(),
	rank: integer().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	techStack: text(),
	domain: text(),
}, (table) => [
	index("LeaderboardScore_leaderboardType_idx").using("btree", table.leaderboardType.asc().nullsLast().op("enum_ops")),
	index("LeaderboardScore_rank_idx").using("btree", table.rank.asc().nullsLast().op("int4_ops")),
	index("LeaderboardScore_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const AIVerifiedSkill = pgTable("AIVerifiedSkill", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	skillName: text().notNull(),
	skillType: text().notNull(),
	confidenceScore: integer().notNull(),
	verifiedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastUpdatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	sourceAnalysis: json(),
	repositoryCount: integer().default(0).notNull(),
	linesOfCodeCount: integer().default(0).notNull(),
	isVisible: boolean().default(true).notNull(),
}, (table) => [
	index("AIVerifiedSkill_confidenceScore_idx").using("btree", table.confidenceScore.asc().nullsLast().op("int4_ops")),
	index("AIVerifiedSkill_skillType_idx").using("btree", table.skillType.asc().nullsLast().op("text_ops")),
	index("AIVerifiedSkill_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("AIVerifiedSkill_userId_skillName_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.skillName.asc().nullsLast().op("text_ops")),
]);

export const OutreachCampaign = pgTable("OutreachCampaign", {
	id: text().primaryKey().notNull(),
	recruiterId: text().notNull(),
	jobPostingId: text().notNull(),
	name: text().notNull(),
	templateId: text(),
	status: text().default('DRAFT').notNull(),
	totalCandidates: integer().default(0).notNull(),
	messagesSent: integer().default(0).notNull(),
	responsesReceived: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("OutreachCampaign_jobPostingId_idx").using("btree", table.jobPostingId.asc().nullsLast().op("text_ops")),
	index("OutreachCampaign_recruiterId_idx").using("btree", table.recruiterId.asc().nullsLast().op("text_ops")),
	index("OutreachCampaign_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const VerificationRequest = pgTable("VerificationRequest", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	verificationType: verification_type().notNull(),
	status: verification_status().default('PENDING').notNull(),
	evidence: json(),
	reviewerId: text(),
	reviewNotes: text(),
	submittedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("VerificationRequest_reviewerId_idx").using("btree", table.reviewerId.asc().nullsLast().op("text_ops")),
	index("VerificationRequest_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("VerificationRequest_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("VerificationRequest_verificationType_idx").using("btree", table.verificationType.asc().nullsLast().op("enum_ops")),
]);

export const ProjectRoleSkill = pgTable("ProjectRoleSkill", {
	projectRoleId: text().notNull(),
	skillId: text().notNull(),
}, (table) => [
	index("ProjectRoleSkill_projectRoleId_idx").using("btree", table.projectRoleId.asc().nullsLast().op("text_ops")),
	index("ProjectRoleSkill_skillId_idx").using("btree", table.skillId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.projectRoleId, table.skillId], name: "ProjectRoleSkill_projectRoleId_skillId_pk"}),
]);

export const ProjectSkill = pgTable("ProjectSkill", {
	projectId: text().notNull(),
	skillId: text().notNull(),
}, (table) => [
	index("ProjectSkill_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("ProjectSkill_skillId_idx").using("btree", table.skillId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.projectId, table.skillId], name: "ProjectSkill_projectId_skillId_pk"}),
]);

export const Connection = pgTable("Connection", {
	userOneId: text().notNull(),
	userTwoId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("Connection_userOneId_idx").using("btree", table.userOneId.asc().nullsLast().op("text_ops")),
	index("Connection_userTwoId_idx").using("btree", table.userTwoId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userOneId, table.userTwoId], name: "Connection_userOneId_userTwoId_pk"}),
]);

export const HuddleAttendee = pgTable("HuddleAttendee", {
	userId: text().notNull(),
	huddleId: text().notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("HuddleAttendee_huddleId_idx").using("btree", table.huddleId.asc().nullsLast().op("text_ops")),
	index("HuddleAttendee_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userId, table.huddleId], name: "HuddleAttendee_userId_huddleId_pk"}),
]);

export const UserSkill = pgTable("UserSkill", {
	userId: text().notNull(),
	skillId: text().notNull(),
	level: integer(),
}, (table) => [
	index("UserSkill_skillId_idx").using("btree", table.skillId.asc().nullsLast().op("text_ops")),
	index("UserSkill_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userId, table.skillId], name: "UserSkill_userId_skillId_pk"}),
]);

export const ClubMember = pgTable("ClubMember", {
	userId: text().notNull(),
	clubId: text().notNull(),
	role: member_role().default('MEMBER').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ClubMember_clubId_idx").using("btree", table.clubId.asc().nullsLast().op("text_ops")),
	index("ClubMember_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userId, table.clubId], name: "ClubMember_userId_clubId_pk"}),
]);

export const ChannelMember = pgTable("ChannelMember", {
	userId: text().notNull(),
	channelId: text().notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastReadAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("ChannelMember_channelId_idx").using("btree", table.channelId.asc().nullsLast().op("text_ops")),
	index("ChannelMember_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userId, table.channelId], name: "ChannelMember_userId_channelId_pk"}),
]);

export const ProjectMember = pgTable("ProjectMember", {
	userId: text().notNull(),
	projectId: text().notNull(),
	role: member_role().default('MEMBER').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	projectRoleId: text(),
}, (table) => [
	index("ProjectMember_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("ProjectMember_projectRoleId_idx").using("btree", table.projectRoleId.asc().nullsLast().op("text_ops")),
	index("ProjectMember_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.userId, table.projectId], name: "ProjectMember_userId_projectId_pk"}),
]);
