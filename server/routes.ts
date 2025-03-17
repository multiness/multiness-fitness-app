import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { posts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/posts", async (req, res) => {
    try {
      console.log("GET /api/posts called");

      // Basic query with error handling
      const allPosts = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt));

      // Log the result
      console.log("Posts found:", {
        count: allPosts.length,
        firstPost: allPosts[0],
        lastPost: allPosts[allPosts.length - 1]
      });

      // Send response with explicit content type
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { userId, content, images, dailyGoal } = req.body;
      console.log("Creating post with data:", { userId, content, hasImages: !!images?.length });

      if (!userId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newPost] = await db.insert(posts).values({
        userId,
        content: content.trim(),
        images: images || [],
        dailyGoal,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log("New post created:", newPost);
      return res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      return res.status(500).json({ error: "Failed to create post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}