import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

// Database connection
export function createDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

// Create a default database instance
export const db = createDatabase();

// Export types and utilities
export * from "./schema";
export * from "./migrations";
