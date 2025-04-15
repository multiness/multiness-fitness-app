/**
 * Synchronisierungsmodul für Gruppendaten zwischen Desktop und Mobilgeräten
 * Sorgt für konsistente Gruppendaten über alle Ansichten hinweg
 */

import { WebSocketManager } from './WebSocketManager';
import { useGroupStore } from './groupStore';

// Globaler Cache für Gruppen-IDs
let globalGroupIds: Record<string, string> = {};

// Funktion zur Erkennung mobiler Geräte
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Speichern von Gruppen-IDs im localStorage
const saveGroupIdsToLocalStorage = (groupIds: Record<string, string>): void => {
  Object.entries(groupIds).forEach(([key, value]) => {
    localStorage.setItem(`group_chat_id_${key}`, value);
  });
};

// Gruppen-IDs vom Server abrufen
const fetchGroupIdsFromServer = async (): Promise<void> => {
  try {
    // Cache-Buster hinzufügen, um sicherzustellen, dass wir aktuelle Daten bekommen
    const cacheBuster = new Date().getTime();
    const response = await fetch(`/api/group-ids?_=${cacheBuster}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        globalGroupIds = data;
        console.log('Gruppen-IDs vom Server synchronisiert:', globalGroupIds);
        
        // Aktualisiere den localStorage
        saveGroupIdsToLocalStorage(globalGroupIds);
        
        // Zustand im Store aktualisieren - falls nötig
        const groupStore = useGroupStore.getState();
        if (groupStore) {
          groupStore.syncWithServer();
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
  
  console.log('Starte Polling für Gruppen-IDs-Synchronisierung...');
  
  // Sofort erste Abfrage durchführen
  fetchGroupIdsFromServer();
  
  // Regelmäßig aktualisieren (alle 10 Sekunden)
  pollingInterval = setInterval(fetchGroupIdsFromServer, 10000);
};

// WebSocket-Mechanismus für Desktop-Geräte
let wsManager: WebSocketManager | null = null;

const setupWebSocketForGroupIds = (): void => {
  if (wsManager) {
    wsManager.disconnect();
  }
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  wsManager = new WebSocketManager(wsUrl, {
    onOpen: () => {
      console.log('WebSocket-Verbindung für Gruppen-IDs-Synchronisierung hergestellt');
      wsManager?.subscribe('groupIds');
      
      // Initial Gruppen-IDs abrufen
      fetchGroupIdsFromServer();
    },
    onMessage: (data) => {
      if (data.type === 'groupIds' && data.groupIds) {
        console.log('Gruppen-IDs per WebSocket aktualisiert:', data.groupIds);
        
        // Aktualisiere den globalen Cache
        globalGroupIds = data.groupIds;
        
        // Aktualisiere den localStorage
        saveGroupIdsToLocalStorage(globalGroupIds);
        
        // Zustand im Store aktualisieren - falls nötig
        const groupStore = useGroupStore.getState();
        if (groupStore) {
          groupStore.syncWithServer();
        }
      }
    },
    onClose: () => {
      // Bei WS-Verbindungsabbruch einmalig die Gruppen-IDs per Fetch abrufen
      fetchGroupIdsFromServer();
    }
  });
};

/**
 * Initialisiert die Gruppen-ID-Synchronisierung basierend auf dem Gerätetyp
 */
export const initializeGroupSync = (): void => {
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
  
  // Automatische Synchronisierung der Gruppendaten in regelmäßigen Abständen
  // Dies ist eine zusätzliche Absicherung, falls die primäre Synchronisierung fehlschlägt
  setInterval(() => {
    console.log('Automatische Aktualisierung der Gruppendaten...');
    const groupStore = useGroupStore.getState();
    if (groupStore) {
      groupStore.syncWithServer();
    }
  }, 60000); // Jede Minute
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