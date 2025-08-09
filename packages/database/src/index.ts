import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

// Database connection with proper connection pooling and error handling
export function createDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Configure postgres with optimized connection pooling
  const client = postgres(connectionString, {
    max: 5, // Reduced max connections to prevent pool exhaustion
    idle_timeout: 10, // Close idle connections after 10 seconds
    connect_timeout: 30, // Timeout for new connections
    prepare: false, // Disable prepared statements for better compatibility
    transform: {
      undefined: null // Transform undefined to null for database compatibility
    },
    onnotice: () => {}, // Suppress notices to reduce noise
    debug: false, // Disable debug logging in production
  });
  
  return drizzle(client, { 
    schema,
    logger: process.env.NODE_ENV === 'development' // Only log in development
  });
}

// Singleton database instance with better error handling
let dbInstance: ReturnType<typeof createDatabase> | null = null;

export const db = (() => {
  if (!dbInstance) {
    try {
      dbInstance = createDatabase();
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw error;
    }
  }
  return dbInstance;
})();

// Export types and utilities
export * from "./schema";
export * from "./migrations";
