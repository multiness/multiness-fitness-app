import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertEventExternalRegistrationSchema, Post } from "@shared/schema";
import { db } from "./db";
import { posts } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Posts API endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const allPosts = await db
        .select()
        .from(posts)
        .orderBy(posts.createdAt, "desc"); // Neueste Posts zuerst
      console.log("Fetched posts:", allPosts);
      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await db.select().from(posts).where(eq(posts.id, parseInt(req.params.id))).limit(1);
      if (!post.length) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post[0]);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { userId, content, images } = req.body;
      console.log("Creating new post with data:", { userId, content, images });

      if (!userId || !content) {
        console.error("Missing required fields:", { userId, content });
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newPost = await db.insert(posts).values({
        userId,
        content,
        images: images || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log("Created new post:", newPost[0]);
      res.status(201).json(newPost[0]);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  // Endpoint to migrate existing posts to database
  app.post("/api/posts/migrate", async (req, res) => {
    try {
      const existingPosts = req.body.posts;
      if (!Array.isArray(existingPosts)) {
        return res.status(400).json({ error: "Posts must be an array" });
      }

      console.log(`Starting migration of ${existingPosts.length} posts`);
      const migratedPosts = [];

      for (const post of existingPosts) {
        try {
          const newPost = await db.insert(posts).values({
            userId: post.userId,
            content: post.content,
            images: post.images || [],
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt)
          }).returning();

          migratedPosts.push(newPost[0]);
          console.log(`Successfully migrated post ${newPost[0].id}`);
        } catch (error) {
          console.error("Error migrating individual post:", error);
          // Continue with other posts even if one fails
          continue;
        }
      }

      console.log(`Successfully migrated ${migratedPosts.length} posts`);
      res.status(201).json(migratedPosts);
    } catch (error) {
      console.error("Error in post migration:", error);
      res.status(500).json({ error: "Failed to migrate posts" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;

      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!existingPost.length) {
        return res.status(404).json({ error: "Post not found" });
      }

      const updatedPost = await db
        .update(posts)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning();

      res.json(updatedPost[0]);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const deletedPost = await db
        .delete(posts)
        .where(eq(posts.id, parseInt(req.params.id)))
        .returning();

      if (!deletedPost.length) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Internal server error" });
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

      // Verarbeite das Datum korrekt
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

      // Hier könnte später E-Mail-Versand implementiert werden

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