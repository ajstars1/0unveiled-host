import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ userId: string; owner: string; repo: string }> },
) {
  try {
    const { userId, owner, repo } = await params;
    const body = await request.json();

    const url = `${API_BASE}/api/github/supabase/analyze/${userId}/${owner}/${repo}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Repository analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze repository" },
      { status: 500 },
    );
  }
}
