import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Optimierte Pool-Konfiguration für bessere Performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Erhöhte maximale Verbindungen
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true // Erlaubt dem Pool, sich bei Inaktivität zu bereinigen
});

export const db = drizzle(pool, { 
  schema,
  logger: false // Deaktiviere Logging für bessere Performance
});

// Datenbank-Initialisierung
async function initDb() {
  try {
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    await migrate(db, { migrationsFolder: "./migrations" });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

initDb().catch(console.error);

// Verbindungs-Monitoring
pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});