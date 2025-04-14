// Chat-Nachrichten Speicher
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Wir müssen __dirname in ES Modules simulieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pfad zur Datei, in der wir die Chat-Nachrichten speichern
const CHATS_FILE = path.join(__dirname, 'chats.json');

// In-Memory-Cache für Chat-Nachrichten
let chatMessages = {};

// Hilfsfunktion zum Laden der Nachrichten aus der Datei
async function loadMessages() {
  try {
    const data = await fs.readFile(CHATS_FILE, 'utf-8');
    chatMessages = JSON.parse(data);
    console.log('Chat-Nachrichten aus Datei geladen');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Datei existiert noch nicht, keine Aktion nötig
      console.log('Noch keine Chat-Nachrichten-Datei vorhanden, erstelle neue');
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
    console.log('Chat-Nachrichten in Datei gespeichert');
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
  return chatMessages[chatId] || [];
}

// Alle Chat-IDs abrufen
function getAllChatIds() {
  return Object.keys(chatMessages);
}

// Lade die Nachrichten beim Start
loadMessages();

// Export als ES Module
export {
  addMessage,
  getMessages,
  getAllChatIds
};