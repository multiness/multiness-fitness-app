import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false),
  isTeamMember: boolean("is_team_member").default(false),
  teamRole: text("team_role"), // z.B. "moderator", "content_manager", etc.
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  prize: text("prize").notNull(),
  prizeDescription: text("prize_description").notNull(),
  prizeImage: text("prize_image"),
  workoutType: text("workout_type").notNull(), // 'emom', 'amrap', 'hit', 'running', 'custom'
  workoutDetails: jsonb("workout_details").notNull(), // Speichert die spezifischen Workout-Details
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
});

// Workout-Detail Typen
export interface EmomWorkout {
  timePerRound: number; // Sekunden
  rounds: number;
  exercises: {
    name: string;
    reps: number;
    description?: string;
  }[];
}

export interface AmrapWorkout {
  totalTime: number; // Sekunden
  exercises: {
    name: string;
    reps: number;
    description?: string;
  }[];
}

export interface HitWorkout {
  intervals: number;
  workTime: number; // Sekunden
  restTime: number; // Sekunden
  exercises: {
    name: string;
    description?: string;
  }[];
}

export interface RunningWorkout {
  type: "distance" | "time";
  target: number; // Kilometer oder Minuten
  description: string;
}

export interface CustomWorkout {
  description: string;
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    time?: number;
    description?: string;
  }[];
}

export type WorkoutDetails = EmomWorkout | AmrapWorkout | HitWorkout | RunningWorkout | CustomWorkout;

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Group = typeof groups.$inferSelect;

export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  workoutType: text("workout_type").notNull(),
  workoutDetails: jsonb("workout_details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;