// Chat-Nachrichten Speicher
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';

// Wir müssen __dirname in ES Modules simulieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pfad zur Datei, in der wir die Chat-Nachrichten speichern
const CHATS_FILE = path.join(__dirname, 'chats.json');
// Pfad zur Datei, in der wir die Gruppen-IDs speichern
const GROUP_IDS_FILE = path.join(__dirname, 'group-ids.json');
// Pfad zur Datei, in der wir gelöschte Gruppen-IDs speichern
const DELETED_IDS_FILE = path.join(__dirname, 'deleted-group-ids.json');

// In-Memory-Cache für Chat-Nachrichten
let chatMessages = {};
// In-Memory-Cache für Gruppen-IDs
let groupIds = {};
// In-Memory-Cache für gelöschte Gruppen-IDs
let deletedGroupIds = new Set();

// Hilfsfunktion zum Laden der Nachrichten aus der Datei
async function loadMessages() {
  try {
    const data = await fs.readFile(CHATS_FILE, 'utf-8');
    chatMessages = JSON.parse(data);
    console.debug('Chat-Nachrichten aus Datei geladen');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Datei existiert noch nicht, keine Aktion nötig
      console.debug('Noch keine Chat-Nachrichten-Datei vorhanden, erstelle neue');
      await saveMessages(); // Erstelle leere Datei
    } else {
      console.error('Fehler beim Laden der Chat-Nachrichten:', error);
    }
  }
}

// Hilfsfunktion zum Speichern der Nachrichten in der Datei
async function saveMessages() {
  try {
    await fs.writeFile(CHATS_FILE, JSON.stringify(chatMessages, null, 2), 'utf-8');
    console.debug('Chat-Nachrichten in Datei gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern der Chat-Nachrichten:', error);
  }
}

// Nachrichten für einen Chat hinzufügen
async function addMessage(chatId, message) {
  if (!chatMessages[chatId]) {
    chatMessages[chatId] = [];
  }
  
  chatMessages[chatId].push(message);
  await saveMessages();
  return message;
}

// Alle Nachrichten für einen Chat abrufen
function getMessages(chatId) {
  // Wenn dieser Chat existiert, gib seine Nachrichten zurück
  if (chatMessages[chatId]) {
    return chatMessages[chatId];
  }
  
  // Überprüfe, ob es ein neuer Gruppen-Chat ist (verschiedene mögliche Formate)
  // Unterstütze sowohl das klassische Format "group-X" als auch das neue UUID-Format "group-uuid-XXXXXXXX"
  const isGroupChat = chatId.startsWith('group-');
  
  if (isGroupChat) {
    // Es ist ein neuer Gruppen-Chat, erstelle einen leeren Array für diese Gruppe
    chatMessages[chatId] = [];
    console.debug(`Neuer Chat mit ID ${chatId} initialisiert`);
    // Speichere die Änderung in der Datei
    saveMessages().catch(err => console.error('Fehler beim Initialisieren des neuen Chats:', err));
  }
  
  // Gib leeren Array zurück, wenn noch keine Nachrichten existieren
  return chatMessages[chatId] || [];
}

// Alle Chat-IDs abrufen
function getAllChatIds() {
  return Object.keys(chatMessages);
}

// Hilfsfunktion zum Laden der Gruppen-IDs aus der Datei
async function loadGroupIds() {
  try {
    const data = await fs.readFile(GROUP_IDS_FILE, 'utf-8');
    groupIds = JSON.parse(data);
    console.debug('Gruppen-IDs aus Datei geladen');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Datei existiert noch nicht, keine Aktion nötig
      console.debug('Noch keine Gruppen-IDs-Datei vorhanden, erstelle neue');
      await saveGroupIds(); // Erstelle leere Datei
    } else {
      console.error('Fehler beim Laden der Gruppen-IDs:', error);
    }
  }
}

// Hilfsfunktion zum Speichern der Gruppen-IDs in der Datei
async function saveGroupIds() {
  try {
    await fs.writeFile(GROUP_IDS_FILE, JSON.stringify(groupIds, null, 2), 'utf-8');
    console.debug('Gruppen-IDs in Datei gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen-IDs:', error);
  }
}

// Hilfsfunktion zum Laden der gelöschten Gruppen-IDs aus der Datei
async function loadDeletedGroupIds() {
  try {
    const data = await fs.readFile(DELETED_IDS_FILE, 'utf-8');
    const loadedIds = JSON.parse(data);
    deletedGroupIds = new Set(loadedIds);
    console.debug('Gelöschte Gruppen-IDs aus Datei geladen');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Datei existiert noch nicht, keine Aktion nötig
      console.debug('Noch keine gelöschten Gruppen-IDs-Datei vorhanden, erstelle neue');
      await saveDeletedGroupIds(); // Erstelle leere Datei
    } else {
      console.error('Fehler beim Laden der gelöschten Gruppen-IDs:', error);
    }
  }
}

// Hilfsfunktion zum Speichern der gelöschten Gruppen-IDs in der Datei
async function saveDeletedGroupIds() {
  try {
    await fs.writeFile(DELETED_IDS_FILE, JSON.stringify([...deletedGroupIds]), 'utf-8');
    console.debug('Gelöschte Gruppen-IDs in Datei gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern der gelöschten Gruppen-IDs:', error);
  }
}

// Funktion zur Generierung einzigartiger IDs ohne externe Bibliotheken
function generateUniqueId(prefix = '') {
  // Timestamp als Basis für Einzigartigkeit
  const timestamp = Date.now().toString(36);
  
  // Zufälliger Teil für Kollisionsvermeidung
  const random = Math.random().toString(36).substring(2, 10);
  
  // Hash für zusätzliche Einzigartigkeit
  const hash = crypto.createHash('sha256')
    .update(timestamp + random)
    .digest('hex')
    .substring(0, 8);
  
  return `${prefix}${timestamp}-${random}-${hash}`;
}

// Funktion zum Setzen einer Gruppen-ID mit UUID-Generierung
async function setGroupId(groupId, chatId) {
  // Wenn keine Chat-ID angegeben ist, generiere eine eindeutige ID
  if (!chatId) {
    // Prüfe, ob für diese Gruppe bereits eine ID existiert
    if (groupIds[groupId]) {
      return { groupId, chatId: groupIds[groupId] };
    }
    
    // Generiere neue eindeutige ID mit festem Präfix
    chatId = `group-uuid-${generateUniqueId()}`;
    console.log(`Neue eindeutige ID für Gruppe ${groupId} generiert: ${chatId}`);
  }
  
  // Speichere die ID-Zuordnung
  groupIds[groupId] = chatId;
  await saveGroupIds();
  return { groupId, chatId };
}

// Funktion zum Abrufen aller Gruppen-IDs
function getGroupIds() {
  return { ...groupIds };
}

// Funktion zur Markierung einer Gruppen-ID als gelöscht
async function markGroupIdAsDeleted(groupId) {
  if (groupIds[groupId]) {
    const chatId = groupIds[groupId];
    
    // Füge die ID zur Liste der gelöschten IDs hinzu
    deletedGroupIds.add(chatId);
    await saveDeletedGroupIds();
    
    // Entferne sie aus der aktiven Liste
    delete groupIds[groupId];
    await saveGroupIds();
    
    console.log(`Gruppen-ID ${groupId} (${chatId}) als gelöscht markiert`);
    return true;
  }
  
  return false;
}

// Prüfe, ob eine Chat-ID als gelöscht markiert ist
function isDeletedChatId(chatId) {
  return deletedGroupIds.has(chatId);
}

// Lade die Daten beim Start
loadMessages();
loadGroupIds();
loadDeletedGroupIds();

// Export als ES Module
export {
  addMessage,
  getMessages,
  getAllChatIds,
  setGroupId,
  getGroupIds,
  markGroupIdAsDeleted,
  isDeletedChatId,
  generateUniqueId
};