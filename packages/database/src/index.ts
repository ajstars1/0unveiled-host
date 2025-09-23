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
    max: 10, // Increased max connections for better concurrent performance
    idle_timeout: 20, // Slightly longer idle timeout
    connect_timeout: 10, // Faster connection timeout
    prepare: false, // Disable prepared statements for better compatibility
    transform: {
      undefined: null // Transform undefined to null for database compatibility
    },
    onnotice: () => {}, // Suppress notices to reduce noise
    debug: false, // Disable debug logging in production
    max_lifetime: 60 * 60 * 1000, // 1 hour max lifetime
  });
  
  return drizzle(client, { 
    schema,
    logger: process.env.NODE_ENV === 'development'
  });
}

// Singleton database instance with lazy initialization
let dbInstance: ReturnType<typeof createDatabase> | null = null;

// Create a getter for lazy database initialization  
function getDbInstance() {
  if (!dbInstance) {
    try {
      dbInstance = createDatabase();
    } catch (error) {
      console.error('Failed to create database connection:', error);
      // For build time, return a mock object to prevent crashes
      if (process.env.NODE_ENV !== 'production' || process.env.DATABASE_URL) {
        throw error;
      }
      // Return empty object for build time when DATABASE_URL is not available
      return {} as any;
    }
  }
  return dbInstance;
}

// Export db as a getter property
export const db = getDbInstance();

// Export types and utilities
export * from "./schema";
export * from "./migrations";
