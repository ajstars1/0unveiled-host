import { createDatabase } from "@0unveiled/database";
import { users } from "@0unveiled/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = createDatabase();

    const allUsers = await db.select().from(users);

    return NextResponse.json({
      success: true,
      data: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
