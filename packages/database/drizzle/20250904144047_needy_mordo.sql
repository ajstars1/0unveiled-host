CREATE TABLE "AIVerifiedSkill" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"skillName" text NOT NULL,
	"skillType" text NOT NULL,
	"confidenceScore" integer NOT NULL,
	"verifiedAt" timestamp DEFAULT now() NOT NULL,
	"lastUpdatedAt" timestamp DEFAULT now() NOT NULL,
	"sourceAnalysis" json,
	"repositoryCount" integer DEFAULT 0 NOT NULL,
	"linesOfCodeCount" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "AIVerifiedSkill_userId_skillName_key" ON "AIVerifiedSkill" USING btree ("userId","skillName");--> statement-breakpoint
CREATE INDEX "AIVerifiedSkill_userId_idx" ON "AIVerifiedSkill" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AIVerifiedSkill_skillType_idx" ON "AIVerifiedSkill" USING btree ("skillType");--> statement-breakpoint
CREATE INDEX "AIVerifiedSkill_confidenceScore_idx" ON "AIVerifiedSkill" USING btree ("confidenceScore");