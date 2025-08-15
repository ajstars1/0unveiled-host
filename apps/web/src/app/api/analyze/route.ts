import { NextRequest, NextResponse } from "next/server";
import { analyzeRepositoryAction, getUserIdByUsernameAction } from "@/actions/analyze";

export async function POST(req: NextRequest) {
  try {
    const { username, repo } = await req.json();
    if (!username || !repo) {
      return NextResponse.json({ success: false, error: "username and repo are required" }, { status: 400 });
    }
    const decodedRepo = decodeURIComponent(repo as string);
    const [owner, repoName] = decodedRepo.split("/");
    if (!owner || !repoName) {
      return NextResponse.json({ success: false, error: "Invalid repo full name" }, { status: 400 });
    }

    const resolved = await getUserIdByUsernameAction(username as string);
    if (!resolved.success || !resolved.userId) {
      return NextResponse.json({ success: false, error: resolved.error || "User not found" }, { status: 404 });
    }

    const result = await analyzeRepositoryAction(resolved.userId!, owner, repoName, 200);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Analysis failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
