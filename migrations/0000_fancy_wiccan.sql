CREATE TABLE "banner_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"banner_id" integer NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "banner_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"shortcode" text NOT NULL,
	"description" text,
	"app_dimensions" jsonb NOT NULL,
	"web_dimensions" jsonb NOT NULL,
	CONSTRAINT "banner_positions_shortcode_unique" UNIQUE("shortcode")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"creator_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"prize" text NOT NULL,
	"prize_description" text NOT NULL,
	"prize_image" text,
	"workout_type" text NOT NULL,
	"workout_details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_external_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text NOT NULL,
	"image" text,
	"gallery" text[],
	"type" text NOT NULL,
	"creator_id" integer NOT NULL,
	"unlimited_participants" boolean DEFAULT false,
	"current_participants" integer DEFAULT 0,
	"is_recurring" boolean DEFAULT false,
	"recurring_type" text,
	"is_highlight" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"requires_registration" boolean DEFAULT true,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"creator_id" integer NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"participant_ids" integer[]
);
--> statement-breakpoint
CREATE TABLE "marketing_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"app_image" text NOT NULL,
	"web_image" text NOT NULL,
	"target_url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"status" text NOT NULL,
	"paypal_order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"images" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"price" numeric NOT NULL,
	"image" text,
	"creator_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"valid_until" timestamp,
	"stock_enabled" boolean DEFAULT false,
	"stock" integer,
	"on_sale" boolean DEFAULT false,
	"sale_price" numeric,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"avatar" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_team_member" boolean DEFAULT false,
	"team_role" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"creator_id" integer NOT NULL,
	"workout_type" text NOT NULL,
	"workout_details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banner_interactions" ADD CONSTRAINT "banner_interactions_banner_id_marketing_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."marketing_banners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_interactions" ADD CONSTRAINT "banner_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_external_registrations" ADD CONSTRAINT "event_external_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_banners" ADD CONSTRAINT "marketing_banners_position_id_banner_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."banner_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;