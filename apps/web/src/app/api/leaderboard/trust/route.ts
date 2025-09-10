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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Math.max(parseInt(limitParam || "12", 10) || 12, 1), 24)

    // Directly query the database instead of using the helper function that's having issues
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

    const maxScore = scores.reduce((m: number, s: any) => Math.max(m, s.score ?? 0), 0) || 1

    const items = scores.map((s: any, idx: number) => {
      const first = s.user?.firstName?.trim() || ""
      const last = s.user?.lastName?.trim() || ""
      const fullName = (first || last)
        ? `${first}${first && last ? " " : ""}${last}`
        : (s.user?.username || "User")

      const avatar = s.user?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toInitials(fullName) || "U")}`
      const techs = (s.techStack || "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)

      const rating = clamp(Math.round(((s.score || 0) / maxScore) * 5), 3, 5)

      return {
        id: String(s.id || `${s.user?.id || idx}`),
        name: fullName,
        role: s.user?.headline || "Top builder",
        company: s.domain || "",
        avatar,
        skills: techs,
        projects: [],
        quote: `${fullName} is ranked #${s.rank ?? "-"} on the global leaderboard` ,
        rating,
      }
    })

    return NextResponse.json({ success: true, items })
  } catch (err) {
    console.error("/api/leaderboard/trust error", err)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
