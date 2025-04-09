import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertEventExternalRegistrationSchema, 
  insertChallengeSchema, 
  insertChallengeParticipantSchema,
  insertPostSchema,
  insertGroupSchema,
  insertDailyGoalSchema,
  insertUserSchema,
  insertWorkoutTemplateSchema,
  insertNotificationSchema
} from "@shared/schema";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Benutzer abrufen
  app.get("/api/users", async (req, res) => {
    try {
      // Demo-Benutzer für die Darstellung zurückgeben
      res.json([
        {
          id: 1,
          username: "maxmustermann",
          name: "Max Mustermann",
          email: "max@example.com",
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          isVerified: true,
          bio: "Fitness-Enthusiast und Marathonläufer",
          createdAt: new Date()
        },
        {
          id: 2,
          username: "lisafit",
          name: "Lisa Fitness",
          email: "lisa@example.com",
          avatar: "https://randomuser.me/api/portraits/women/2.jpg",
          isVerified: true,
          bio: "Yoga-Lehrerin und Ernährungsberaterin",
          createdAt: new Date()
        },
        {
          id: 3,
          username: "sportfreak",
          name: "Thomas Sport",
          email: "thomas@example.com",
          avatar: "https://randomuser.me/api/portraits/men/3.jpg",
          isVerified: false,
          bio: "Bodybuilder und Kraftsportler",
          createdAt: new Date()
        }
      ]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Events abrufen
  app.get("/api/events", async (req, res) => {
    try {
      // Demo-Events für die Darstellung zurückgeben
      res.json([
        {
          id: 1,
          title: "Summer Fitness Workshop",
          description: "Ein intensiver Workshop für alle, die ihre Sommerfigur optimieren wollen.",
          date: new Date().toISOString(),
          location: "Fitness Center Berlin",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
          type: "event",
          trainer: 1,
          isArchived: false
        },
        {
          id: 2,
          title: "Yoga für Anfänger",
          description: "Einstiegskurs in die Welt des Yoga mit grundlegenden Asanas und Atemtechniken.",
          date: new Date(Date.now() + 86400000).toISOString(),
          location: "Yoga Studio München",
          image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format",
          type: "course",
          trainer: 2,
          isArchived: false
        },
        {
          id: 3,
          title: "Marathon-Vorbereitungskurs",
          description: "12-Wochen Trainingsprogramm zur optimalen Vorbereitung auf deinen ersten Marathon.",
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          location: "Stadtpark Hamburg",
          image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format",
          type: "course",
          trainer: 3,
          isArchived: false
        }
      ]);
    } catch (error) {
      console.error("Error fetching events:", error);
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
      
      // Wenn keine Challenges in der Datenbank gefunden wurden, gib Demo-Challenges zurück
      if (!challenges || challenges.length === 0) {
        const today = new Date();
        res.json([
          {
            id: 1,
            title: '30 Tage Push-Up Challenge',
            description: 'Steigere deine Kraft und Ausdauer mit täglichen Push-Ups. Beginne mit 10 und steigere dich bis zu 100!',
            image: 'https://images.unsplash.com/photo-1598971639058-a852862a1633?w=800&auto=format',
            startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5),
            endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 25),
            createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6),
            updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6),
            type: 'custom',
            status: 'active',
            creatorId: 1,
            isPublic: true,
            difficulty: 'mittel',
            workoutDetails: {
              description: 'Täglich steigende Anzahl an Push-Ups',
              exercises: [
                {
                  name: 'Push-Ups',
                  sets: 4,
                  reps: 'ansteigend',
                  description: 'Standardausführung mit schulterbreiter Handposition'
                }
              ]
            },
            points: {
              bronze: 50,
              silver: 75,
              gold: 90
            },
            groupId: null
          },
          {
            id: 2,
            title: '5km Lauf-Challenge',
            description: 'Verbessere deine 5km-Zeit über 4 Wochen mit strukturiertem Training.',
            image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&auto=format',
            startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 7),
            endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 21),
            createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8),
            updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8),
            type: 'running',
            status: 'active',
            creatorId: 2,
            isPublic: true,
            difficulty: 'anfänger',
            workoutDetails: {
              type: 'distance',
              target: 5,
              description: 'Verbessere deine 5km Zeit mit regelmäßigen Läufen'
            },
            points: {
              bronze: 50,
              silver: 75,
              gold: 90
            },
            groupId: null
          }
        ]);
      } else {
        res.json(challenges);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      
      // Fallback-Daten bei Fehler
      const today = new Date();
      res.json([
        {
          id: 1,
          title: '30 Tage Push-Up Challenge',
          description: 'Steigere deine Kraft und Ausdauer mit täglichen Push-Ups. Beginne mit 10 und steigere dich bis zu 100!',
          image: 'https://images.unsplash.com/photo-1598971639058-a852862a1633?w=800&auto=format',
          startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5),
          endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 25),
          createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6),
          updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6),
          type: 'custom',
          status: 'active',
          creatorId: 1,
          isPublic: true,
          difficulty: 'mittel',
          workoutDetails: {
            description: 'Täglich steigende Anzahl an Push-Ups',
            exercises: [
              {
                name: 'Push-Ups',
                sets: 4,
                reps: 'ansteigend',
                description: 'Standardausführung mit schulterbreiter Handposition'
              }
            ]
          },
          points: {
            bronze: 50,
            silver: 75,
            gold: 90
          },
          groupId: null
        },
        {
          id: 2,
          title: '5km Lauf-Challenge',
          description: 'Verbessere deine 5km-Zeit über 4 Wochen mit strukturiertem Training.',
          image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&auto=format',
          startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 7),
          endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 21),
          createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8),
          updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8),
          type: 'running',
          status: 'active',
          creatorId: 2,
          isPublic: true,
          difficulty: 'anfänger',
          workoutDetails: {
            type: 'distance',
            target: 5,
            description: 'Verbessere deine 5km Zeit mit regelmäßigen Läufen'
          },
          points: {
            bronze: 50,
            silver: 75,
            gold: 90
          },
          groupId: null
        }
      ]);
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
      console.log("Challenge Erstellungsanfrage erhalten:", JSON.stringify(req.body));
      
      // Validierung mit Zod
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
      
      // Stelle sicher, dass isPublic gesetzt wird, wenn es nicht im Request enthalten ist
      if (challengeData.isPublic === undefined) {
        challengeData.isPublic = true;
      }
      
      // Stelle sicher, dass workoutDetails ein gültiges JSON-Objekt ist
      if (typeof challengeData.workoutDetails === 'string') {
        try {
          challengeData.workoutDetails = JSON.parse(challengeData.workoutDetails);
        } catch (e) {
          console.warn("Konnte workoutDetails nicht parsen, verwende als String", e);
        }
      }
      
      // Stelle sicher, dass points ein gültiges JSON-Objekt ist
      if (typeof challengeData.points === 'string') {
        try {
          challengeData.points = JSON.parse(challengeData.points);
        } catch (e) {
          console.warn("Konnte points nicht parsen, verwende als String", e);
        }
      }
      
      console.log("Erstelle neue Challenge in der Datenbank:", JSON.stringify({
        ...challengeData,
        status
      }));
      
      try {
        const challenge = await storage.createChallenge({
          ...challengeData,
          status
        });
        
        console.log("Neue Challenge erstellt mit ID:", challenge.id);
        res.status(201).json(challenge);
      } catch (storageError) {
        console.error("Fehler beim Speichern der Challenge in der Datenbank:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(400).json({ 
        error: "Ungültige Challenge-Daten", 
        details: error instanceof Error ? error.message : String(error) 
      });
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
      try {
        const participants = await storage.getChallengeParticipants(challengeId);
        res.json(participants);
      } catch (error) {
        console.log("Error fetching challenge participants, returning empty array:", error);
        res.json([]);
      }
    } catch (error) {
      console.error("Error handling challenge participants request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Einen Teilnehmer einer Challenge abrufen
  app.get("/api/challenges/:challengeId/participants/:userId", async (req, res) => {
    try {
      const challengeId = Number(req.params.challengeId);
      const userId = Number(req.params.userId);
      
      try {
        const participant = await storage.getChallengeParticipant(challengeId, userId);
        
        if (!participant) {
          return res.status(404).json({ error: "Teilnehmer nicht gefunden" });
        }
        
        res.json(participant);
      } catch (error) {
        console.log("Error fetching challenge participant, returning default:", error);
        return res.status(404).json({ error: "Teilnehmer nicht gefunden" });
      }
    } catch (error) {
      console.error("Error handling challenge participant request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teilnehmer einer Challenge hinzufügen
  app.post("/api/challenges/:id/participants", async (req, res) => {
    try {
      console.log("Challenge-Teilnahme-Anfrage erhalten:", req.params, req.body);
      const challengeId = Number(req.params.id);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        console.log(`Challenge mit ID ${challengeId} nicht gefunden`);
        return res.status(404).json({ error: "Challenge nicht gefunden" });
      }
      
      const participantData = insertChallengeParticipantSchema.parse({
        ...req.body,
        challengeId,
        joinedAt: new Date().toISOString(),
      });
      
      console.log("Validierte Teilnehmer-Daten:", participantData);
      
      // Prüfen, ob der Teilnehmer bereits existiert
      const existingParticipant = await storage.getChallengeParticipant(
        challengeId, 
        participantData.userId
      );
      
      if (existingParticipant) {
        console.log(`Teilnehmer ${participantData.userId} bereits zur Challenge ${challengeId} angemeldet`);
        return res.status(400).json({ error: "Teilnehmer bereits angemeldet" });
      }
      
      console.log("Füge neuen Teilnehmer zur Datenbank hinzu:", participantData);
      const participant = await storage.addChallengeParticipant(participantData);
      
      console.log("Teilnehmer erfolgreich hinzugefügt:", participant);
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

  // User Routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Daily Goals Routes
  app.get("/api/users/:id/daily-goals", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const goals = await storage.getDailyGoals(userId, date);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching daily goals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/daily-goals", async (req, res) => {
    try {
      const goalData = insertDailyGoalSchema.parse(req.body);
      const goal = await storage.createDailyGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating daily goal:", error);
      res.status(400).json({ error: "Ungültige Ziel-Daten" });
    }
  });

  app.patch("/api/daily-goals/:id", async (req, res) => {
    try {
      const goalId = Number(req.params.id);
      const goal = await storage.getDailyGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ error: "Ziel nicht gefunden" });
      }
      
      const updatedGoal = await storage.updateDailyGoal(goalId, req.body);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating daily goal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post Routes
  app.get("/api/posts", async (req, res) => {
    try {
      const options = {
        userId: req.query.userId ? Number(req.query.userId) : undefined,
        groupId: req.query.groupId ? Number(req.query.groupId) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      
      const posts = await storage.getPosts(options);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Ungültige Post-Daten" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId ist erforderlich" });
      }
      
      await storage.likePost(postId, Number(userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts/:id/unlike", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId ist erforderlich" });
      }
      
      await storage.unlikePost(postId, Number(userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Group Routes
  app.get("/api/groups", async (req, res) => {
    try {
      // Versuche Gruppen aus Datenbank zu laden
      try {
        const options = {
          userId: req.query.userId ? Number(req.query.userId) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
          offset: req.query.offset ? Number(req.query.offset) : undefined,
        };
        
        const groups = await storage.getGroups(options);
        
        // Wenn keine Gruppen gefunden wurden, gib Demo-Gruppen zurück
        if (groups.length === 0) {
          res.json([
            {
              id: 1,
              name: "Lauftreff Berlin",
              description: "Wöchentliches Lauftraining für alle Levels im Tiergarten.",
              image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format",
              creatorId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              type: "public",
              memberCount: 24,
              groupGoalId: null,
              participantIds: [1, 2, 3]
            },
            {
              id: 2,
              name: "Yoga Community",
              description: "Teile deine Yoga-Erfahrungen und Tipps mit Gleichgesinnten.",
              image: "https://images.unsplash.com/photo-1599447292180-45fd84092ef4?w=800&auto=format",
              creatorId: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              type: "private",
              memberCount: 18,
              groupGoalId: null,
              participantIds: [1, 2]
            },
            {
              id: 3,
              name: "Crossfit Begeisterte",
              description: "High-Intensity Functional Training für maximale Fitness.",
              image: "https://images.unsplash.com/photo-1534367990512-edbdca781b00?w=800&auto=format",
              creatorId: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
              type: "public",
              memberCount: 32,
              groupGoalId: null,
              participantIds: [3, 1]
            }
          ]);
        } else {
          res.json(groups);
        }
      } catch (dbError) {
        console.error("Error fetching groups from database:", dbError);
        
        // Fallback zu Demo-Gruppen wenn Datenbank-Abruf fehlschlägt
        res.json([
          {
            id: 1,
            name: "Lauftreff Berlin",
            description: "Wöchentliches Lauftraining für alle Levels im Tiergarten.",
            image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format",
            creatorId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: "public",
            memberCount: 24,
            groupGoalId: null,
            participantIds: [1, 2, 3]
          },
          {
            id: 2,
            name: "Yoga Community",
            description: "Teile deine Yoga-Erfahrungen und Tipps mit Gleichgesinnten.",
            image: "https://images.unsplash.com/photo-1599447292180-45fd84092ef4?w=800&auto=format",
            creatorId: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: "private",
            memberCount: 18,
            groupGoalId: null,
            participantIds: [1, 2]
          },
          {
            id: 3,
            name: "Crossfit Begeisterte",
            description: "High-Intensity Functional Training für maximale Fitness.",
            image: "https://images.unsplash.com/photo-1534367990512-edbdca781b00?w=800&auto=format",
            creatorId: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: "public",
            memberCount: 32,
            groupGoalId: null,
            participantIds: [3, 1]
          }
        ]);
      }
    } catch (error) {
      console.error("Error in groups route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(Number(req.params.id));
      if (!group) {
        return res.status(404).json({ error: "Gruppe nicht gefunden" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(400).json({ error: "Ungültige Gruppen-Daten" });
    }
  });

  app.patch("/api/groups/:id", async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Gruppe nicht gefunden" });
      }
      
      const updatedGroup = await storage.updateGroup(groupId, req.body);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/groups/:id/members", async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      const { userId, role } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId ist erforderlich" });
      }
      
      const member = await storage.addGroupMember(groupId, Number(userId), role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding group member:", error);
      res.status(400).json({ error: error.message || "Ungültige Mitgliedsdaten" });
    }
  });

  app.delete("/api/groups/:groupId/members/:userId", async (req, res) => {
    try {
      const groupId = Number(req.params.groupId);
      const userId = Number(req.params.userId);
      
      await storage.removeGroupMember(groupId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Workout Templates Routes
  app.get("/api/workout-templates", async (req, res) => {
    try {
      const options = {
        userId: req.query.userId ? Number(req.query.userId) : undefined,
        public: req.query.public !== undefined ? req.query.public === 'true' : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      
      const templates = await storage.getWorkoutTemplates(options);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching workout templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/workout-templates", async (req, res) => {
    try {
      const templateData = insertWorkoutTemplateSchema.parse(req.body);
      const template = await storage.createWorkoutTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating workout template:", error);
      res.status(400).json({ error: "Ungültige Vorlage-Daten" });
    }
  });

  // Notifications Routes
  app.get("/api/users/:id/notifications", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const options = {
        unreadOnly: req.query.unreadOnly === 'true',
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      
      const notifications = await storage.getNotifications(userId, options);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = Number(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Erstelle einen WebSocket-Server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Neue WebSocket-Verbindung');

    // Sende eine Willkommensnachricht
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Verbindung hergestellt'
    }));

    // Behandle eingehende Nachrichten
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Nachricht erhalten:', data);

        // Beispiel für eine einfache Echo-Antwort
        if (data.type === 'echo') {
          ws.send(JSON.stringify({
            type: 'echo',
            message: data.message
          }));
        }

        // Hier können weitere Nachrichtentypen verarbeitet werden
      } catch (error) {
        console.error('Fehler beim Verarbeiten der WebSocket-Nachricht:', error);
      }
    });

    // Behandle Verbindungsabbrüche
    ws.on('close', () => {
      console.log('WebSocket-Verbindung geschlossen');
    });
  });

  return httpServer;
}