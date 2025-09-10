import { NextResponse } from "next/server"
import { getGeneralLeaderboard } from "@/data/leaderboard"

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

    const result = await getGeneralLeaderboard(limit)
    if (!("success" in result) || !result.success) {
      return NextResponse.json(
        { success: false, error: (result as any)?.error || "Failed to fetch leaderboard" },
        { status: 500 }
      )
    }

    const scores = result.scores || []
    const maxScore = scores.reduce((m, s) => Math.max(m, s.score ?? 0), 0) || 1

    const items = scores.map((s, idx) => {
      const first = s.user?.firstName?.trim() || ""
      const last = s.user?.lastName?.trim() || ""
      const fullName = (first || last)
        ? `${first}${first && last ? " " : ""}${last}`
        : (s.user?.username || "User")

      const avatar = s.user?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toInitials(fullName) || "U")}`
      const techs = (s.techStack || "")
        .split(",")
        .map((t) => t.trim())
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
