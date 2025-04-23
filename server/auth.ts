import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Benutzertyp-Definition (statt aus schema zu importieren)
interface SelectUser {
  id: number;
  username: string;
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  teamRole?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

// Typerweiterung für Express's Session
declare module "express-session" {
  interface Session {
    userId?: number;
    isAdmin?: boolean;
  }
}

// TypeScript-Typerweiterung für Express.User
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Funktion zum Passwort Hashen
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funktion zum Passwortvergleich
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Hilfsfunktion für Tokens
function generateToken(): string {
  return randomUUID();
}

// Middleware zum Prüfen, ob ein Benutzer angemeldet ist
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Nicht autorisiert" });
  }
  
  if (!req.session.userId) {
    return res.status(401).json({ message: "Ungültige Sitzung" });
  }
  
  next();
}

// Middleware zum Prüfen, ob ein Benutzer Admin ist
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Nicht autorisiert" });
  }
  
  if (!req.session.userId) {
    return res.status(401).json({ message: "Ungültige Sitzung" });
  }
  
  if (!req.session.isAdmin) {
    return res.status(403).json({ message: "Keine Administratorrechte" });
  }
  
  next();
}

// Hauptfunktion zum Einrichten der Authentifizierung
export function setupAuth(app: Express) {
  // PostgreSQL-Session-Store einrichten
  const PostgresStore = connectPg(session);
  
  // Session-Einstellungen
  const sessionSettings: session.SessionOptions = {
    store: new PostgresStore({
      pool,
      tableName: 'session', // Name der Session-Tabelle
      createTableIfMissing: true // Tabelle automatisch erstellen, falls nicht vorhanden
    }),
    secret: process.env.SESSION_SECRET || 'fitness-app-secret-key', // In Produktionsumgebung sollte dies aus einer Umgebungsvariable kommen
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 Woche
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Nur in Produktion auf true setzen
      sameSite: 'lax'
    }
  };

  // Express-Einstellungen für Proxies
  app.set("trust proxy", 1);

  // Session-Middleware anwenden
  app.use(session(sessionSettings));

  // Passport initialisieren
  app.use(passport.initialize());
  app.use(passport.session());

  // LocalStrategy für Benutzer/Passwort-Login konfigurieren
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username', // Zurück zu Benutzername für die Anmeldung
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          console.log(`Versuche Login mit Benutzername: ${username}`);
          
          // Benutzer anhand des Benutzernamens suchen
          const user = await storage.getUserByUsername(username);
          
          // Debug-Ausgabe
          console.log(`Benutzer gefunden:`, user ? `ID: ${user.id}, Name: ${user.username}` : 'Nicht gefunden');
          
          // Wenn Benutzer nicht gefunden
          if (!user) {
            console.log('Benutzer nicht gefunden');
            return done(null, false, { message: "Ungültiger Benutzername oder Passwort" });
          }
          
          // Passwort überprüfen
          const isValidPassword = await comparePasswords(password, user.password);
          console.log(`Passwort gültig:`, isValidPassword);
          
          if (!isValidPassword) {
            console.log('Ungültiges Passwort');
            return done(null, false, { message: "Ungültiger Benutzername oder Passwort" });
          }
          
          // Erfolgreich authentifiziert
          console.log('Authentifizierung erfolgreich');
          return done(null, user);
        } catch (error) {
          console.error('Fehler bei der Authentifizierung:', error);
          return done(error);
        }
      }
    )
  );

  // Serialisierung: Speichern nur der Benutzer-ID in der Session
  passport.serializeUser((user, done) => {
    // Typumwandlung, da Express.User und User unterschiedliche Typen sind
    const { id, isAdmin } = user as SelectUser;
    
    // Session-Daten setzen
    if (done.req) {
      done.req.session.userId = id;
      done.req.session.isAdmin = isAdmin;
    }
    
    done(null, id);
  });

  // Deserialisierung: Laden des vollen Benutzerobjekts aus der ID
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Session-Daten aktualisieren
      if (done.req) {
        done.req.session.userId = user.id;
        done.req.session.isAdmin = user.isAdmin;
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registrierungsroute
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, nickname } = req.body;
      
      // Prüfen, ob E-Mail bereits existiert
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).send("E-Mail wird bereits verwendet");
      }
      
      // Prüfen, ob Benutzername bereits existiert
      const existingUsernameUser = await storage.getUserByUsername(username);
      if (existingUsernameUser) {
        return res.status(400).send("Dieser Benutzername ist bereits vergeben");
      }
      
      // Validieren des Benutzernamens (nur alphanumerische Zeichen und Unterstriche)
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).send("Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten");
      }
      
      // Name aus Vor- und Nachname zusammensetzen
      const name = `${firstName} ${lastName}`;
      
      // Passwort hashen
      const hashedPassword = await hashPassword(password);
      
      // E-Mail-Bestätigungstoken generieren
      const emailVerificationToken = generateToken();
      
      // Benutzer erstellen
      const user = await storage.createUser({
        username,
        name,
        email,
        password: hashedPassword,
        avatar: null, // Standardavatar wird später hinzugefügt
        isVerified: false,
        isAdmin: false,
        isTeamMember: false,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 Stunden gültig
        passwordResetToken: null,
        passwordResetExpires: null,
        bio: nickname || null // Nickname als Bio verwenden, wenn angegeben
      });
      
      // Anmelden nach Registrierung
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Session-Daten setzen
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin;
        
        // Erfolgsantwort ohne sensible Daten
        const { password, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveData } = user;
        res.status(201).json(userWithoutSensitiveData);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login-Route
  app.post("/api/login", (req, res, next) => {
    console.log('Login-Anfrage erhalten mit Daten:', {
      username: req.body.username,
      email: req.body.email,
      bodyKeys: Object.keys(req.body)
    });
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Authentifizierungsfehler:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('Authentifizierung fehlgeschlagen:', info?.message);
        return res.status(401).json({ message: info?.message || "Ungültige Anmeldeinformationen" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Login-Fehler:', err);
          return next(err);
        }
        
        console.log('Login erfolgreich für Benutzer:', user.username);
        
        // Session-Daten setzen
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin;
        
        // Erfolgsantwort ohne sensible Daten
        const { password, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveData } = user;
        res.status(200).json(userWithoutSensitiveData);
      });
    })(req, res, next);
  });

  // Logout-Route
  app.post("/api/logout", (req, res, next) => {
    console.log('Logout-Anfrage erhalten für Benutzer:', req.user?.username);
    
    // Benutzer-ID für Protokollierung speichern
    const username = req.user?.username;
    
    req.logout((err) => {
      if (err) {
        console.error('Logout-Fehler:', err);
        return next(err);
      }
      
      // Session zerstören
      req.session.destroy((err) => {
        if (err) {
          console.error('Session-Destroy-Fehler:', err);
          return next(err);
        }
        
        // HTTP-Only Cookie löschen, das für die Session verwendet wird
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          sameSite: 'lax' 
        });
        
        console.log('Logout erfolgreich durchgeführt für Benutzer:', username);
        res.status(200).json({ 
          success: true, 
          message: "Erfolgreich abgemeldet" 
        });
      });
    });
  });

  // Benutzerinfo-Route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht angemeldet" });
    }
    
    // Erfolgsantwort ohne sensible Daten
    const { password, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveData } = req.user as SelectUser;
    res.json(userWithoutSensitiveData);
  });

  // E-Mail-Bestätigungsroute (wird später implementiert)
  app.get("/api/verify-email/:token", async (req, res, next) => {
    try {
      const token = req.params.token;
      const user = await storage.getUserByEmailVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Token" });
      }
      
      if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        return res.status(400).json({ message: "Token abgelaufen" });
      }
      
      // Benutzer als verifiziert markieren
      await storage.updateUser(user.id, {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });
      
      res.json({ message: "E-Mail erfolgreich bestätigt" });
    } catch (error) {
      next(error);
    }
  });

  // Passwort-Reset-Anfrage (wird später implementiert)
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "Kein Konto mit dieser E-Mail gefunden" });
      }
      
      // Token generieren
      const token = generateToken();
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 Stunde gültig
      
      // Token in der DB speichern
      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpires: expires
      });
      
      // TODO: E-Mail mit Reset-Link senden
      
      res.json({ message: "Anweisungen zum Zurücksetzen des Passworts wurden an deine E-Mail-Adresse gesendet" });
    } catch (error) {
      next(error);
    }
  });
  
  // Passwort-Reset für Admins (zeigt das neue Passwort an)
  app.post("/api/users/:id/reset-password", requireAdmin, async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      // Erstelle ein zufälliges temporäres Passwort
      const temporaryPassword = generateRandomPassword(10);
      
      // Passwort hashen und aktualisieren
      const hashedPassword = await hashPassword(temporaryPassword);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });
      
      res.json({ 
        message: "Passwort erfolgreich zurückgesetzt",
        temporaryPassword: temporaryPassword
      });
    } catch (error) {
      next(error);
    }
  });

  // Passwort-Reset-Bestätigung (wird später implementiert)
  app.post("/api/reset-password/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      const user = await storage.getUserByPasswordResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Token" });
      }
      
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Token abgelaufen" });
      }
      
      // Passwort hashen und aktualisieren
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });
      
      res.json({ message: "Passwort erfolgreich zurückgesetzt" });
    } catch (error) {
      next(error);
    }
  });
}