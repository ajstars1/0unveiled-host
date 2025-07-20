import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database connection
export function createDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(connectionString);
  return drizzle(client);
}

// Export types and utilities
export * from "./schema";
export * from "./migrations";
