import { createDatabase } from "./index";
import { setupDatabase } from "./migrations";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🚀 Setting up database...");

  try {
    const db = createDatabase();

    // Enable pgvector extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✅ pgvector extension enabled");

    // Run any additional setup
    await setupDatabase();

    console.log("✅ Database setup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

main();
