import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
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
  insertNotificationSchema,
  insertEventSchema,
  backups
} from "../shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import { addMessage, getMessages, getAllChatIds } from "./data/chats.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Benutzer-Speicher mit Persistenz über Storage-API
  let users = [
    {
      id: 1,
      username: "maxmustermann",
      name: "Max Mustermann",
      email: "max@example.com",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      isVerified: true,
      isAdmin: true,
      isTeamMember: true,
      teamRole: "head_trainer",
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
      isAdmin: false,
      isTeamMember: true,
      teamRole: "yoga_trainer",
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
      isAdmin: false,
      isTeamMember: false,
      bio: "Bodybuilder und Kraftsportler",
      createdAt: new Date()
    }
  ];
  
  // Persistente Benutzer-Speicherung durch globale Variable
  const GLOBAL_STORAGE_KEY = 'PERSISTED_USERS_DATA';
  
  // Hilfsfunktion zum Speichern der Benutzerdaten
  const saveUsersToStorage = () => {
    try {
      // Speichere in globalem Speicherbereich
      (global as any)[GLOBAL_STORAGE_KEY] = JSON.stringify(users);
      console.log("Benutzerdaten in globalem Speicher gespeichert");
    } catch (error) {
      console.error('Fehler beim Speichern der Benutzerdaten:', error);
    }
  };
  
  // Lade Benutzerdaten beim Start
  try {
    const savedData = (global as any)[GLOBAL_STORAGE_KEY];
    if (savedData) {
      const parsedUsers = JSON.parse(savedData);
      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
        console.log("Benutzerdaten aus globalem Speicher geladen");
        users = parsedUsers;
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der gespeicherten Benutzerdaten:', error);
  }

  // Benutzer abrufen
  app.get("/api/users", async (req, res) => {
    try {
      // Stellen sicher, dass Max Mustermann immer Admin ist
      users = users.map(user => {
        if (user.id === 1 && user.username === "maxmustermann") {
          return {
            ...user,
            isAdmin: true,
            isTeamMember: true,
            teamRole: "head_trainer"
          };
        }
        return user;
      });
      
      // Speichern der aktualisierten Benutzerliste
      saveUsersToStorage();
      
      // Aktuelle Benutzerliste zurückgeben
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Events abrufen
  app.get("/api/events", async (req, res) => {
    try {
      const options: {
        groupId?: number;
        upcoming?: boolean;
        limit?: number;
        offset?: number;
      } = {};

      // Abfrageparameter verarbeiten
      if (req.query.groupId) {
        options.groupId = Number(req.query.groupId);
      }
      
      if (req.query.upcoming === 'true') {
        options.upcoming = true;
      }
      
      if (req.query.limit) {
        options.limit = Number(req.query.limit);
      }
      
      if (req.query.offset) {
        options.offset = Number(req.query.offset);
      }

      const events = await storage.getEvents(options);
      
      // Wenn keine Events in der Datenbank, erstelle einige Beispiel-Events
      if (!events || events.length === 0) {
        console.log("Keine Events in der Datenbank gefunden, erstelle Beispiel-Events");
        
        // Füge einige Beispiel-Events hinzu
        const now = new Date();
        const sampleEvents = [
          {
            title: "Summer Fitness Workshop",
            description: "Ein intensiver Workshop für alle, die ihre Sommerfigur optimieren wollen.",
            date: now.toISOString(),
            location: "Fitness Center Berlin",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
            type: "event",
            creatorId: 1,
            isPublic: true,
            requiresRegistration: true,
            isArchived: false,
            isActive: true
          },
          {
            title: "Yoga für Anfänger",
            description: "Einstiegskurs in die Welt des Yoga mit grundlegenden Asanas und Atemtechniken.",
            date: new Date(now.getTime() + 86400000).toISOString(),
            location: "Yoga Studio München",
            image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format",
            type: "course",
            creatorId: 1,
            isPublic: true,
            requiresRegistration: true,
            isArchived: false,
            isActive: true
          },
          {
            title: "Marathon-Vorbereitungskurs",
            description: "12-Wochen Trainingsprogramm zur optimalen Vorbereitung auf deinen ersten Marathon.",
            date: new Date(now.getTime() + 86400000 * 2).toISOString(),
            location: "Stadtpark Hamburg",
            image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format",
            type: "course",
            creatorId: 1,
            isPublic: true,
            requiresRegistration: true,
            isArchived: false,
            isActive: true
          }
        ];
        
        for (const eventData of sampleEvents) {
          try {
            await storage.createEvent(eventData);
          } catch (err) {
            console.error("Fehler beim Erstellen eines Beispiel-Events:", err);
          }
        }
        
        // Hole die erstellten Events aus der Datenbank
        const initialEvents = await storage.getEvents(options);
        return res.json(initialEvents);
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ein einzelnes Event abrufen
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event nicht gefunden" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // Alle Produkte abrufen
  // Chat-Nachrichten abrufen
  app.get("/api/chat/:chatId/messages", (req, res) => {
    try {
      const { chatId } = req.params;
      const messages = getMessages(chatId);
      console.log(`Chat-Nachrichten für ${chatId} abgerufen: ${messages.length} Nachrichten gefunden`);
      res.json(messages);
    } catch (error) {
      console.error("Fehler beim Abrufen der Chat-Nachrichten:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  // Produkte abrufen
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

  // Event erstellen
  app.post("/api/events", async (req, res) => {
    try {
      // Parse und validiere die Daten mit dem Zod-Schema
      const eventData = insertEventSchema.parse(req.body);
      
      // Stelle sicher, dass die Daten im richtigen Format sind
      if (typeof eventData.date === 'string') {
        eventData.date = new Date(eventData.date);
      }
      
      if (eventData.endDate && typeof eventData.endDate === 'string') {
        eventData.endDate = new Date(eventData.endDate);
      }
      
      // Generiere einen Slug aus dem Titel, wenn keiner vorhanden ist
      if (!eventData.slug && eventData.title) {
        const slug = eventData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Entferne nicht-alphanumerische Zeichen
          .replace(/\s+/g, '-') // Ersetze Leerzeichen durch Bindestrich
          .replace(/-+/g, '-'); // Entferne mehrfache Bindestriche
          
        eventData.slug = `${slug}-${Date.now()}`;
      }

      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: "Ungültige Event-Daten" });
    }
  });
  
  // Event aktualisieren
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event nicht gefunden" });
      }
      
      // Verarbeite Datums-Werte
      const updateData = { ...req.body };
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }
      
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      const updatedEvent = await storage.updateEvent(eventId, updateData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren des Events" });
    }
  });
  
  // Event löschen oder archivieren
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event nicht gefunden" });
      }
      
      if (req.query.archive === 'true') {
        // Nur archivieren
        await storage.updateEvent(eventId, { 
          isArchived: true, 
          isActive: false 
        });
        res.json({ message: "Event erfolgreich archiviert" });
      } else {
        // Permanent löschen
        await storage.deleteEvent(eventId);
        res.json({ message: "Event erfolgreich gelöscht" });
      }
    } catch (error) {
      console.error("Error deleting/archiving event:", error);
      res.status(500).json({ error: "Fehler beim Löschen/Archivieren des Events" });
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
      console.log(`GET /api/challenges/${challengeId}/participants - Teilnehmer werden abgefragt`);
      try {
        const participants = await storage.getChallengeParticipants(challengeId);
        console.log(`Teilnehmer für Challenge ${challengeId} gefunden:`, participants);
        res.json(participants);
      } catch (error) {
        console.error("Error fetching challenge participants, returning empty array:", error);
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
  // Einzelnen Benutzer abrufen
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige Benutzer-ID" });
      }
      
      // Benutzer aus dem persistenten Speicher abrufen
      let user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }
      
      // Stelle sicher, dass Max Mustermann immer Admin-Rechte hat
      if (userId === 1 && user.username === "maxmustermann") {
        user = {
          ...user,
          isAdmin: true,
          isTeamMember: true,
          teamRole: "head_trainer"
        };
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Benutzer aktualisieren
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige Benutzer-ID" });
      }
      
      console.log(`Aktualisiere Benutzer mit ID ${userId}:`, req.body);
      
      // Benutzer in In-Memory Store aktualisieren
      const userIndex = users.findIndex(user => user.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      // Aktualisiere den Benutzer mit den neuen Daten
      let updatedUser = {
        ...users[userIndex],
        ...req.body,
        updatedAt: new Date()
      };
      
      // Stelle sicher, dass Max Mustermann immer Admin-Rechte behält
      if (userId === 1 && updatedUser.username === "maxmustermann") {
        updatedUser = {
          ...updatedUser,
          isAdmin: true,
          isTeamMember: true,
          teamRole: updatedUser.teamRole || "head_trainer"
        };
      }
      
      // Speichere den aktualisierten Benutzer zurück in die Liste
      users[userIndex] = updatedUser;
      
      // Persistiere Änderungen in der Datei
      saveUsersToStorage();
      
      // Gib den aktualisierten Benutzer zurück
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Neuen Benutzer anlegen
  app.post("/api/users", async (req, res) => {
    try {
      console.log("Neuer Benutzer wird erstellt:", req.body);
      
      // In-Memory-Speicherung: Neuen Benutzer erstellen und in Liste speichern
      const newUserId = Math.max(0, ...users.map(u => u.id)) + 1;
      const newUser = {
        id: newUserId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Sicherstellen, dass erforderliche Felder vorhanden sind
      if (!newUser.username) newUser.username = `user_${newUserId}`;
      if (!newUser.name) newUser.name = `User ${newUserId}`;
      if (!newUser.bio) newUser.bio = "";
      if (!newUser.avatar) newUser.avatar = "https://via.placeholder.com/150";
      
      // Benutzer zur In-Memory-Liste hinzufügen
      users.push(newUser);
      
      // Persistiere Änderungen in der Datei
      saveUsersToStorage();
      
      // Erfolgreiche Antwort zurückgeben
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
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
      
      // Benachrichtige alle Clients über die neue Gruppe via WebSocket
      const wsMessage = JSON.stringify({
        type: 'group_update',
        action: 'create',
        data: group
      });
      
      subscriptions.groups.forEach(client => {
        if (client.readyState === 1) { // Prüfe, ob der WebSocket offen ist
          client.send(wsMessage);
        }
      });
      
      console.log('Neue Gruppe erstellt und über WebSocket verteilt:', group.name);
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

  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      
      try {
        // Überprüfe, ob die Gruppe existiert
        const group = await storage.getGroup(groupId);
        
        if (!group) {
          console.log(`Gruppe ${groupId} existiert nicht, leere Mitgliederliste zurückgegeben`);
          return res.json([]); // Leere Mitgliederliste zurückgeben, statt 404
        }
        
        // Hole alle Mitglieder dieser Gruppe
        const members = await storage.getGroupMembers(groupId);
        console.log(`Gruppenmitglieder für Gruppe ${groupId} abgefragt, Ergebnis:`, members.length);
        res.json(members);
      } catch (groupError) {
        console.warn(`Fehler beim Abrufen der Gruppe ${groupId}:`, groupError);
        res.json([]); // Leere Mitgliederliste zurückgeben im Fehlerfall
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Gruppenmitglieder:", error);
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
      
      // Benachrichtige alle verbundenen Clients über die Änderung
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'group_update',
            action: 'member_added',
            groupId,
            data: member
          }));
        }
      });
      
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
  // Backup management routes
  app.get('/api/backups/list', async (req, res) => {
    try {
      // Lade Backups aus der Datenbank
      const allBackups = await db.select().from(backups).orderBy(desc(backups.timestamp));
      
      const backupList = allBackups.map(backup => ({
        name: backup.name,
        timestamp: backup.timestamp,
        isServerBackup: true,
        deviceInfo: backup.deviceInfo,
        isAutoBackup: backup.isAutoBackup,
        size: backup.size
      }));
      
      console.log(`${backupList.length} Backups vom Server geladen`);
      res.json(backupList);
    } catch (error) {
      console.error('Error fetching backups:', error);
      res.status(500).json({ error: 'Failed to fetch backups' });
    }
  });

  app.post('/api/backups/create', async (req, res) => {
    try {
      const { name, data, timestamp, deviceInfo } = req.body;
      
      if (!name || !data) {
        return res.status(400).json({ error: 'Name and data are required' });
      }
      
      // Prüfe, ob ein Backup mit diesem Namen bereits existiert
      const existingBackup = await db.select().from(backups).where(eq(backups.name, name)).limit(1);
      
      if (existingBackup.length > 0) {
        // Update das bestehende Backup
        const updatedBackup = await db.update(backups)
          .set({
            data,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            deviceInfo: deviceInfo || null,
            size: JSON.stringify(data).length
          })
          .where(eq(backups.name, name))
          .returning();
        
        console.log(`Backup '${name}' wurde aktualisiert`);
        return res.status(200).json({
          name,
          timestamp: updatedBackup[0].timestamp.toISOString(),
          stored: true,
          updated: true
        });
      }
      
      // Erstelle ein neues Backup
      const newBackup = await db.insert(backups)
        .values({
          name,
          data,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          deviceInfo: deviceInfo || null,
          isAutoBackup: name.includes('auto'),
          size: JSON.stringify(data).length
        })
        .returning();
      
      console.log(`Neues Backup '${name}' wurde erstellt`);
      
      // Entferne alte Backups, wenn wir mehr als 5 haben
      const allBackups = await db.select().from(backups).orderBy(desc(backups.timestamp));
      if (allBackups.length > 5) {
        const oldBackups = allBackups.slice(5);
        for (const oldBackup of oldBackups) {
          await db.delete(backups).where(eq(backups.id, oldBackup.id));
          console.log(`Altes Backup '${oldBackup.name}' wurde automatisch gelöscht`);
        }
      }
      
      res.status(201).json({
        name,
        timestamp: newBackup[0].timestamp.toISOString(),
        stored: true
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  app.get('/api/backups/:name', async (req, res) => {
    try {
      const { name } = req.params;
      
      const backup = await db.select().from(backups).where(eq(backups.name, name)).limit(1);
      
      if (backup.length === 0) {
        return res.status(404).json({ error: 'Backup not found' });
      }
      
      console.log(`Backup '${name}' wurde abgerufen`);
      res.json({
        name: backup[0].name,
        data: backup[0].data,
        timestamp: backup[0].timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error fetching backup:', error);
      res.status(500).json({ error: 'Failed to fetch backup' });
    }
  });

  app.delete('/api/backups/:name', async (req, res) => {
    try {
      const { name } = req.params;
      
      const deletedBackup = await db.delete(backups)
        .where(eq(backups.name, name))
        .returning();
      
      if (deletedBackup.length === 0) {
        return res.status(404).json({ error: 'Backup not found' });
      }
      
      console.log(`Backup '${name}' wurde gelöscht`);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ error: 'Failed to delete backup' });
    }
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Client-Abonnements für verschiedene Themen speichern
  const subscriptions: Record<string, Set<any>> = {
    groups: new Set(),
    chat: new Set(),
  };
  
  // Chat-Raum-Abonnements (groupId -> Set<WebSocket>)
  const chatRooms: Record<number, Set<any>> = {};
  
  wss.on('connection', (ws) => {
    console.log('Neue WebSocket-Verbindung');

    // Sende eine Willkommensnachricht
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Verbindung hergestellt'
    }));

    // Behandle eingehende Nachrichten
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket-Nachricht erhalten:', data.type);

        // Subscribe zu einem Thema
        if (data.type === 'subscribe') {
          if (data.topic === 'groups') {
            subscriptions.groups.add(ws);
            console.log('Client hat Gruppen-Updates abonniert');
          } 
          else if (data.topic === 'chat' && data.groupId) {
            // Für Chat-Abonnements brauchen wir die Gruppen-ID
            const groupId = data.groupId;
            if (!chatRooms[groupId]) {
              chatRooms[groupId] = new Set();
            }
            chatRooms[groupId].add(ws);
            console.log(`Client hat Chat-Updates für Gruppe ${groupId} abonniert`);
          }
        }
        
        // Chat-Nachricht über WebSocket empfangen
        else if (data.type === 'chat_message' && data.chatId) {
          console.log('Chat-Nachricht empfangen:', data.message);
          
          // Speichere die Nachricht in unserem persistenten Speicher
          try {
            // Speichere die Nachricht zuerst, dann verteile sie
            await addMessage(data.chatId, data.message);
            console.log('Chat-Nachricht in Datei gespeichert:', data.chatId);
            
            // Extrahiere Gruppen-ID aus dem chat-ID-Format "group-X"
            const chatIdMatch = data.chatId.match(/group-(\d+)/);
            if (chatIdMatch && chatIdMatch[1]) {
              const groupId = parseInt(chatIdMatch[1], 10);
              
              // Sende die Nachricht an alle Clients, die diesen Chat abonniert haben
              if (chatRooms[groupId]) {
                let clientsReached = 0;
                
                chatRooms[groupId].forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'chat_message',
                      chatId: data.chatId,
                      message: data.message
                    }));
                    clientsReached++;
                  }
                });
                
                console.log(`Chat-Nachricht an ${clientsReached} Clients weitergeleitet`);
              } else {
                console.log(`Kein Client hat Chat für Gruppe ${groupId} abonniert`);
              }
            }
          } catch (saveError) {
            console.error('Fehler beim Speichern/Verteilen der Chat-Nachricht:', saveError);
          }
        }
        
        // Beispiel für eine einfache Echo-Antwort
        else if (data.type === 'echo') {
          ws.send(JSON.stringify({
            type: 'echo',
            message: data.message
          }));
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten der WebSocket-Nachricht:', error);
      }
    });

    // Behandle Verbindungsabbrüche
    ws.on('close', () => {
      console.log('WebSocket-Verbindung geschlossen');
      
      // Entferne Client aus allen Abonnements
      subscriptions.groups.delete(ws);
      subscriptions.chat.delete(ws);
      
      // Entferne aus allen Chat-Räumen
      Object.values(chatRooms).forEach(room => {
        room.delete(ws);
      });
    });
  });

  return httpServer;
}