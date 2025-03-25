import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// In-Memory Storage für Groups
let groups = [];
let groupIdCounter = 1;

// In-Memory Storage für Challenges
let challenges = [];
let challengeIdCounter = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Groups API
  app.get("/api/groups", async (req, res) => {
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    const newGroup = {
      id: groupIdCounter++,
      ...req.body,
      createdAt: new Date()
    };
    groups.push(newGroup);
    res.status(201).json(newGroup);
  });

  // Challenges API
  app.get("/api/challenges", async (req, res) => {
    res.json(challenges);
  });

  app.post("/api/challenges", async (req, res) => {
    const newChallenge = {
      id: challengeIdCounter++,
      ...req.body,
      createdAt: new Date()
    };
    challenges.push(newChallenge);
    res.status(201).json(newChallenge);
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db.select().from(products);
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const [product] = await db.insert(products).values(productData).returning();
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // Ein einzelnes Produkt abrufen
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await db.select().from(products).where({ id: Number(req.params.id) }).first();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Produkt aktualisieren
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await db.select().from(products).where({ id: productId }).first();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verarbeite das Datum korrekt
      const updateData = { ...req.body };
      if (updateData.validUntil) {
        updateData.validUntil = new Date(updateData.validUntil);
      }

      await db.update(products).set(updateData).where({ id: productId });
      const updatedProduct = await db.select().from(products).where({ id: productId }).first();
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
      const product = await db.select().from(products).where({ id: productId }).first();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (req.query.archive === 'true') {
        // Archivieren
        await db.update(products).set({ isArchived: true, isActive: false }).where({ id: productId });
        res.json({ message: "Product archived successfully" });
      } else {
        // Permanent löschen
        await db.delete().from(products).where({ id: productId });
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