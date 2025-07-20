import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./index";
import { sql } from "drizzle-orm";

// Migration function
export async function runMigrations() {
  const db = createDatabase();

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Setup function for initial database setup
export async function setupDatabase() {
  const db = createDatabase();

  try {
    // Enable pgvector extension if not already enabled
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
}

// Export migration utilities
export * from "drizzle-orm/postgres-js/migrator";
