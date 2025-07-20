import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./index";

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

// Export migration utilities
export * from "drizzle-orm/postgres-js/migrator";
