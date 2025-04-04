import { db } from './server/db.js';
import {
  users,
  groups,
  challenges,
  workoutTemplates,
  bannerPositions,
  products,
  events
} from '@shared/schema';
import { DEFAULT_BANNER_POSITIONS } from '@shared/schema';

// Initialisiere die Datenbank mit Grunddaten
async function main() {
  console.log('Datenbank-Initialisierung wird gestartet...');

  // Standard-Admin-Benutzer erstellen (falls keiner existiert)
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    console.log('Erstelle Admin-Benutzer...');
    await db.insert(users).values({
      username: 'admin',
      name: 'Administrator',
      bio: 'System-Administrator',
      isAdmin: true,
      isVerified: true
    });
    console.log('Admin-Benutzer erstellt!');
  } else {
    console.log(`${existingUsers.length} Benutzer bereits in der Datenbank.`);
  }

  // Standard-Banner-Positionen erstellen
  const existingPositions = await db.select().from(bannerPositions);
  if (existingPositions.length === 0) {
    console.log('Erstelle Standard-Banner-Positionen...');
    await db.insert(bannerPositions).values(
      DEFAULT_BANNER_POSITIONS.map(pos => ({
        name: pos.name,
        shortcode: pos.shortcode,
        description: pos.description,
        appDimensions: pos.appDimensions,
        webDimensions: pos.webDimensions
      }))
    );
    console.log('Banner-Positionen erstellt!');
  }

  console.log('Datenbank-Initialisierung abgeschlossen!');
}

// Funktion ausführen und bei Fehler abbrechen
main().catch(e => {
  console.error('Fehler bei der Datenbank-Initialisierung:', e);
  process.exit(1);
});