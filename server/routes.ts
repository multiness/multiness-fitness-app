import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertEventExternalRegistrationSchema, insertChallengeSchema, insertChallengeParticipantSchema } from "@shared/schema";

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

  // Challenge Routes
  // Alle Challenges abrufen
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Eine einzelne Challenge abrufen
  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(Number(req.params.id));
      if (!challenge) {
        return res.status(404).json({ error: "Challenge nicht gefunden" });
      }
      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Neue Challenge erstellen
  app.post("/api/challenges", async (req, res) => {
    try {
      const now = new Date();
      const challengeData = insertChallengeSchema.parse(req.body);
      
      // Status automatisch basierend auf Datum setzen
      const startDate = new Date(challengeData.startDate);
      const endDate = new Date(challengeData.endDate);
      
      let status;
      if (startDate > now) {
        status = 'upcoming';
      } else if (endDate < now) {
        status = 'completed';
      } else {
        status = 'active';
      }
      
      const challenge = await storage.createChallenge({
        ...challengeData,
        status
      });
      
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(400).json({ error: "Ungültige Challenge-Daten" });
    }
  });

  // Challenge aktualisieren
  app.patch("/api/challenges/:id", async (req, res) => {
    try {
      const challengeId = Number(req.params.id);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge nicht gefunden" });
      }
      
      // Status neu berechnen wenn Start- oder Enddatum geändert wurden
      const updateData = { ...req.body };
      if (updateData.startDate || updateData.endDate) {
        const now = new Date();
        const startDate = updateData.startDate 
          ? new Date(updateData.startDate) 
          : challenge.startDate;
        const endDate = updateData.endDate 
          ? new Date(updateData.endDate) 
          : challenge.endDate;
        
        if (startDate > now) {
          updateData.status = 'upcoming';
        } else if (endDate < now) {
          updateData.status = 'completed';
        } else {
          updateData.status = 'active';
        }
      }
      
      const updatedChallenge = await storage.updateChallenge(challengeId, updateData);
      res.json(updatedChallenge);
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Challenge Teilnehmer Routes
  // Alle Teilnehmer einer Challenge abrufen
  app.get("/api/challenges/:id/participants", async (req, res) => {
    try {
      const challengeId = Number(req.params.id);
      const participants = await storage.getChallengeParticipants(challengeId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching challenge participants:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Einen Teilnehmer einer Challenge abrufen
  app.get("/api/challenges/:challengeId/participants/:userId", async (req, res) => {
    try {
      const challengeId = Number(req.params.challengeId);
      const userId = Number(req.params.userId);
      
      const participant = await storage.getChallengeParticipant(challengeId, userId);
      
      if (!participant) {
        return res.status(404).json({ error: "Teilnehmer nicht gefunden" });
      }
      
      res.json(participant);
    } catch (error) {
      console.error("Error fetching challenge participant:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teilnehmer einer Challenge hinzufügen
  app.post("/api/challenges/:id/participants", async (req, res) => {
    try {
      const challengeId = Number(req.params.id);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge nicht gefunden" });
      }
      
      const participantData = insertChallengeParticipantSchema.parse({
        ...req.body,
        challengeId,
        joinedAt: new Date().toISOString(),
      });
      
      // Prüfen, ob der Teilnehmer bereits existiert
      const existingParticipant = await storage.getChallengeParticipant(
        challengeId, 
        participantData.userId
      );
      
      if (existingParticipant) {
        return res.status(400).json({ error: "Teilnehmer bereits angemeldet" });
      }
      
      const participant = await storage.addChallengeParticipant(participantData);
      
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error adding challenge participant:", error);
      res.status(400).json({ error: "Ungültige Teilnehmer-Daten" });
    }
  });

  // Teilnehmer einer Challenge aktualisieren
  app.patch("/api/challenges/:challengeId/participants/:userId", async (req, res) => {
    try {
      const challengeId = Number(req.params.challengeId);
      const userId = Number(req.params.userId);
      
      const participant = await storage.getChallengeParticipant(challengeId, userId);
      
      if (!participant) {
        return res.status(404).json({ error: "Teilnehmer nicht gefunden" });
      }
      
      // Wenn der Teilnehmer als abgeschlossen markiert wird, setze das completedAt-Datum
      const updateData = { ...req.body };
      if (updateData.achievementLevel && !participant.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }
      
      const updatedParticipant = await storage.updateChallengeParticipant(
        challengeId, 
        userId, 
        updateData
      );
      
      res.json(updatedParticipant);
    } catch (error) {
      console.error("Error updating challenge participant:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}