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
  images: text("images").array(),  // Änderung von image zu images als Array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  participantIds: integer("participant_ids").array(),
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
  type: text("type").notNull(),
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
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  status: text("status").notNull(),
  paypalOrderId: text("paypal_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;

export const productMetadataSchema = z.object({
  type: z.enum(['training', 'coaching', 'supplement', 'custom']),
  description: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

export const insertProductSchema = createInsertSchema(products)
  .extend({
    metadata: productMetadataSchema,
    price: z.number(),
    stockEnabled: z.boolean().optional(),
    stock: z.number().optional(),
    onSale: z.boolean().optional(),
    salePrice: z.number().optional(),
    validUntil: z.string().datetime().optional(),
  });

export type InsertProduct = z.infer<typeof insertProductSchema>;

// Events table definition bleibt bestehen, aber ohne slug
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  image: text("image"),
  gallery: text("gallery").array(),
  type: text("type").notNull(), // 'event' oder 'course'
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  unlimitedParticipants: boolean("unlimited_participants").default(false),
  currentParticipants: integer("current_participants").default(0),
  isRecurring: boolean("is_recurring").default(false),
  recurringType: text("recurring_type"), // 'daily', 'weekly', 'monthly'
  isHighlight: boolean("is_highlight").default(false),
  isArchived: boolean("is_archived").default(false),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  requiresRegistration: boolean("requires_registration").default(true),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventExternalRegistrations = pgTable("event_external_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default('pending'), // pending, confirmed, cancelled
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add type definitions
export type Event = typeof events.$inferSelect;
export type EventComment = typeof eventComments.$inferSelect;
export type EventExternalRegistration = typeof eventExternalRegistrations.$inferSelect;

export const insertEventSchema = createInsertSchema(events)
  .extend({
    date: z.string().datetime(),
    gallery: z.array(z.string()).optional(),
    unlimitedParticipants: z.boolean().optional(),
    isPublic: z.boolean().default(false),
    requiresRegistration: z.boolean().default(true),
    slug: z.string().optional(), // Make optional as it will be generated
  })
  .omit({
    id: true,
    currentParticipants: true,
    likes: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertEventCommentSchema = createInsertSchema(eventComments)
  .omit({
    id: true,
    likes: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertEventExternalRegistrationSchema = createInsertSchema(eventExternalRegistrations)
  .omit({
    id: true,
    createdAt: true,
  });

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type InsertEventExternalRegistration = z.infer<typeof insertEventExternalRegistrationSchema>;