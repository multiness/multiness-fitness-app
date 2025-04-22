import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: number;
  content: string;
  timestamp: string;
  userId: number;
  imageUrl?: string;
  groupId?: number;
  sharedContent?: {
    type: 'challenge' | 'event' | 'post';
    id: number;
    title: string;
    preview?: string;
  };
};

export type Contribution = {
  userId: number;
  value: number;
  progress: number;
  timestamp: string;
};

export type GroupGoal = {
  id: number;
  groupId: string;
  title: string;
  description?: string;
  targetDate: string;
  targetValue: number;
  unit: string;
  progress: number;
  createdAt: string;
  createdBy: number;
  contributions: Contribution[];
};

type ChatStore = {
  messages: Record<string, Message[]>;
  groupGoals: Record<string, GroupGoal>;
  unreadMessages: Record<string, number>;
  currentOpenChat: string | null;
  addMessage: (chatId: string, message: Message) => void;
  getMessages: (chatId: string) => Message[];
  setGroupGoal: (chatId: string, goal: GroupGoal) => void;
  getGroupGoal: (chatId: string) => GroupGoal | undefined;
  updateGroupGoalProgress: (chatId: string, contribution: Contribution) => void;
  initializeGroupChat: (groupId: number) => void;
  shareContent: (chatId: string, userId: number, content: {
    type: 'challenge' | 'event' | 'post';
    id: number;
    title: string;
    preview?: string;
  }) => void;
  markChatAsRead: (chatId: string) => void;
  getUnreadCount: (chatId?: string) => number;
  getTotalUnreadCount: () => number;
  setCurrentOpenChat: (chatId: string | null) => void;
};

// WebSocket Manager für konsistente Verbindungen
class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 2000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: {
    onOpen?: () => void;
    onMessage?: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  } = {};

  constructor(url: string) {
    this.url = url;
  }

  connect(callbacks: {
    onOpen?: () => void;
    onMessage?: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  }) {
    this.callbacks = callbacks;
    this.createConnection();
  }

  private createConnection() {
    // Bereits bestehende Verbindung schließen
    if (this.socket) {
      this.socket.close();
    }

    // Neue Verbindung herstellen
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket verbunden:', this.url);
      if (this.callbacks.onOpen) {
        this.callbacks.onOpen();
      }

      // Zurücksetzen des Reconnect-Intervalls bei erfolgreicher Verbindung
      this.reconnectInterval = 2000;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(data);
        }
      } catch (e) {
        console.error('Fehler beim Parsen der WebSocket-Nachricht:', e);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket-Fehler:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket-Verbindung geschlossen, versuche erneut zu verbinden...');
      if (this.callbacks.onClose) {
        this.callbacks.onClose();
      }

      // Exponentielles Backoff für Reconnect
      this.reconnectInterval = Math.min(30000, this.reconnectInterval * 1.5);
      this.reconnectTimer = setTimeout(() => this.createConnection(), this.reconnectInterval);
    };
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket nicht verbunden, Nachricht konnte nicht gesendet werden');
      return false;
    }
  }

  close() {
    console.log('Schließe WebSocket-Verbindung');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
      groupGoals: {},
      unreadMessages: {},
      currentOpenChat: null,
      
      markChatAsRead: (chatId: string) => {
        set((state) => {
          // Wenn der Chat bereits 0 ungelesene Nachrichten hat, nichts ändern
          if (!state.unreadMessages[chatId]) return state;
          
          // Setze den Zähler für ungelesene Nachrichten zurück
          return {
            unreadMessages: {
              ...state.unreadMessages,
              [chatId]: 0
            },
            currentOpenChat: chatId
          };
        });
      },
      
      getUnreadCount: (chatId?: string) => {
        const state = get();
        if (chatId) {
          return state.unreadMessages[chatId] || 0;
        }
        return 0;
      },
      
      getTotalUnreadCount: () => {
        const state = get();
        return Object.values(state.unreadMessages).reduce((sum, count) => sum + count, 0);
      },
      
      setCurrentOpenChat: (chatId: string | null) => {
        set({ currentOpenChat: chatId });
        if (chatId) {
          get().markChatAsRead(chatId);
        }
      },
      
      initializeGroupChat: (groupId: number) => {
        // VERBESSERT: Verwende die synchrone Funktion für direkte Gruppenchats
        // Dies vermeidet Timing-Probleme und "Maximum update depth exceeded" Fehler
        try {
          console.log('Initialisiere Gruppenchat für Gruppe ID:', groupId);
          const chatId = getChatIdSync(groupId, 'group');
          
          // Stellen Sie sicher, dass der Chat im Store existiert
          set((state) => {
            if (!state.messages[chatId]) {
              return {
                messages: {
                  ...state.messages,
                  [chatId]: [] // Leere Nachrichtenliste initialisieren
                }
              };
            }
            return state;
          });
          
          // Vereinfachte Nachrichten-Initialisierung ohne komplexe Logik
          console.log('Chat-ID für Gruppe', groupId, 'ist', chatId);
          
          // Wenn wir Zeit haben, können wir später die Nachrichten laden
          // Dies ist ein nicht-blockierender Prozess
          setTimeout(() => {
            fetch(`/api/chat/${chatId}/messages`)
              .then(response => {
                if (response.ok) return response.json();
                return [];
              })
              .then(messages => {
                if (messages && messages.length > 0) {
                  set((state) => ({
                    messages: {
                      ...state.messages,
                      [chatId]: [...messages]
                    }
                  }));
                }
              })
              .catch(err => {
                console.error('Fehler beim Laden der Chat-Nachrichten:', err);
              });
          }, 500);
        } catch (error) {
          console.error('Fehler beim Initialisieren des Gruppenchats:', error);
        }
      },

      addMessage: (chatId: string, message: Message) => {
        // Füge die Nachricht lokal hinzu und aktualisiere ungelesene Nachrichten
        set((state) => {
          // Überprüfe, ob die Nachricht von einem anderen Benutzer ist und nicht vom aktuellen Benutzer
          const isIncoming = message.userId !== 1; // Standard-User-ID ist 1
          
          // Überprüfe, ob dieser Chat gerade geöffnet ist
          const isChatOpen = state.currentOpenChat === chatId;
          
          // Aktualisiere den Zähler für ungelesene Nachrichten nur, wenn 
          // es eine eingehende Nachricht ist und der Chat nicht aktuell geöffnet ist
          const currentUnreadCount = state.unreadMessages[chatId] || 0;
          const newUnreadCount = (isIncoming && !isChatOpen) 
            ? currentUnreadCount + 1 
            : currentUnreadCount;
            
          return {
            messages: {
              ...state.messages,
              [chatId]: [...(state.messages[chatId] || []), message],
            },
            unreadMessages: {
              ...state.unreadMessages,
              [chatId]: newUnreadCount
            }
          };
        });
        
        // Sende die Nachricht an den Server und andere Clients per WebSocket
        try {
          // Prüfe, ob es sich um eine Gruppennachricht handelt
          const isGroupChat = message.groupId || chatId.startsWith('group-');
          
          if (isGroupChat) {
            console.log('Sende Gruppennachricht über WebSocket:', message, 'an Chat:', chatId);
            
            // Stelle sicher, dass die Nachricht eine gültige groupId hat
            if (!message.groupId && chatId.startsWith('group-')) {
              try {
                // Wir unterstützen verschiedene Chat-ID-Formate:
                let extractedGroupId: number | null = null;
                
                // Format 1: Standard-Format 'group-123'
                const standardMatch = chatId.match(/group-(\d+)/);
                if (standardMatch && standardMatch[1]) {
                  extractedGroupId = parseInt(standardMatch[1], 10);
                }
                
                // Format 2: UUID-Format 'group-uuid-xyz'
                if (!extractedGroupId) {
                  // Bei UUID-Format müssen wir den groupId aus dem globalGroupIds in umgekehrter Richtung suchen
                  for (const [key, value] of Object.entries(globalGroupIds)) {
                    if (value === chatId) {
                      extractedGroupId = parseInt(key, 10);
                      break;
                    }
                  }
                }
                
                // Verwende die extrahierte groupId, wenn verfügbar
                if (extractedGroupId && !isNaN(extractedGroupId)) {
                  message.groupId = extractedGroupId;
                  console.log('GroupId extrahiert:', extractedGroupId);
                } else {
                  console.warn('Konnte groupId nicht aus chatId extrahieren:', chatId);
                }
              } catch (err) {
                console.error('Fehler beim Extrahieren der groupId:', err);
              }
            }
            
            // Verbesserte WebSocket-Strategie für alle Gerätetypen
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            const isMobileDevice = () => {
              return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            };
            
            // Einheitliche Nachrichtenversendung für alle Gerätetypen
            const sendMessageViaWebSocket = () => {
              console.log('Sende Chat-Nachricht über WebSocket...');
              
              const socket = new WebSocket(wsUrl);
              
              // Timeout für Verbindungsaufbau
              const connectionTimeout = setTimeout(() => {
                console.error('WebSocket-Verbindung konnte nicht hergestellt werden (Timeout)');
                socket.close();
                
                // Bei Mobile: Versuche alternative Methode nach Timeout
                if (isMobileDevice()) {
                  sendMessageViaFetch();
                }
              }, 5000);
              
              socket.onopen = () => {
                clearTimeout(connectionTimeout);
                
                // Gruppen abonnieren für korrekte Nachrichtenverteilung
                socket.send(JSON.stringify({ 
                  type: 'subscribe', 
                  topic: 'groups'
                }));
                
                // Chat-Kanal abonnieren
                socket.send(JSON.stringify({
                  type: 'subscribe',
                  topic: 'chat',
                  groupId: message.groupId
                }));
                
                // Nachricht senden
                socket.send(JSON.stringify({
                  type: 'chat_message',
                  chatId: chatId,
                  message: message
                }));
                
                // Verbindung nach kurzem Timeout schließen
                setTimeout(() => {
                  socket.close();
                  console.log('Chat-Nachricht wurde über WebSocket gesendet');
                }, 1500); // Längerer Timeout für bessere Zuverlässigkeit
              };
              
              socket.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('Fehler beim Senden der Nachricht über WebSocket:', error);
                
                // Fallback für mobile Geräte: HTTP POST
                if (isMobileDevice()) {
                  sendMessageViaFetch();
                }
              };
            };
            
            // Alternative Methode für mobile Geräte: HTTP POST
            const sendMessageViaFetch = async () => {
              try {
                console.log('Versuche, Chat-Nachricht über HTTP zu senden...');
                const response = await fetch(`/api/chat/${chatId}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(message)
                });
                
                if (response.ok) {
                  console.log('Chat-Nachricht erfolgreich über HTTP gesendet');
                } else {
                  console.error('Fehler beim Senden der Nachricht über HTTP:', response.statusText);
                }
              } catch (err) {
                console.error('Netzwerkfehler beim Senden der Nachricht über HTTP:', err);
              }
            };
            
            // Einheitliche Methode für alle Gerätetypen mit Redundanzstrategie
            // 1. Sende zuerst per WebSocket für Echtzeit (alle Geräte)
            sendMessageViaWebSocket();
            
            // 2. Sende zusätzlich über HTTP für Zuverlässigkeit und Persistenz (alle Geräte)
            // Dies stellt sicher, dass die Nachricht auch bei WebSocket-Problemen ankommt
            setTimeout(() => {
              sendMessageViaFetch();
            }, 100);
          } else {
            console.log('Keine Gruppennachricht, nicht über WebSocket gesendet:', chatId);
          }
        } catch (error) {
          console.error('Fehler beim Senden der Nachricht:', error);
        }
      },

      getMessages: (chatId: string) => {
        return get().messages[chatId] || [];
      },

      setGroupGoal: (chatId: string, goal: GroupGoal) => {
        set((state) => ({
          groupGoals: {
            ...state.groupGoals,
            [chatId]: {
              ...goal,
              contributions: goal.contributions || [],
              progress: 0,
            },
          },
        }));
      },

      getGroupGoal: (chatId: string) => {
        return get().groupGoals[chatId];
      },

      updateGroupGoalProgress: (chatId: string, contribution: Contribution) => {
        set((state) => {
          const currentGoal = state.groupGoals[chatId];
          if (!currentGoal) return state;

          const existingContributions = currentGoal.contributions || [];
          const newContributions = [...existingContributions, contribution];
          const totalValue = newContributions.reduce((sum, c) => sum + c.value, 0);
          const totalProgress = Math.min(100, (totalValue / currentGoal.targetValue) * 100);

          return {
            groupGoals: {
              ...state.groupGoals,
              [chatId]: {
                ...currentGoal,
                progress: totalProgress,
                contributions: newContributions,
              },
            },
          };
        });
      },

      shareContent: (chatId: string, userId: number, content) => {
        const message: Message = {
          id: Date.now(),
          userId,
          content: `Hat eine ${content.type === 'challenge' ? 'Challenge' : content.type === 'event' ? 'Event' : 'Beitrag'} geteilt`,
          timestamp: new Date().toISOString(),
          sharedContent: content
        };

        get().addMessage(chatId, message);
      },
    }),
    {
      name: 'chat-storage',
      version: 1,
    }
  )
);

// Globaler Speicher für Gruppen-IDs, der über alle Clients hinweg konsistent sein sollte
let globalGroupIds: Record<number, string> = {};

// Diese Funktion ruft alle Gruppen-IDs vom Server ab
export const syncGroupIds = async () => {
  try {
    // Versuche, Gruppen-IDs vom Server zu laden
    const response = await fetch('/api/group-ids');
    
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        globalGroupIds = data;
        console.log('Gruppen-IDs vom Server synchronisiert:', globalGroupIds);
        
        // Aktualisiere auch den localStorage mit den Server-Daten
        Object.entries(globalGroupIds).forEach(([key, value]) => {
          localStorage.setItem(`group_chat_id_${key}`, value as string);
        });
        
        // WebSocket-Synchronisierung wird nur auf nicht-mobilen Geräten aktiviert, 
        // da mobile Geräte oft Probleme mit langlebigen WebSocket-Verbindungen haben
        // Stattdessen nutzen wir Polling für mobile Geräte
        
        // Prüfe, ob es sich um ein mobiles Gerät handelt
        const isMobileDevice = () => {
          return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        };
        
        if (isMobileDevice()) {
          // Für mobile Geräte: Verwende periodisches Polling statt WebSockets
          console.log('Mobiles Gerät erkannt, verwende Polling für Gruppen-IDs-Synchronisierung');
          
          // Polling-Funktion für periodische Aktualisierung
          const pollGroupIds = async () => {
            try {
              const response = await fetch('/api/group-ids');
              if (response.ok) {
                const data = await response.json();
                if (data && typeof data === 'object') {
                  globalGroupIds = data;
                  
                  // Aktualisiere auch den localStorage
                  Object.entries(globalGroupIds).forEach(([key, value]) => {
                    localStorage.setItem(`group_chat_id_${key}`, value as string);
                  });
                }
              }
            } catch (err) {
              console.error('Fehler beim Polling der Gruppen-IDs:', err);
            }
            
            // Setze das Polling mit einem größeren Intervall fort (15 Sekunden)
            setTimeout(pollGroupIds, 15000);
          };
          
          // Starte Polling nach einer kurzen Verzögerung
          setTimeout(pollGroupIds, 5000);
        } else {
          // Für Desktop: Verwende WebSockets für Echtzeit-Updates
          const setupWebSocketSync = () => {
            try {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `${protocol}//${window.location.host}/ws`;
              
              const socket = new WebSocket(wsUrl);
              
              socket.onopen = () => {
                console.log('WebSocket-Verbindung für Gruppen-IDs-Synchronisierung hergestellt');
                
                try {
                  // Abonniere Gruppen-IDs-Updates
                  socket.send(JSON.stringify({
                    type: 'subscribe',
                    topic: 'groupIds'
                  }));
                } catch (err) {
                  console.error('Fehler beim Senden der Subscription-Nachricht:', err);
                }
              };
              
              socket.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  
                  if (data.type === 'groupIds' && data.groupIds) {
                    console.log('Gruppen-IDs per WebSocket aktualisiert:', data.groupIds);
                    
                    // Aktualisiere den globalen Cache
                    globalGroupIds = data.groupIds;
                    
                    // Aktualisiere den localStorage
                    Object.entries(globalGroupIds).forEach(([key, value]) => {
                      localStorage.setItem(`group_chat_id_${key}`, value as string);
                    });
                  }
                } catch (error) {
                  console.error('Fehler beim Verarbeiten der WebSocket-Gruppen-IDs-Nachricht:', error);
                }
              };
              
              socket.onerror = (error) => {
                console.error('WebSocket-Fehler für Gruppen-IDs-Synchronisierung:', error);
              };
              
              socket.onclose = () => {
                console.log('WebSocket-Verbindung für Gruppen-IDs-Synchronisierung geschlossen, versuche erneut zu verbinden...');
                // Weniger aggressive Reconnect-Strategie
                setTimeout(setupWebSocketSync, 10000);
              };
            } catch (err) {
              console.error('Kritischer Fehler beim Einrichten des WebSockets:', err);
              // Bei kritischen Fehlern längere Wartezeit vor neuem Versuch
              setTimeout(setupWebSocketSync, 30000);
            }
          };
          
          // Starte WebSocket-Synchronisierung nach kurzer Verzögerung
          setTimeout(() => {
            setupWebSocketSync();
          }, 2000);
        }
      }
    } else {
      console.warn('Konnte Gruppen-IDs nicht vom Server laden, verwende lokale Daten');
      // Wenn der Server nicht verfügbar ist, lade aus dem localStorage
      loadGroupIdsFromLocalStorage();
    }
  } catch (error) {
    console.error('Fehler beim Synchronisieren der Gruppen-IDs:', error);
    // Fallback zu localStorage
    loadGroupIdsFromLocalStorage();
  }
};

// Lade Gruppen-IDs aus dem localStorage
const loadGroupIdsFromLocalStorage = () => {
  // Durchsuche localStorage nach allen Gruppen-ID-Einträgen
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('group_chat_id_')) {
      const groupId = parseInt(key.replace('group_chat_id_', ''), 10);
      if (!isNaN(groupId)) {
        globalGroupIds[groupId] = localStorage.getItem(key) || '';
      }
    }
  });
  console.log('Gruppen-IDs aus localStorage geladen:', globalGroupIds);
};

// Initialisiere die Gruppen-IDs beim Laden der Anwendung
// Erst aus dem localStorage, dann vom Server synchronisieren
loadGroupIdsFromLocalStorage();
syncGroupIds().catch(e => console.error('Fehler bei der initialen Gruppen-ID-Synchronisierung:', e));

// Verbesserte synchrone Version der getChatId-Funktion für direkte Verwendung in JSX und onClick Handlern
export const getChatIdSync = (entityId?: number | string | null, type: 'user' | 'group' = 'user'): string => {
  try {
    // Sicherstellen, dass entityId ein korrekter Wert ist
    if (entityId === undefined || entityId === null) return '';
    
    // EntityId in number konvertieren, falls es ein String ist
    const numericId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
    
    // Überprüfen, ob numericId eine gültige Zahl ist
    if (isNaN(numericId)) {
      console.warn(`getChatIdSync: Ungültige entityId ${entityId}`);
      return '';
    }
    
    // Für Gruppen - Verwende einheitliche ID-Generierung
    if (type === 'group') {
      // Prüfe zuerst im globalen Speicher
      if (globalGroupIds[numericId]) {
        return globalGroupIds[numericId];
      }
      
      // Wenn nicht im globalen Speicher, prüfe localStorage
      try {
        const storedId = localStorage.getItem(`group_chat_id_${numericId}`);
        
        if (storedId) {
          // Speichere auch im globalen Speicher
          globalGroupIds[numericId] = storedId;
          return storedId;
        } else {
          // Fallback auf einfaches Format, wenn keine ID gefunden wurde
          const fallbackId = `group-${numericId}`;
          globalGroupIds[numericId] = fallbackId;
          localStorage.setItem(`group_chat_id_${numericId}`, fallbackId);
          return fallbackId;
        }
      } catch (e) {
        // Fallback bei localStorage Fehler
        console.warn('localStorage Fehler in getChatIdSync:', e);
        return `group-${numericId}`;
      }
    }
    
    // Für Benutzer - Einfache ID-Generierung
    return `chat-${numericId}`;
  } catch (error) {
    // Globale Fehlerbehandlung
    console.error('Fehler in getChatIdSync:', error);
    return '';
  }
};

export const getChatId = async (entityId?: number, type: 'user' | 'group' = 'user'): Promise<string> => {
  if (!entityId) return '';
  
  // Für Gruppen - Verwende einheitliche ID-Generierung
  if (type === 'group') {
    // Prüfe zuerst im globalen Speicher
    if (globalGroupIds[entityId]) {
      return globalGroupIds[entityId];
    }
    
    // Wenn nicht im globalen Speicher, prüfe localStorage
    const storedId = localStorage.getItem(`group_chat_id_${entityId}`);
    
    if (storedId) {
      // Speichere auch im globalen Speicher
      globalGroupIds[entityId] = storedId;
      return storedId;
    } else {
      // Abrufen einer permanent eindeutigen ID vom Server
      // Der Server generiert ein UUID-basiertes Format
      try {
        // Asynchroner Aufruf, um eine neue einzigartige ID vom Server zu erhalten
        const response = await fetch('/api/group-ids/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: entityId })
        });
        
        if (response.ok) {
          const data = await response.json();
          const uniqueId = data.chatId; // Format: "group-uuid-[einzigartige ID]"
          
          // Speichere im localStorage und globalem Speicher
          localStorage.setItem(`group_chat_id_${entityId}`, uniqueId);
          globalGroupIds[entityId] = uniqueId;
          
          console.log(`Neue permanent eindeutige ID für Gruppe ${entityId} vom Server erhalten: ${uniqueId}`);
          return uniqueId;
        } else {
          console.warn('Fehler beim Abrufen einer eindeutigen ID vom Server:', response.statusText);
          
          // Fallback: Generiere lokal eine eindeutige ID als temporäre Lösung
          const fallbackId = `group-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(`group_chat_id_${entityId}`, fallbackId);
          globalGroupIds[entityId] = fallbackId;
          
          console.warn(`Fallback-ID generiert: ${fallbackId}`);
          return fallbackId;
        }
      } catch (e) {
        console.error('Fehler beim Generieren einer eindeutigen ID:', e);
        
        // Fallback: Bei Netzwerkproblemen lokalen Identifier verwenden
        const emergencyId = `group-emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`group_chat_id_${entityId}`, emergencyId);
        globalGroupIds[entityId] = emergencyId;
        
        console.warn(`Notfall-ID generiert: ${emergencyId}`);
        return emergencyId;
      }
    }
  }
  
  // Für Benutzer bleibt das Format gleich
  return `${type}-${entityId}`;
};