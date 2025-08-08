CREATE TYPE "public"."leaderboard_type" AS ENUM('GENERAL', 'TECH_STACK', 'DOMAIN');--> statement-breakpoint
CREATE TABLE "LeaderboardScore" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"leaderboardType" "leaderboard_type" NOT NULL,
	"score" integer NOT NULL,
	"rank" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"techStack" text,
	"domain" text
);
--> statement-breakpoint
CREATE INDEX "LeaderboardScore_userId_idx" ON "LeaderboardScore" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LeaderboardScore_leaderboardType_idx" ON "LeaderboardScore" USING btree ("leaderboardType");--> statement-breakpoint
CREATE INDEX "LeaderboardScore_rank_idx" ON "LeaderboardScore" USING btree ("rank");