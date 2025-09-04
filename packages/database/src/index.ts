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
