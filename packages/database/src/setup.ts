import { createDatabase } from "./index";
import { setupDatabase } from "./migrations";
import { sql } from "drizzle-orm";

async function main() {

  try {
    const db = createDatabase();

    // Enable pgvector extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Run any additional setup
    await setupDatabase();

    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

main();
