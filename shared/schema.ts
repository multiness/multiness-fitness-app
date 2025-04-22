import { pgTable, text, serial, integer, timestamp, boolean, jsonb, numeric, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Benutzer-Tabelle
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  coverImage: text("cover_image"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  password: text("password").notNull(),
  passwordResetToken: text("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false),
  isTeamMember: boolean("is_team_member").default(false),
  teamRole: text("team_role"),
  role: text("role").default("user").notNull(), // 'user', 'moderator', 'admin'
  preferences: jsonb("preferences"), // Notification & Anzeige-Einstellungen
  metrics: jsonb("metrics"), // Leistungsmetriken wie Gewicht, Körperfett, Größe usw.
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Benutzerziele (tägliche Ziele wie Schritte, Wasser usw.)
export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'water', 'steps', 'distance', 'custom'
  name: text("name"),
  target: numeric("target").notNull(),
  unit: text("unit").notNull(),
  progress: numeric("progress").default("0").notNull(),
  date: timestamp("date").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Beiträge im Feed
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  image: text("image"),
  dailyGoalId: integer("daily_goal_id").references(() => dailyGoals.id),
  challengeId: integer("challenge_id").references(() => challenges.id),
  groupId: integer("group_id").references(() => groups.id),
  workoutId: integer("workout_id").references(() => workoutTemplates.id),
  likeCount: integer("like_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("post_user_id_idx").on(table.userId),
    createdAtIdx: index("post_created_at_idx").on(table.createdAt),
  }
});

// Post-Kommentare
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id").references(() => postComments.id),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Post-Likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    postUserUnique: uniqueIndex("post_user_unique_idx").on(table.postId, table.userId),
  }
});

// Gruppen
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  coverImage: text("cover_image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  memberCount: integer("member_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gruppenmitglieder
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member").notNull(), // 'admin', 'moderator', 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return {
    groupUserUnique: uniqueIndex("group_user_unique_idx").on(table.groupId, table.userId),
  }
});

// Gruppenziele
export const groupGoals = pgTable("group_goals", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'distance', 'time', 'reps', 'weight', 'custom'
  target: numeric("target").notNull(),
  unit: text("unit").notNull(),
  currentValue: numeric("current_value").default("0").notNull(),
  deadline: timestamp("deadline"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gruppen-Trainingsplan
export const groupSchedule = pgTable("group_schedule", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  workoutId: integer("workout_id").references(() => workoutTemplates.id),
  recurring: boolean("recurring").default(false).notNull(),
  recurrencePattern: text("recurrence_pattern"), // 'daily', 'weekly', 'monthly'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Challenges/Herausforderungen
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // 'emom', 'amrap', 'hiit', 'running', 'custom', 'fitness_test', 'badge'
  status: text("status").notNull().default('active'), // 'active', 'completed', 'upcoming'
  workoutDetails: jsonb("workout_details").notNull(),
  participantCount: integer("participant_count").default(0).notNull(),
  points: jsonb("points"), // { bronze: number, silver: number, gold: number }
  isPublic: boolean("is_public").default(true).notNull(),
  groupId: integer("group_id").references(() => groups.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Challenge-Teilnehmer
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  currentProgress: integer("current_progress").default(0),
  achievementLevel: text("achievement_level"), // 'bronze', 'silver', 'gold'
  result: jsonb("result"),
  points: integer("points").default(0),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    challengeUserUnique: uniqueIndex("challenge_user_unique_idx").on(table.challengeId, table.userId),
  }
});

// Challenge Ergebnisse/Fortschritte
export const challengeResults = pgTable("challenge_results", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  value: numeric("value").notNull(), // Wert des Ergebnisses (Zeit, Distanz, Wiederholungen)
  unit: text("unit").notNull(), // Einheit (Sekunden, Meter, Wiederholungen)
  notes: text("notes"),
  proof: text("proof"), // Foto/Video als Beweis
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workout-Vorlagen
export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  workoutType: text("workout_type").notNull(), // 'emom', 'amrap', 'hiit', 'running', 'custom'
  workoutDetails: jsonb("workout_details").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  difficulty: text("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  favoriteCount: integer("favorite_count").default(0).notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Benutzer-Workouts (durchgeführte Trainings)
export const userWorkouts = pgTable("user_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workoutId: integer("workout_id").references(() => workoutTemplates.id),
  challengeId: integer("challenge_id").references(() => challenges.id),
  date: timestamp("date").notNull(),
  duration: integer("duration"), // in Sekunden
  calories: integer("calories"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5 Sterne
  completed: boolean("completed").default(true).notNull(),
  workoutData: jsonb("workout_data"), // Details zur Durchführung
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Banner-Positionen
export const bannerPositions = pgTable("banner_positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortcode: text("shortcode").notNull().unique(),
  description: text("description"),
  appDimensions: jsonb("app_dimensions").notNull(),
  webDimensions: jsonb("web_dimensions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Marketing-Banner
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

// Banner-Interaktionen
export const bannerInteractions = pgTable("banner_interactions", {
  id: serial("id").primaryKey(),
  bannerId: integer("banner_id").references(() => marketingBanners.id).notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

// Produkte (E-Commerce)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  price: numeric("price").notNull(),
  image: text("image"),
  gallery: text("gallery").array(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bestellungen
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  status: text("status").notNull(),
  paypalOrderId: text("paypal_order_id"),
  quantity: integer("quantity").default(1).notNull(),
  totalPrice: numeric("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Veranstaltungen
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location").notNull(),
  image: text("image"),
  gallery: text("gallery").array(),
  type: text("type").notNull(), // 'event' oder 'course'
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0).notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringType: text("recurring_type"), // 'daily', 'weekly', 'monthly'
  recurringDays: integer("recurring_days").array(),
  isHighlight: boolean("is_highlight").default(false),
  isArchived: boolean("is_archived").default(false),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  requiresRegistration: boolean("requires_registration").default(true),
  groupId: integer("group_id").references(() => groups.id),
  likes: integer("likes").default(0).notNull(),
  slug: text("slug").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Veranstaltungs-Teilnehmer
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("registered").notNull(), // 'registered', 'confirmed', 'attended', 'cancelled'
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  checkedInAt: timestamp("checked_in_at"),
  notes: text("notes"),
}, (table) => {
  return {
    eventUserUnique: uniqueIndex("event_user_unique_idx").on(table.eventId, table.userId),
  }
});

// Externe Veranstaltungsregistrierungen (für Nicht-Nutzer)
export const eventExternalRegistrations = pgTable("event_external_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default('pending'), // pending, confirmed, cancelled
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Veranstaltungs-Kommentare
export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  parentId: integer("parent_id").references(() => eventComments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Benachrichtigungen
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'like', 'comment', 'follow', 'challenge', 'group', 'event'
  content: text("content").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  sourceId: integer("source_id"), // ID des auslösenden Elements (Post, Challenge, etc.)
  sourceType: text("source_type"), // 'post', 'challenge', 'group', 'event'
  sourceUserId: integer("source_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat-Nachrichten
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: integer("receiver_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-Beziehungen (Folgen/Freundschaften)
export const userRelations = pgTable("user_relations", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  followedId: integer("followed_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").default("follow").notNull(), // 'follow', 'friend', 'blocked'
  status: text("status").default("active").notNull(), // 'active', 'pending', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    followerFollowedUnique: uniqueIndex("follower_followed_unique_idx").on(table.followerId, table.followedId),
  }
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

// Definiere Relationen zwischen Tabellen
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  dailyGoals: many(dailyGoals),
  challengesCreated: many(challenges, { relationName: "challengeCreator" }),
  challengesParticipated: many(challengeParticipants, { relationName: "challengeParticipant" }),
  groupsCreated: many(groups, { relationName: "groupCreator" }),
  groupsJoined: many(groupMembers, { relationName: "groupMember" }),
  workoutsCreated: many(workoutTemplates, { relationName: "workoutCreator" }),
  workoutsCompleted: many(userWorkouts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  dailyGoal: one(dailyGoals, {
    fields: [posts.dailyGoalId],
    references: [dailyGoals.id],
  }),
  challenge: one(challenges, {
    fields: [posts.challengeId],
    references: [challenges.id],
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [challenges.creatorId],
    references: [users.id],
    relationName: "challengeCreator",
  }),
  participants: many(challengeParticipants),
  results: many(challengeResults),
  group: one(groups, {
    fields: [challenges.groupId],
    references: [groups.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
    relationName: "groupCreator",
  }),
  members: many(groupMembers),
  goals: many(groupGoals),
  schedule: many(groupSchedule),
  events: many(events),
}));

// Typen für Tabellen
export type User = typeof users.$inferSelect;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupGoal = typeof groupGoals.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type ChallengeResult = typeof challengeResults.$inferSelect;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type UserWorkout = typeof userWorkouts.$inferSelect;
export type BannerPosition = typeof bannerPositions.$inferSelect;
export type MarketingBanner = typeof marketingBanners.$inferSelect;
export type BannerInteraction = typeof bannerInteractions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type EventExternalRegistration = typeof eventExternalRegistrations.$inferSelect;
export type EventComment = typeof eventComments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type UserRelation = typeof userRelations.$inferSelect;

// Standard-Banner-Positionen
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

// Produkt-Metadaten-Schema
export const productMetadataSchema = z.object({
  type: z.enum(['training', 'coaching', 'supplement', 'custom']),
  description: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

// Insert-Schemas für Tabellen
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertDailyGoalSchema = createInsertSchema(dailyGoals)
  .extend({
    date: z.string().datetime(),
    target: z.number(),
    progress: z.number().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertPostSchema = createInsertSchema(posts)
  .omit({
    id: true,
    likeCount: true,
    commentCount: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertChallengeSchema = createInsertSchema(challenges)
  .extend({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    points: z.object({
      bronze: z.number(),
      silver: z.number(),
      gold: z.number()
    }).optional(),
  })
  .omit({
    id: true,
    participantCount: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants)
  .extend({
    joinedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    result: z.record(z.unknown()).optional(),
  })
  .omit({
    id: true,
    points: true,
    rank: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertGroupSchema = createInsertSchema(groups)
  .omit({
    id: true,
    memberCount: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertEventSchema = createInsertSchema(events)
  .extend({
    date: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    gallery: z.array(z.string()).optional(),
    maxParticipants: z.number().optional(),
    isPublic: z.boolean().default(false),
    requiresRegistration: z.boolean().default(true),
    recurringDays: z.array(z.number()).optional(),
    slug: z.string().optional(),
  })
  .omit({
    id: true,
    currentParticipants: true,
    likes: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertProductSchema = createInsertSchema(products)
  .extend({
    metadata: productMetadataSchema,
    price: z.number(),
    gallery: z.array(z.string()).optional(),
    stockEnabled: z.boolean().optional(),
    stock: z.number().optional(),
    onSale: z.boolean().optional(),
    salePrice: z.number().optional(),
    validUntil: z.string().datetime().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates)
  .extend({
    tags: z.array(z.string()).optional(),
  })
  .omit({
    id: true,
    favoriteCount: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertUserWorkoutSchema = createInsertSchema(userWorkouts)
  .extend({
    date: z.string().datetime(),
    duration: z.number().optional(),
    calories: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
  })
  .omit({
    id: true,
    createdAt: true,
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
    updatedAt: true,
  });

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({
    id: true,
    createdAt: true,
  });

// Typen für Insert-Schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type InsertUserWorkout = z.infer<typeof insertUserWorkoutSchema>;
export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type InsertEventExternalRegistration = z.infer<typeof insertEventExternalRegistrationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Backups-Tabelle für Gerätesynchronisierung
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  data: jsonb("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  deviceInfo: text("device_info"),
  isAutoBackup: boolean("is_auto_backup").default(false),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBackupSchema = createInsertSchema(backups)
  .omit({
    id: true,
    createdAt: true,
  });

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;