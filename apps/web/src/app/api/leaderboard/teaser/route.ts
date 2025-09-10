import { NextResponse } from "next/server"
import { db } from "@/lib/drizzle"
import { leaderboardScores, users } from "@0unveiled/database"
import { eq, and, desc, asc, isNotNull, ne } from "drizzle-orm"

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10) || 10, 1), 20)

    // Direct query instead of using the helper function that's causing issues
    const scores = await db
      .select({
        id: leaderboardScores.id,
        rank: leaderboardScores.rank,
        score: leaderboardScores.score,
        techStack: leaderboardScores.techStack,
        domain: leaderboardScores.domain,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          headline: users.headline,
        },
      })
      .from(leaderboardScores)
      .innerJoin(users, eq(leaderboardScores.userId, users.id))
      .where(
        and(
          eq(leaderboardScores.leaderboardType, "GENERAL"),
          isNotNull(users.username),
          ne(users.username, ""),
          eq(users.onboarded, true)
        )
      )
      .orderBy(asc(leaderboardScores.rank), desc(leaderboardScores.score))
      .limit(limit);
    if (scores.length === 0) {
      return NextResponse.json({ success: true, entries: [] })
    }

    const maxScore = scores.reduce((m: number, s: any) => Math.max(m, s.score ?? 0), 0) || 1

    const entries = scores.map((s: any) => {
      // Handle user name
      const first = s.user?.firstName?.trim() || ""
      const last = s.user?.lastName?.trim() || ""
      const fullName = (first || last)
        ? `${first}${first && last ? " " : ""}${last}`
        : (s.user?.username || "User")

      // Handle username/handle
      const handle = s.user?.username || "user"

      // Avatar with fallback
      const avatar = s.user?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toInitials(fullName) || "U")}`

      // Extract tech stack skills
      const skills = (s.techStack || "")
        .split(",")
        .map((skill: string) => skill.trim())
        .filter(Boolean)

      // Mock projects data (since we don't have real project data in leaderboard)
      const mockProjects = [
        {
          name: "Portfolio Project",
          score: Math.floor(s.score * 0.4),
          description: "Personal portfolio showcasing technical skills"
        },
        {
          name: "Open Source Contribution",
          score: Math.floor(s.score * 0.3),
          description: "Contributions to open source projects"
        },
        {
          name: "Professional Work",
          score: Math.floor(s.score * 0.3),
          description: "Professional development projects"
        }
      ]

      return {
        id: String(s.id),
        name: fullName,
        handle: handle,
        avatar: avatar,
        role: s.user?.headline || "Developer",
        score: s.score,
        rank: s.rank,
        projects: mockProjects,
        skills: skills.length > 0 ? skills : ["JavaScript", "React", "Node.js"] // fallback skills
      }
    })

    return NextResponse.json({ success: true, entries })
  } catch (err) {
    console.error("/api/leaderboard/teaser error", err)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
