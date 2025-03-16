import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Initialize database tables
async function initDb() {
  try {
    console.log("Starting database initialization...");
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Database initialized successfully");

    // Verify posts table exists
    const result = await db.select().from(schema.posts).limit(1);
    console.log("Posts table verified successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

initDb().catch(console.error);