import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    
    // This API route is deprecated - functionality moved to server actions
    // Return a helpful message for any remaining calls
    return NextResponse.json({
      success: false,
      error: "This API endpoint has been deprecated. Please use server actions instead.",
      deprecated: true,
      redirectTo: "Server actions in /actions/analyze.ts"
    }, { status: 410 }); // 410 Gone - indicates the resource is no longer available

  } catch (error) {
    console.error("Deprecated API route called:", error);
    return NextResponse.json(
      { success: false, error: "API route deprecated" },
      { status: 410 },
    );
  }
}
