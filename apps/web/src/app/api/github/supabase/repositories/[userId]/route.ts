import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Forward query parameters
    const queryString = searchParams.toString();
    const url = `${API_BASE}/api/github/supabase/repositories/${userId}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Repository fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch repositories" },
      { status: 500 },
    );
  }
}
