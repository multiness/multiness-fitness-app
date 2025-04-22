/**
 * Synchronisierungsmodul für Gruppendaten zwischen Desktop und Mobilgeräten
 * Sorgt für konsistente Gruppendaten über alle Ansichten hinweg
 */

import { WebSocketManager } from './WebSocketManager';
import { useGroupStore } from './groupStore';

// Globaler Cache für Gruppen-IDs
let globalGroupIds: Record<string, string> = {};

// Flag zum Verfolgen der letzten Aktualisierung
let lastSyncTime = 0;
const THROTTLE_TIME = 2000; // 2 Sekunden Mindestabstand zwischen Synchronisierungen

// Funktion zur Erkennung mobiler Geräte
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Speichern von Gruppen-IDs im localStorage
const saveGroupIdsToLocalStorage = (groupIds: Record<string, string>): void => {
  try {
    // Alle als ein Objekt speichern für bessere Atomarität
    localStorage.setItem('group_chat_ids', JSON.stringify(groupIds));
    
    // Einzelne Keys für Rückwärtskompatibilität
    Object.entries(groupIds).forEach(([key, value]) => {
      localStorage.setItem(`group_chat_id_${key}`, value);
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen-IDs:', error);
  }
};

// Gruppen-IDs aus dem localStorage laden (für schnelleren Start)
const loadGroupIdsFromLocalStorage = (): Record<string, string> => {
  try {
    // Versuche zuerst, alle IDs als ein Objekt zu laden
    const storedIds = localStorage.getItem('group_chat_ids');
    if (storedIds) {
      return JSON.parse(storedIds);
    }
    
    // Fallback: Einzelne Keys laden
    const result: Record<string, string> = {};
    const groupIdPattern = /^group_chat_id_(\d+)$/;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && groupIdPattern.test(key)) {
        const match = key.match(groupIdPattern);
        if (match && match[1]) {
          const id = match[1];
          const value = localStorage.getItem(key);
          if (value) {
            result[id] = value;
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen-IDs aus dem localStorage:', error);
    return {};
  }
};

// Prüfen, ob wir synchronisieren dürfen (Throttling)
const canSyncNow = (): boolean => {
  const now = Date.now();
  if (now - lastSyncTime > THROTTLE_TIME) {
    lastSyncTime = now;
    return true;
  }
  return false;
};

// Stille Aktualisierung der Gruppen (nur wenn nötig)
const silentGroupSync = async (): Promise<void> => {
  const groupStore = useGroupStore.getState();
  if (groupStore && !groupStore.isLoading && Date.now() - (groupStore.lastFetched || 0) > 5000) {
    await groupStore.syncWithServer();
  }
};

// Gruppen-IDs vom Server abrufen
const fetchGroupIdsFromServer = async (): Promise<void> => {
  try {
    // Nur fortfahren, wenn die Drosselung es erlaubt
    if (!canSyncNow()) {
      return;
    }
    
    // Cache-Buster hinzufügen, um sicherzustellen, dass wir aktuelle Daten bekommen
    const cacheBuster = new Date().getTime();
    const response = await fetch(`/api/group-ids?_=${cacheBuster}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        const hasChanges = JSON.stringify(globalGroupIds) !== JSON.stringify(data);
        
        globalGroupIds = data;
        console.log('Gruppen-IDs vom Server synchronisiert:', globalGroupIds);
        
        // Aktualisiere den localStorage
        saveGroupIdsToLocalStorage(globalGroupIds);
        
        // Zustand im Store aktualisieren - aber nur wenn es tatsächlich Änderungen gab
        if (hasChanges) {
          await silentGroupSync();
        }
      }
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Gruppen-IDs vom Server:', error);
  }
};

// Polling-Mechanismus für mobile Geräte
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const startGroupIdsPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Sofort erste Abfrage durchführen
  fetchGroupIdsFromServer();
  
  // Regelmäßig aktualisieren (alle 5 Sekunden) - schneller für bessere Synchronisation
  pollingInterval = setInterval(fetchGroupIdsFromServer, 5000);
};

// WebSocket-Mechanismus für Desktop-Geräte
let wsManager: WebSocketManager | null = null;

const setupWebSocketForGroupIds = (): void => {
  if (wsManager) {
    wsManager.close(); // Verwende die neue close() Methode
  }
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  wsManager = new WebSocketManager(wsUrl);
  
  // Verbinde mit den richtigen Callbacks
  wsManager.connect({
    onOpen: () => {
      console.log('WebSocket verbunden:', wsUrl);
      
      // Abonniere Gruppen-IDs über WebSocket
      if (wsManager && wsManager.isConnected()) {
        wsManager.send(JSON.stringify({
          type: 'subscribe',
          topic: 'groupIds'
        }));
      }
      
      // Initial Gruppen-IDs abrufen
      fetchGroupIdsFromServer();
    },
    onMessage: async (data) => {
      if (data.type === 'groupIds' && data.groupIds) {
        console.log('Gruppen-IDs per WebSocket aktualisiert:', data.groupIds);
        
        const hasChanges = JSON.stringify(globalGroupIds) !== JSON.stringify(data.groupIds);
        
        // Aktualisiere den globalen Cache
        globalGroupIds = data.groupIds;
        
        // Aktualisiere den localStorage
        saveGroupIdsToLocalStorage(globalGroupIds);
        
        // Zustand im Store aktualisieren - aber nur wenn es tatsächlich Änderungen gab
        if (hasChanges) {
          await silentGroupSync();
        }
      }
    },
    onClose: () => {
      console.log('WebSocket-Verbindung geschlossen, bereite Wiederverbindung vor...');
      // Bei WS-Verbindungsabbruch einmalig die Gruppen-IDs per Fetch abrufen
      fetchGroupIdsFromServer();
      
      // Fallback: Starte kurzzeitig Polling, bis WS wiederhergestellt ist
      startTemporaryPolling();
    },
    onError: (error) => {
      console.error('WebSocket-Fehler für Gruppen-IDs-Synchronisierung:', error);
      // Nichts weiter tun, da onClose ohnehin aufgerufen wird
    },
    // Neue Callbacks für verbesserte Fehlerbehandlung
    onReconnect: (attempt) => {
      console.log(`WebSocket-Wiederverbindungsversuch ${attempt}...`);
    },
    onMaxAttemptsExceeded: () => {
      console.warn('Maximale Anzahl der WebSocket-Wiederverbindungsversuche überschritten.');
      // Bei dauerhaftem Fehler auf Polling umschalten
      startGroupIdsPolling();
    }
  });
};

// Temporäres Polling bei WebSocket-Ausfall
let temporaryPollingTimeout: ReturnType<typeof setTimeout> | null = null;

const startTemporaryPolling = (): void => {
  // Beende vorheriges temporäres Polling
  if (temporaryPollingTimeout) {
    clearTimeout(temporaryPollingTimeout);
    temporaryPollingTimeout = null;
  }
  
  // Sofort Daten holen
  fetchGroupIdsFromServer();
  
  // Temporäres Polling für 30 Sekunden
  let pollCount = 0;
  const maxPolls = 6; // 6 * 5s = 30s
  
  const pollFunction = () => {
    fetchGroupIdsFromServer();
    pollCount++;
    
    if (pollCount < maxPolls) {
      temporaryPollingTimeout = setTimeout(pollFunction, 5000);
    } else {
      // Nach 30s WebSocket-Verbindung neu aufbauen
      setupWebSocketForGroupIds();
    }
  };
  
  temporaryPollingTimeout = setTimeout(pollFunction, 5000);
};

/**
 * Initialisiert die Gruppen-ID-Synchronisierung basierend auf dem Gerätetyp
 */
export const initializeGroupSync = (): void => {
  // Lokale Daten sofort laden, um schnellen Start zu ermöglichen
  globalGroupIds = loadGroupIdsFromLocalStorage();
  if (Object.keys(globalGroupIds).length > 0) {
    console.log('Gruppen-IDs aus lokalem Speicher geladen:', globalGroupIds);
  }
  
  // Sofort initial Gruppen vom Server holen
  silentGroupSync();
  
  // Initial Gruppen-IDs vom Server abrufen
  fetchGroupIdsFromServer();
  
  // Gerätetyp-abhängige Synchronisierung
  if (isMobileDevice()) {
    console.log('Mobiles Gerät erkannt, verwende Polling für Gruppen-IDs-Synchronisierung');
    startGroupIdsPolling();
  } else {
    console.log('Desktop-Gerät erkannt, verwende WebSockets für Gruppen-IDs-Synchronisierung');
    setupWebSocketForGroupIds();
  }
  
  // Automatische Synchronisierung in regelmäßigen Abständen
  // Dies ist eine zusätzliche Absicherung, falls die primäre Synchronisierung fehlschlägt
  setInterval(() => {
    console.log('Automatische Aktualisierung...');
    silentGroupSync();
  }, 30000); // Alle 30 Sekunden
};

/**
 * Holt eine Chat-ID für eine gegebene Gruppen-ID
 */
export const getChatIdForGroup = (groupId: number | string): string => {
  const id = typeof groupId === 'string' ? groupId : groupId.toString();
  
  // Versuche zuerst, die ID aus dem globalGroupIds-Objekt zu holen
  if (globalGroupIds[id]) {
    return globalGroupIds[id];
  }
  
  // Versuche dann, die ID aus dem localStorage zu holen
  const storedId = localStorage.getItem(`group_chat_id_${id}`);
  if (storedId) {
    return storedId;
  }
  
  // Fallback: Verwende das traditionelle Format (legacy-Support)
  return `group-${id}`;
};

/**
 * Extrahiert eine Gruppen-ID aus einer Chat-ID
 */
export const extractGroupIdFromChatId = (chatId: string): number | null => {
  // Format 1: Traditionelles Format 'group-123'
  const traditionalMatch = chatId.match(/^group-(\d+)$/);
  if (traditionalMatch) {
    return parseInt(traditionalMatch[1], 10);
  }
  
  // Format 2: UUID-Format 'group-uuid-xyz'
  for (const [key, value] of Object.entries(globalGroupIds)) {
    if (value === chatId) {
      return parseInt(key, 10);
    }
  }
  
  return null;
};

// Exportiere auch direkt die aktuelle Gruppen-IDs für anderen Code
export const getGlobalGroupIds = (): Record<string, string> => {
  return { ...globalGroupIds };
};

export default {
  initializeGroupSync,
  getChatIdForGroup,
  extractGroupIdFromChatId,
  getGlobalGroupIds,
  fetchGroupIdsFromServer
};