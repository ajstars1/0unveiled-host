import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  introspect: {
    casing: "preserve", // Keep existing casing to avoid conflicts
  },
  schemaFilter: "public",
  tablesFilter: ["!_prisma_migrations"], // Exclude Prisma migrations table
  breakpoints: true,
  strict: true,
  verbose: true,
});
