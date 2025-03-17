import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertEventExternalRegistrationSchema } from "@shared/schema";
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

  app.get("/api/posts/user/:userId", async (req, res) => {
    try {
      const userPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, parseInt(req.params.userId)))
        .orderBy(desc(posts.createdAt));
      res.json(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const { content } = req.body;
      const [updatedPost] = await db
        .update(posts)
        .set({
          content: content.trim(),
          updatedAt: new Date()
        })
        .where(eq(posts.id, parseInt(req.params.id)))
        .returning();

      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      await db
        .delete(posts)
        .where(eq(posts.id, parseInt(req.params.id)));

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Alle Produkte abrufen
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Ein einzelnes Produkt abrufen
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Neues Produkt erstellen
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // Produkt aktualisieren
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updateData = { ...req.body };
      if (updateData.validUntil) {
        updateData.validUntil = new Date(updateData.validUntil);
      }

      const updatedProduct = await storage.updateProduct(productId, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Produkt archivieren/löschen
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (req.query.archive === 'true') {
        // Archivieren
        await storage.updateProduct(productId, {
          isArchived: true,
          isActive: false
        });
        res.json({ message: "Product archived successfully" });
      } else {
        // Permanent löschen
        await storage.deleteProduct(productId);
        res.json({ message: "Product deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting/archiving product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Neue Route für externe Event-Registrierungen
  app.post("/api/events/:id/register-external", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: "Event nicht gefunden" });
      }

      if (!event.isPublic || !event.requiresRegistration) {
        return res.status(400).json({ error: "Event erlaubt keine externe Registrierung" });
      }

      const registrationData = insertEventExternalRegistrationSchema.parse({
        ...req.body,
        eventId,
      });

      const registration = await storage.createEventExternalRegistration(registrationData);

      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating external registration:", error);
      res.status(400).json({ error: "Ungültige Registrierungsdaten" });
    }
  });

  // Endpoint zum Abrufen der Registrierungen eines Events
  app.get("/api/events/:id/registrations", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const registrations = await storage.getEventExternalRegistrations(eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}