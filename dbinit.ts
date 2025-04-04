import { db } from './server/db';
import * as schema from './shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating database schema...');
  
  try {
    // Erstelle schema
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);
    
    // Create Tabellen
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        is_team_member BOOLEAN DEFAULT false,
        team_role TEXT
      );
      
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        daily_goal JSONB
      );
      
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        workout_details JSONB NOT NULL,
        points JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        current_progress INTEGER DEFAULT 0,
        achievement_level TEXT,
        result JSONB
      );
      
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        is_private BOOLEAN NOT NULL DEFAULT false,
        participant_ids INTEGER[]
      );
    `);
    
    console.log('Database schema created successfully!');
    
    // Demo-Benutzer
    await db.execute(sql`
      INSERT INTO users (username, name, is_admin, avatar)
      VALUES 
        ('admin', 'Administrator', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
        ('user1', 'Test User', false, 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('Demo users created!');
  } catch (error) {
    console.error('Error creating database schema:', error);
  }
  
  process.exit(0);
}

main();