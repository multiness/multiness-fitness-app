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

import { 
  addMessage, 
  getMessages, 
  getAllChatIds,
  setGroupId,
  getGroupIds,
  markGroupIdAsDeleted,
  isDeletedChatId,
  generateUniqueId,
  resetAllGroupIds
} from "./data/chats.js";

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
  
  // Alle Gruppen-IDs abrufen (für die Gruppen-Chat-Synchronisierung)
  app.get("/api/group-ids", (req, res) => {
    try {
      const allGroupIds = getGroupIds();
      const filteredGroupIds: Record<string, string> = {};
      
      // Manuell gelöschte Gruppen-IDs definieren
      const manuallyDeletedIds = [1744717732655, 1744717733777, 1744717733958, 1744717734117, 1744717734282, 1744717738776, 1744718751615];
      const manuallyDeletedIdSet = new Set(manuallyDeletedIds);
      
      // Filtere gelöschte Chat-IDs aus den Gruppen-IDs heraus
      for (const [groupId, chatId] of Object.entries(allGroupIds)) {
        const numGroupId = Number(groupId);
        
        // Prüfe auf sowohl manuell gelöschte IDs als auch gelöschte Chat-IDs
        if (!isDeletedChatId(chatId) && !manuallyDeletedIdSet.has(numGroupId)) {
          filteredGroupIds[groupId] = chatId;
        } else {
          if (isDeletedChatId(chatId)) {
            console.log(`Gruppe ${groupId} mit Chat-ID ${chatId} wurde bei der ID-Abfrage herausgefiltert (als gelöscht markiert)`);
          } else if (manuallyDeletedIdSet.has(numGroupId)) {
            console.log(`Gruppe ${groupId} wurde bei der ID-Abfrage herausgefiltert (manueller Filter)`);
          }
        }
      }
      
      console.log("Gruppen-IDs abgerufen:", filteredGroupIds);
      res.json(filteredGroupIds);
    } catch (error) {
      console.error("Fehler beim Abrufen der Gruppen-IDs:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
  
  // Alle Gruppen-IDs zurücksetzen (für komplette Neusynchronisierung)
  app.post("/api/group-ids/reset", async (req, res) => {
    try {
      console.log("ACHTUNG: Gruppen-IDs-Reset wurde angefordert");
      
      // Führe den Reset durch
      const { oldGroupIds, newGroupIds } = await resetAllGroupIds();
      
      // Informiere alle verbundenen WebSocket-Clients über den Reset
      if (subscriptions.groupIds.size > 0) {
        let notifiedClients = 0;
        subscriptions.groupIds.forEach(client => {
          if (safeMessageSend(client, {
            type: 'groupIdsReset',
            oldGroupIds,
            newGroupIds
          })) {
            notifiedClients++;
          }
        });
        console.log(`Gruppen-IDs-Reset an ${notifiedClients} Clients gesendet`);
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Alle Gruppen-IDs wurden zurückgesetzt",
        oldGroupIds,
        newGroupIds
      });
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der Gruppen-IDs:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
  
  // Gruppen-ID speichern (für die Gruppen-Chat-Synchronisierung)
  app.post("/api/group-ids", async (req, res) => {
    try {
      const { groupId, chatId } = req.body;
      
      if (!groupId || !chatId) {
        return res.status(400).json({ error: "groupId und chatId werden benötigt" });
      }
      
      const result = await setGroupId(Number(groupId), chatId);
      console.log(`Gruppen-ID gespeichert: Gruppe ${groupId} -> Chat ${chatId}`);
      
      // Informiere alle Clients, die Gruppen-IDs abonniert haben, über die Änderung
      const updatedGroupIds = getGroupIds();
      if (subscriptions.groupIds.size > 0) {
        let notifiedClients = 0;
        // Filtere gelöschte Gruppen vor dem Senden
        const filteredGroupIds: Record<string, string> = {};
        for (const [id, chatId] of Object.entries(updatedGroupIds)) {
          if (!isDeletedChatId(chatId)) {
            filteredGroupIds[id] = chatId;
          }
        }
        
        subscriptions.groupIds.forEach(client => {
          if (safeMessageSend(client, {
            type: 'groupIds',
            groupIds: filteredGroupIds,
            updatedGroupId: groupId
          })) {
            notifiedClients++;
          }
        });
        console.log(`Gruppen-ID-Update an ${notifiedClients} Clients gesendet`);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Fehler beim Speichern der Gruppen-ID:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
  
  // Endpoint zur Generierung einer neuen UUID für eine Gruppe
  app.post("/api/group-ids/generate", async (req, res) => {
    try {
      const { groupId } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ error: "groupId wird benötigt" });
      }
      
      // Generiere eine neue eindeutige ID für diese Gruppe
      const uniqueId = `group-uuid-${generateUniqueId()}`;
      console.log(`Neue UUID für Gruppe ${groupId} generiert: ${uniqueId}`);
      
      // Speichere die Zuordnung
      const result = await setGroupId(Number(groupId), uniqueId);
      
      // Informiere alle Clients über die neue ID
      const updatedGroupIds = getGroupIds();
      if (subscriptions.groupIds.size > 0) {
        let notifiedClients = 0;
        // Filtere gelöschte Gruppen vor dem Senden
        const filteredGroupIds: Record<string, string> = {};
        for (const [id, chatId] of Object.entries(updatedGroupIds)) {
          if (!isDeletedChatId(chatId)) {
            filteredGroupIds[id] = chatId;
          }
        }
        
        subscriptions.groupIds.forEach(client => {
          if (safeMessageSend(client, {
            type: 'groupIds',
            groupIds: filteredGroupIds,
            updatedGroupId: groupId,
            generated: true
          })) {
            notifiedClients++;
          }
        });
        console.log(`Neue Gruppen-UUID an ${notifiedClients} Clients gesendet`);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Fehler bei der Generierung einer Gruppen-UUID:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
  
  // Endpoint zum Markieren einer gelöschten Gruppe
  app.delete("/api/group-ids/:groupId", async (req, res) => {
    try {
      const groupId = Number(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "Ungültige Gruppen-ID" });
      }
      
      const result = await markGroupIdAsDeleted(groupId);
      
      if (result) {
        console.log(`Gruppen-ID ${groupId} als gelöscht markiert`);
        
        // Informiere alle Clients über die Löschung
        const updatedGroupIds = getGroupIds();
        if (subscriptions.groupIds.size > 0) {
          let notifiedClients = 0;
          
          // Filtere gelöschte Gruppen vor dem Senden
          const filteredGroupIds: Record<string, string> = {};
          for (const [id, chatId] of Object.entries(updatedGroupIds)) {
            if (!isDeletedChatId(chatId)) {
              filteredGroupIds[id] = chatId;
            }
          }
          
          subscriptions.groupIds.forEach(client => {
            if (safeMessageSend(client, {
              type: 'groupIds',
              groupIds: filteredGroupIds,
              deletedGroupId: groupId
            })) {
              notifiedClients++;
            }
          });
          console.log(`Gruppen-ID-Löschung an ${notifiedClients} Clients gesendet`);
        }
        
        res.status(200).json({ success: true, message: "Gruppen-ID als gelöscht markiert" });
      } else {
        res.status(404).json({ error: "Gruppen-ID nicht gefunden" });
      }
    } catch (error) {
      console.error("Fehler beim Markieren der gelöschten Gruppen-ID:", error);
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

  // Post einzeln abrufen
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post nicht gefunden" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post aktualisieren (bearbeiten)
  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content ist erforderlich" });
      }
      
      // Zuerst prüfen, ob der Post existiert
      const existingPost = await storage.getPost(postId);
      if (!existingPost) {
        return res.status(404).json({ error: "Post nicht gefunden" });
      }
      
      // Post mit neuem Inhalt aktualisieren
      const updatedPost = await storage.updatePost(postId, { 
        content, 
        updatedAt: new Date() 
      });
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post löschen
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      
      // Zuerst prüfen, ob der Post existiert
      const existingPost = await storage.getPost(postId);
      if (!existingPost) {
        return res.status(404).json({ error: "Post nicht gefunden" });
      }
      
      // Post löschen
      await storage.deletePost(postId);
      
      res.json({ success: true, message: "Post erfolgreich gelöscht" });
    } catch (error) {
      console.error("Error deleting post:", error);
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
          offset: req.query.offset ? Number(req.query.offset) : undefined
        };
        
        // Einfacherer Ansatz, um sowohl Standard- als auch UUID-Gruppen zu bekommen
        const groups = await storage.getGroups(options);
        console.log(`${groups.length} Gruppen aus der Datenbank geladen`);
        
        // Zusätzlich manuell Gruppen mit höherer ID laden
        const allGroupIds = getGroupIds();
        const deletedGroupIds = new Set(); // Set für gelöschte Gruppen-IDs
        const deletedChatIds = new Set();  // Set für gelöschte Chat-IDs
        
        // Überprüfen, welche Chat-IDs als gelöscht markiert sind
        for (const [id, chatId] of Object.entries(allGroupIds)) {
          if (isDeletedChatId(chatId)) {
            deletedGroupIds.add(Number(id));
            deletedChatIds.add(chatId);
            console.log(`Gruppe ${id} mit Chat-ID ${chatId} ist als gelöscht markiert`);
          }
        }
        
        // Manuell die zusätzlichen Gruppen-IDs entfernen (die spezifisch im Problem aufgeführt wurden)
        const manuallyDeletedIds = [1744717732655, 1744717733777, 1744717733958, 1744717734117, 1744717734282, 1744717738776, 1744718751615];
        manuallyDeletedIds.forEach(id => {
          deletedGroupIds.add(id);
          console.log(`Gruppe ${id} wurde manuell als gelöscht markiert`);
        });
        
        // Filtere gelöschte Gruppen aus den Datenbankgruppen
        const filteredGroups = groups.filter(group => !deletedGroupIds.has(group.id));
        
        // Die verfügbaren Gruppen-IDs, die nicht gelöscht wurden
        const availableGroupIds = Object.keys(allGroupIds)
            .filter(id => {
              const numId = Number(id);
              return !isNaN(numId) && !deletedGroupIds.has(numId) && !manuallyDeletedIds.includes(numId);
            });
        
        console.log("Verfügbare Gruppen-IDs nach Filterung:", availableGroupIds);
        
        const additionalGroups = [];
        
        for (const id of availableGroupIds) {
          // Prüfe alle numerischen IDs, die noch nicht geladen wurden
          if (!filteredGroups.some(g => g.id === Number(id))) {
            try {
              console.log(`Lade zusätzliche Gruppe mit ID ${id}...`);
              const group = await storage.getGroup(Number(id));
              if (group) {
                console.log(`Gruppe ${id} gefunden und wird zur Ergebnisliste hinzugefügt, Details:`, group);
                additionalGroups.push(group);
              }
            } catch (err) {
              // Fehler beim Laden einzelner Gruppen ignorieren
            }
          }
        }
        
        // Erneut überprüfen, dass die manuell gelöschten IDs nicht in den virtuellen Gruppen erscheinen
        const manuallyDeletedIdSet = new Set(manuallyDeletedIds);
        
        // Für alle Gruppen-IDs, die nicht in der Datenbank gefunden wurden, virtuelle Gruppen erstellen
        const virtualGroups = [];
        for (const id of availableGroupIds) {
          const numId = Number(id);
          
          // Überspringe manuell gelöschte Gruppen
          if (manuallyDeletedIdSet.has(numId)) {
            continue;
          }
          
          if (!filteredGroups.some(g => g.id === numId) && 
              !additionalGroups.some(g => g.id === numId)) {
            // Erstelle eine virtuelle Gruppe basierend auf der ID und dem Chat-Tag
            const chatId = allGroupIds[id];
            
            // Überprüfe, ob diese Chat-ID als gelöscht markiert ist
            if (isDeletedChatId(chatId)) {
              console.log(`Überspringe gelöschte Gruppe ${id} mit Chat-Tag ${chatId}`);
              continue;
            }
            
            console.log(`Erstelle virtuelle Gruppe für ID ${id} mit Chat-Tag ${chatId}`);
            virtualGroups.push({
              id: numId,
              name: `Gruppe ${id.slice(-4)}`,
              description: "Diese Gruppe wurde automatisch wiederhergestellt.",
              creatorId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              isPrivate: false,
              memberCount: 1,
              participantIds: [1]
            });
          }
        }
        
        // Alle Gruppen kombinieren (filteredGroups statt groups, da diese bereits die gelöschten Gruppen ausschließt)
        const allGroups = [...filteredGroups, ...additionalGroups, ...virtualGroups];
        console.log(`Insgesamt ${allGroups.length} Gruppen zurückgegeben (${filteredGroups.length} Basis + ${additionalGroups.length} zusätzliche + ${virtualGroups.length} virtuelle)`);
        
        // Wenn keine Gruppen gefunden wurden, Demo-Gruppen zurückgeben
        if (allGroups.length === 0) {
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
          res.json(allGroups);
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
      const groupId = Number(req.params.id);
      
      // Manuell gelöschte Gruppen-IDs überprüfen
      const manuallyDeletedIds = [1744717732655, 1744717733777, 1744717733958, 1744717734117, 1744717734282, 1744717738776, 1744718751615];
      if (manuallyDeletedIds.includes(groupId)) {
        console.log(`Gruppe ${groupId} ist in der manuellen Löschliste`);
        return res.status(404).json({ error: "Gruppe wurde gelöscht" });
      }
      
      // Überprüfen, ob die Gruppe existiert, ohne potenziell zu große Zahlen an die Datenbank zu senden
      let group = null;
      
      // Hole alle Gruppen-IDs und prüfe, ob die Gruppe eine gelöschte ID hat
      const allGroupIds = getGroupIds();
      const chatId = allGroupIds[groupId];
      
      // Wenn die Chat-ID existiert, prüfe, ob sie als gelöscht markiert ist
      if (chatId && isDeletedChatId(chatId)) {
        console.log(`Gruppe ${groupId} mit Chat-ID ${chatId} wurde als gelöscht markiert`);
        return res.status(404).json({ error: "Gruppe wurde gelöscht" });
      }
      
      // Versuche nur Datenbankabfrage für kleine IDs, die in den INTEGER-Bereich passen
      if (groupId < 2147483647) { // Maximaler PostgreSQL INTEGER-Wert
        try {
          group = await storage.getGroup(groupId);
        } catch (dbError) {
          console.warn(`Datenbank-Fehler bei Gruppe ${groupId}, erstelle virtuelles Objekt:`, 
            dbError instanceof Error ? dbError.message : 'Unknown error');
          // Wir fangen den Fehler ab und behandeln es als nicht existierende Gruppe
        }
      }
      
      if (group) {
        return res.json(group);
      }
      
      // Wenn die Gruppe nicht in der Datenbank existiert, aber eine zugeordnete UUID hat
      // und nicht in der manuellen Löschliste ist
      if (chatId && !manuallyDeletedIds.includes(groupId)) {
        // Erstelle eine virtuelle Gruppe
        console.log(`Erstelle virtuelle Gruppe für Einzelabfrage mit ID ${groupId} und Chat-Tag ${chatId}`);
        
        const virtualGroup = {
          id: groupId,
          name: `Gruppe ${groupId.toString().slice(-4)}`,
          description: "Diese Gruppe wurde automatisch wiederhergestellt.",
          creatorId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPrivate: false,
          memberCount: 1,
          participantIds: [1]
        };
        
        return res.json(virtualGroup);
      }
      
      return res.status(404).json({ error: "Gruppe nicht gefunden" });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const groupRequest = req.body;
      let uuidTag = null;
      
      // Prüfen, ob eine UUID mitgesendet wurde (von der Client-App)
      if (groupRequest.uuidTag && typeof groupRequest.uuidTag === 'string' && groupRequest.uuidTag.startsWith('group-uuid-')) {
        uuidTag = groupRequest.uuidTag;
        console.log(`Gruppe wird mit eigener UUID erstellt: ${uuidTag}`);
        
        // Entferne das UUID-Tag aus den eigentlichen Gruppendaten
        delete groupRequest.uuidTag;
      }
      
      // Validiere und erstelle die Gruppe
      const groupData = insertGroupSchema.parse(groupRequest);
      const group = await storage.createGroup(groupData);
      
      // Wenn eine UUID vorhanden war, speichere die Zuordnung
      if (uuidTag) {
        await setGroupId(group.id, uuidTag);
        console.log(`Gruppe ${group.id} mit UUID ${uuidTag} zugeordnet`);
        
        // Informiere Clients über die neue UUID-Zuordnung
        const updatedGroupIds = getGroupIds();
        subscriptions.groupIds.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify({
                type: 'groupIds',
                groupIds: updatedGroupIds,
                updatedGroupId: group.id
              }));
            } catch (err) {
              console.error("Fehler beim Versenden der UUID-Update-Nachricht:", err);
            }
          }
        });
      }
      
      // Benachrichtige alle Clients über die neue Gruppe via WebSocket
      const wsMessage = JSON.stringify({
        type: 'group_update',
        action: 'create',
        data: group
      });
      
      // Anzahl der erfolgreich benachrichtigten Clients zählen
      let notifiedClients = 0;
      
      // An alle WebSocket-Clients senden, die Gruppen-Updates abonniert haben
      subscriptions.groups.forEach(client => {
        if (client.readyState === WebSocket.OPEN) { // Nutze WebSocket.OPEN Konstante
          try {
            client.send(wsMessage);
            notifiedClients++;
          } catch (err) {
            console.error("Fehler beim Senden der Gruppen-Update-Nachricht:", err);
          }
        }
      });
      
      console.log(`Neue Gruppe ${group.id} "${group.name}" erstellt und an ${notifiedClients} Clients verteilt`);
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
  
  // DELETE-Endpunkt für das Löschen einer kompletten Gruppe
  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Gruppe nicht gefunden" });
      }
      
      // Hinweis: In einer vollständigen Implementierung würde hier 
      // eine Berechtigungsprüfung stattfinden, um sicherzustellen,
      // dass nur Admins oder der Ersteller der Gruppe diese löschen können
      
      // Gruppe aus der Datenbank löschen
      await storage.deleteGroup(groupId);
      
      // Falls ein WebSocket-Server verwendet wird, könnten hier Benachrichtigungen gesendet werden
      // Dies ist aber optional und hängt von der spezifischen Anwendungsarchitektur ab
      if (wss) {
        const message = JSON.stringify({
          type: 'group_deleted',
          groupId: groupId
        });
        
        // An alle verbundenen Clients senden
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Gruppe ${groupId} wurde erfolgreich gelöscht` 
      });
    } catch (error) {
      console.error("Fehler beim Löschen der Gruppe:", error);
      res.status(500).json({ error: "Gruppe konnte nicht gelöscht werden" });
    }
  });

  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      
      // Manuell gelöschte Gruppen-IDs überprüfen
      const manuallyDeletedIds = [1744717732655, 1744717733777, 1744717733958, 1744717734117, 1744717734282, 1744717738776, 1744718751615];
      if (manuallyDeletedIds.includes(groupId)) {
        console.log(`Gruppe ${groupId} ist in der manuellen Löschliste, leere Mitgliederliste zurückgegeben`);
        return res.json([]); // Leere Mitgliederliste für manuell gelöschte Gruppen zurückgeben
      }
      
      try {
        // Überprüfen, ob die Gruppe existiert, ohne potenziell zu große Zahlen an die Datenbank zu senden
        let group = null;
        const allGroupIds = getGroupIds();
        const chatId = allGroupIds[groupId];
        
        // Wenn die Chat-ID existiert, prüfe, ob sie als gelöscht markiert ist
        if (chatId && isDeletedChatId(chatId)) {
          console.log(`Gruppe ${groupId} mit Chat-ID ${chatId} wurde als gelöscht markiert, leere Mitgliederliste zurückgegeben`);
          return res.json([]); // Leere Mitgliederliste für gelöschte Gruppen zurückgeben
        }
        
        // Überprüfe, ob die ID in unserem Gruppen-ID-Verzeichnis existiert
        if (chatId) {
          // Dies ist eine gültige Gruppen-ID mit einer UUID-Zuordnung
          
          // Versuche nur Datenbankabfrage für kleine IDs, die in den INTEGER-Bereich passen
          if (groupId < 2147483647) { // Maximaler PostgreSQL INTEGER-Wert
            try {
              group = await storage.getGroup(groupId);
            } catch (dbError) {
              console.warn(`Datenbank-Fehler bei Gruppe ${groupId}, erstelle virtuelles Objekt:`, 
                dbError instanceof Error ? dbError.message : 'Unknown error');
              // Wir fangen den Fehler ab und behandeln es als nicht existierende Gruppe
            }
          }
          
          if (group) {
            // Gruppendaten existieren in der Datenbank
            try {
              // Hole alle Mitglieder dieser Gruppe
              const members = await storage.getGroupMembers(groupId);
              console.log(`Gruppenmitglieder für Gruppe ${groupId} abgefragt, Ergebnis:`, members.length);
              return res.json(members);
            } catch (membersError) {
              console.warn(`Fehler beim Abrufen der Mitglieder für Gruppe ${groupId}:`, 
                membersError instanceof Error ? membersError.message : 'Unknown error');
              // Bei Fehler leere Mitgliederliste zurückgeben
              return res.json([]);
            }
          } else {
            // Virtuelle Gruppenmitglieder für wiederhergestellte Gruppen
            console.log(`Virtuelle Mitgliederliste für Gruppe ${groupId} erstellt`);
            // Erstelle eine virtuelle Mitgliederliste mit einem Administrator-Benutzer
            const virtualMember = {
              id: groupId,
              groupId: groupId,
              userId: 1,
              role: 'admin',
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            return res.json([virtualMember]);
          }
        } else {
          console.log(`Gruppe ${groupId} existiert nicht in der ID-Zuordnung, leere Mitgliederliste zurückgegeben`);
          return res.json([]); // Leere Mitgliederliste zurückgeben
        }
      } catch (groupError) {
        console.warn(`Allgemeiner Fehler beim Abrufen der Gruppe ${groupId}:`, 
          groupError instanceof Error ? groupError.message : 'Unknown error');
        res.json([]); // Leere Mitgliederliste zurückgeben im Fehlerfall
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Gruppenmitglieder:", 
        error instanceof Error ? error.message : 'Unknown error');
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
    groupIds: new Set(), // Neues Thema für Gruppen-ID-Synchronisierung
  };
  
  // Chat-Raum-Abonnements (groupId -> Set<WebSocket>)
  const chatRooms: Record<number, Set<any>> = {};
  
  // Funktion zum Senden von Nachrichten mit Fehlerbehandlung
  const safeMessageSend = (client: any, data: any) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
        return true;
      }
    } catch (error) {
      console.error('Fehler beim Senden einer WebSocket-Nachricht:', error);
    }
    return false;
  };
  
  wss.on('connection', (ws) => {
    console.log('Neue WebSocket-Verbindung');

    // Sende eine Willkommensnachricht
    safeMessageSend(ws, {
      type: 'connection',
      message: 'Verbindung hergestellt'
    });

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
          else if (data.topic === 'groupIds') {
            subscriptions.groupIds.add(ws);
            console.log('Client hat Gruppen-IDs-Updates abonniert');
            
            // Sende alle aktuellen Gruppen-IDs an den Client
            const groupIds = getGroupIds();
            safeMessageSend(ws, {
              type: 'groupIds',
              groupIds
            });
          }
        }
        
        // Chat-Nachricht über WebSocket empfangen
        else if (data.type === 'chat_message' && data.chatId) {
          console.log('Chat-Nachricht empfangen:', data.message?.content || 'Keine Content-Info');
          
          // Speichere die Nachricht in unserem persistenten Speicher
          try {
            // Stelle sicher, dass die Nachricht alle erforderlichen Felder hat
            if (!data.message.id) {
              data.message.id = Date.now(); // Generiere Nachrichtenkennung wenn nicht vorhanden
            }
            if (!data.message.timestamp) {
              data.message.timestamp = new Date().toISOString(); // Füge Zeitstempel hinzu
            }
            
            // Speichere die Nachricht zuerst, dann verteile sie
            await addMessage(data.chatId, data.message);
            console.log('Chat-Nachricht in Datei gespeichert:', data.chatId);
            
            // Extrahiere Gruppen-ID aus verschiedenen chat-ID-Formaten
            // Format 1: Traditionelles Format "group-123"
            // Format 2: UUID-Format "group-uuid-xyz"
            const traditionalMatch = data.chatId.match(/group-(\d+)/);
            
            // Prüfen, ob es sich um eine UUID-basierte Chat-ID handelt
            let isUuid = false;
            let extractedGroupId = null;
            
            if (traditionalMatch) {
              // Standardformat - direkt extrahieren
              extractedGroupId = parseInt(traditionalMatch[1], 10);
            } else {
              // Prüfen, ob es eine UUID-basierte ID im Format "group-uuid-xyz" ist
              isUuid = data.chatId.startsWith('group-uuid-');
              
              // Bei UUID-Format: Wir müssen die Gruppen-ID aus der Zuordnungstabelle abrufen
              if (isUuid) {
                console.log('UUID-basierte Chat-ID erkannt:', data.chatId);
                
                // Durchsuche die interne Zuordnung von Gruppen-IDs zu Chat-IDs
                const groupIds = await getGroupIds();
                for (const [groupId, chatId] of Object.entries(groupIds)) {
                  if (chatId === data.chatId) {
                    extractedGroupId = parseInt(groupId, 10);
                    console.log('Zugehörige Gruppen-ID gefunden:', extractedGroupId);
                    break;
                  }
                }
              }
            }
            if (extractedGroupId !== null) {
              const groupId = extractedGroupId;
              
              // NEUE STRATEGIE: Erstelle eine Liste aller eindeutigen Clients, die die Nachricht erhalten sollen
              const targetClients = new Set<WebSocket>();
              
              // 1. Füge spezifische Gruppen-Chat-Abonnenten hinzu
              if (chatRooms[groupId]) {
                chatRooms[groupId].forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    targetClients.add(client as WebSocket);
                  }
                });
              }
              
              // 2. Füge allgemeine Gruppen-Abonnenten hinzu
              subscriptions.groups.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  targetClients.add(client as WebSocket);
                }
              });
              
              // 3. Füge alle Gruppen-IDs-Abonnenten hinzu (für maximale Verteilung)
              subscriptions.groupIds.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  targetClients.add(client as WebSocket);
                }
              });
              
              // 4. Füge alle Chat-Abonnenten hinzu (allgemeine Chat-Themen-Abonnenten)
              subscriptions.chat.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  targetClients.add(client as WebSocket);
                }
              });
              
              // Breite Broadcast-Strategie: Sende an alle offenen Verbindungen für maximale Zuverlässigkeit
              console.log(`Sende Chat-Nachricht an ${targetClients.size} eindeutige Clients für Gruppe ${groupId} (chatId: ${data.chatId})`);
              
              let successCount = 0;
              targetClients.forEach(client => {
                try {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'chat_message',
                      chatId: data.chatId,
                      message: data.message
                    }));
                    successCount++;
                  }
                } catch (err) {
                  console.error('Fehler beim Senden an einen Client:', err);
                }
              });
              
              console.log(`Chat-Nachricht erfolgreich an ${successCount} von ${targetClients.size} Clients gesendet`);
              
              // Falls keine Clients gefunden wurden
              if (targetClients.size === 0) {
                console.log(`Kein aktiver Client für Chat ${data.chatId} (Gruppe ${groupId}) gefunden`);
              }
            } else {
              console.log('Kein Gruppenchat oder ungültiges Format:', data.chatId);
            }
          } catch (saveError) {
            console.error('Fehler beim Speichern/Verteilen der Chat-Nachricht:', saveError);
          }
        }
        
        // Beispiel für eine einfache Echo-Antwort
        else if (data.type === 'echo') {
          safeMessageSend(ws, {
            type: 'echo',
            message: data.message
          });
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
      subscriptions.groupIds.delete(ws);
      
      // Entferne aus allen Chat-Räumen
      Object.values(chatRooms).forEach(room => {
        room.delete(ws);
      });
    });
  });

  return httpServer;
}