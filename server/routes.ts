import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertEventExternalRegistrationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Update create event route to generate slug -  This section is removed as per the intention.
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