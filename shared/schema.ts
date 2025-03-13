import { pgTable, text, serial, integer, timestamp, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
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
  teamRole: text("team_role"),
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
  workoutType: text("workout_type").notNull(),
  workoutDetails: jsonb("workout_details").notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  participantIds: integer("participant_ids").array(), // Add participant IDs array
});

// Workout-Detail Typen
export interface EmomWorkout {
  timePerRound: number;
  rounds: number;
  exercises: {
    name: string;
    reps: number;
    description?: string;
  }[];
}

export interface AmrapWorkout {
  totalTime: number;
  exercises: {
    name: string;
    reps: number;
    description?: string;
  }[];
}

export interface HitWorkout {
  intervals: number;
  workTime: number;
  restTime: number;
  exercises: {
    name: string;
    description?: string;
  }[];
}

export interface RunningWorkout {
  type: "distance" | "time";
  target: number;
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

export const bannerPositions = pgTable("banner_positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortcode: text("shortcode").notNull().unique(),
  description: text("description"),
  appDimensions: jsonb("app_dimensions").notNull(),
  webDimensions: jsonb("web_dimensions").notNull(),
});

export const marketingBanners = pgTable("marketing_banners", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => bannerPositions.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  appImage: text("app_image").notNull(),
  webImage: text("web_image").notNull(),
  targetUrl: text("target_url"),
  isActive: boolean("is_active").default(false).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bannerInteractions = pgTable("banner_interactions", {
  id: serial("id").primaryKey(),
  bannerId: integer("banner_id").references(() => marketingBanners.id).notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export type BannerPosition = typeof bannerPositions.$inferSelect;
export type MarketingBanner = typeof marketingBanners.$inferSelect;
export type BannerInteraction = typeof bannerInteractions.$inferSelect;

// Ändere die DEFAULT_BANNER_POSITIONS
export const DEFAULT_BANNER_POSITIONS = [
  {
    name: "App Header",
    shortcode: "APP_HEADER",
    description: "Banner im Kopfbereich der App",
    appDimensions: { width: 1080, height: 1080 },
    webDimensions: { width: 1920, height: 400 }
  },
  {
    name: "Website Hero",
    shortcode: "WEB_HERO",
    description: "Hero-Banner auf der Website",
    appDimensions: { width: 1080, height: 1080 },
    webDimensions: { width: 1920, height: 600 }
  }
] as const;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'training', 'coaching', 'supplement', 'custom'
  price: numeric("price").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  validUntil: timestamp("valid_until"),
  stockEnabled: boolean("stock_enabled").default(false),
  stock: integer("stock"),
  onSale: boolean("on_sale").default(false),
  salePrice: numeric("sale_price"),
  saleType: text("sale_type"), // 'Sale', 'Budget', 'Angebot'
  metadata: jsonb("metadata"), // Zusätzliche Informationen je nach Produkttyp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'cancelled'
  paypalOrderId: text("paypal_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;

export const productMetadataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("training"),
    duration: z.number(), // Dauer in Wochen
    sessions: z.number(), // Anzahl der Trainingseinheiten
    includes: z.array(z.string()), // Liste der Leistungen
  }),
  z.object({
    type: z.literal("coaching"),
    duration: z.number(), // Dauer in Monaten
    callsPerMonth: z.number(), // Anzahl der Coaching-Calls pro Monat
    includes: z.array(z.string()), // Liste der Leistungen
  }),
  z.object({
    type: z.literal("supplement"),
    weight: z.number(), // Gewicht in Gramm
    servings: z.number(), // Anzahl der Portionen
    nutritionFacts: z.record(z.string(), z.string()), // Nährwertangaben
  }),
  z.object({
    type: z.literal("custom"),
    specifications: z.record(z.string(), z.string()), // Beliebige Spezifikationen
    includes: z.array(z.string()), // Liste der Leistungen
  }),
]);

export const insertProductSchema = createInsertSchema(products)
  .extend({
    metadata: productMetadataSchema,
    stockEnabled: z.boolean().optional(),
    stock: z.number().optional(),
    onSale: z.boolean().optional(),
    salePrice: z.number().optional(),
    saleType: z.enum(['Sale', 'Budget', 'Angebot']).optional(),
  });

export type InsertProduct = z.infer<typeof insertProductSchema>;