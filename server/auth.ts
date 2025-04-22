import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { User } from "@shared/schema";

// Helper für kryptografische Funktionen
const scryptAsync = promisify(scrypt);

// Session-Deklaration für TypeScript
declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Passwort-Funktionen
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Email-Verifikation und Passwort-Reset Token Funktionen
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Middleware für Authentifizierungsprüfung
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht authentifiziert" });
  }
  next();
}

// Middleware für Admin-Rechte
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht authentifiziert" });
  }
  
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Keine Administratorrechte" });
  }
  
  next();
}

// Authentifizierungsrouten einrichten
export function setupAuth(app: Express) {
  // Sessionkonfiguration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fitness-app-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 Woche
    }
  };

  app.use(session(sessionSettings));

  // Benutzerregistrierung
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, nickname } = req.body;

      // Prüfen, ob E-Mail bereits existiert
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "E-Mail wird bereits verwendet" });
      }

      // Standardbenutzername aus Vor- und Nachname erstellen
      let username = nickname || (firstName.toLowerCase() + "." + lastName.toLowerCase());
      
      // Überprüfen, ob Benutzername bereits existiert
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        // Zufälligen Suffix hinzufügen, wenn Benutzername bereits existiert
        username = `${username}.${randomBytes(2).toString("hex")}`;
      }
      
      // E-Mail-Verifikationstoken erstellen
      const emailVerificationToken = generateToken();
      const now = new Date();
      const emailVerificationTokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Stunden
      
      // Benutzer erstellen
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationTokenExpiry,
        role: "user",
      });

      // In einer echten Anwendung würde hier eine E-Mail mit dem Verifikationslink gesendet
      console.log(`Verifikationstoken für ${email}: ${emailVerificationToken}`);

      // Login-Session einrichten
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      // Benutzer ohne Passwort zurückgeben
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      res.status(500).json({ error: "Serverfehler bei der Registrierung" });
    }
  });

  // Benutzeranmeldung
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Benutzer per E-Mail finden
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }

      // Passwort überprüfen
      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }

      // Login-Session einrichten
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      // Letzten Login-Zeitpunkt aktualisieren
      await storage.updateUser(user.id, { lastActive: new Date() });
      
      // Benutzer ohne Passwort zurückgeben
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Fehler bei der Anmeldung:", error);
      res.status(500).json({ error: "Serverfehler bei der Anmeldung" });
    }
  });
  
  // Aktuelle angemeldete Benutzerinformationen
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Nicht angemeldet" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Session löschen, wenn Benutzer nicht gefunden
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Benutzer nicht gefunden" });
      }
      
      // Benutzer ohne Passwort zurückgeben
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Fehler beim Abrufen des Benutzers:", error);
      res.status(500).json({ error: "Serverfehler" });
    }
  });

  // Abmelden
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Fehler beim Abmelden:", err);
        return res.status(500).json({ error: "Fehler beim Abmelden" });
      }
      res.status(200).json({ message: "Erfolgreich abgemeldet" });
    });
  });

  // E-Mail-Verifikation
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Benutzer mit diesem Token finden
      const user = await storage.getUserByEmailVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: "Ungültiger oder abgelaufener Token" });
      }
      
      // Prüfen, ob Token abgelaufen ist
      const now = new Date();
      if (user.emailVerificationTokenExpiry && new Date(user.emailVerificationTokenExpiry) < now) {
        return res.status(400).json({ error: "Token ist abgelaufen" });
      }
      
      // Benutzer aktualisieren
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      });
      
      res.json({ message: "E-Mail erfolgreich verifiziert" });
    } catch (error) {
      console.error("Fehler bei der E-Mail-Verifikation:", error);
      res.status(500).json({ error: "Serverfehler bei der E-Mail-Verifikation" });
    }
  });

  // Passwort-Reset anfordern
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Benutzer per E-Mail finden
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Aus Sicherheitsgründen trotzdem erfolgreiche Antwort senden
        return res.json({ message: "Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet" });
      }
      
      // Token erstellen
      const passwordResetToken = generateToken();
      const now = new Date();
      const passwordResetTokenExpiry = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 Stunde
      
      // Benutzer aktualisieren
      await storage.updateUser(user.id, {
        passwordResetToken,
        passwordResetTokenExpiry,
      });
      
      // In einer echten Anwendung würde hier eine E-Mail mit dem Reset-Link gesendet
      console.log(`Passwort-Reset-Token für ${email}: ${passwordResetToken}`);
      
      res.json({ message: "Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet" });
    } catch (error) {
      console.error("Fehler beim Passwort-Reset:", error);
      res.status(500).json({ error: "Serverfehler beim Passwort-Reset" });
    }
  });

  // Passwort zurücksetzen
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Benutzer mit diesem Token finden
      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Ungültiger oder abgelaufener Token" });
      }
      
      // Prüfen, ob Token abgelaufen ist
      const now = new Date();
      if (user.passwordResetTokenExpiry && new Date(user.passwordResetTokenExpiry) < now) {
        return res.status(400).json({ error: "Token ist abgelaufen" });
      }
      
      // Passwort ändern
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      });
      
      res.json({ message: "Passwort erfolgreich zurückgesetzt" });
    } catch (error) {
      console.error("Fehler beim Zurücksetzen des Passworts:", error);
      res.status(500).json({ error: "Serverfehler beim Zurücksetzen des Passworts" });
    }
  });
}