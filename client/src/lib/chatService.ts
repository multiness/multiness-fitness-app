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
      
      initializeGroupChat: (groupId: number) => {
        // Vorhandene synchrone Implementierung, die keine async/await verwendet
        const chatIdPromise = getChatId(groupId, 'group');
        
        // Mit Promise-Syntax statt async/await arbeiten
        chatIdPromise.then(chatId => {
          // Vorhandene Nachrichten laden
          const fetchMessages = async () => {
            try {
              const response = await fetch(`/api/chat/${chatId}/messages`);
              
              if (response.ok) {
                const messages = await response.json();
                
                if (messages && messages.length > 0) {
                  set((state) => {
                    // Wenn bereits Nachrichten vorhanden sind, überspringe
                    if (state.messages[chatId] && state.messages[chatId].length > 0) {
                      console.log(`Chat ${chatId} bereits initialisiert mit ${state.messages[chatId].length} Nachrichten`);
                      return state;
                    }
                    
                    return {
                      messages: {
                        ...state.messages,
                        [chatId]: messages
                      }
                    };
                  });
                }
              } else {
                console.error('Fehler beim Laden der Chat-Nachrichten:', response.statusText);
              }
            } catch (error) {
              console.error('Fehler beim Abrufen der Chat-Nachrichten:', error);
            }
          };
          
          // Vorhandene Nachrichten laden
          fetchMessages();
          
          // Nachrichten mit dem Server synchronisieren (WebSocket)
          const syncChatMessages = () => {
            // WebSocket für Echtzeit-Nachrichten
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            const wsManager = new WebSocketManager(wsUrl);
            
            wsManager.connect({
              onOpen: () => {
                console.log('WebSocket-Verbindung für Chat-Synchronisierung hergestellt');
                
                // Abonniere Chat-Updates für diese Gruppe
                wsManager.send({ 
                  type: 'subscribe', 
                  topic: 'chat',
                  groupId: groupId
                });
              },
              onMessage: (data) => {
                if (data.type === 'chat_message' && data.chatId === chatId) {
                  console.log('Neue Chat-Nachricht über WebSocket empfangen:', data);
                  
                  // Füge die Nachricht ins State ein
                  set((state) => {
                    // Prüfe, ob die Nachricht bereits existiert
                    const existingMessages = state.messages[chatId] || [];
                    const messageExists = existingMessages.some((m: any) => m.id === data.message.id);
                    
                    if (!messageExists) {
                      console.log('Füge neue Nachricht aus WebSocket hinzu:', data.message);
                      return {
                        messages: {
                          ...state.messages,
                          [chatId]: [...existingMessages, data.message]
                        }
                      };
                    }
                    
                    return state; // Keine Änderung, wenn Nachricht bereits existiert
                  });
                }
              },
              onError: (error) => {
                console.error('WebSocket-Fehler bei Chat-Synchronisierung:', error);
              }
            });
          };
          
          // Starte Synchronisierung
          syncChatMessages();
        }).catch(error => {
          console.error('Fehler beim Abrufen der Chat-ID:', error);
        });
      },

      addMessage: (chatId: string, message: Message) => {
        // Füge die Nachricht lokal hinzu
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }));
        
        // Sende die Nachricht an den Server und andere Clients per WebSocket
        try {
          // Prüfe, ob es sich um eine Gruppennachricht handelt
          const isGroupChat = message.groupId || chatId.startsWith('group-');
          
          if (isGroupChat) {
            console.log('Sende Gruppennachricht über WebSocket:', message, 'an Chat:', chatId);
            
            // Stelle sicher, dass die Nachricht eine gültige groupId hat
            if (!message.groupId && chatId.startsWith('group-')) {
              // Extrahiere die Gruppen-ID aus dem chatId Format "group-X"
              const groupIdMatch = chatId.match(/group-(\d+)/);
              if (groupIdMatch && groupIdMatch[1]) {
                const groupId = parseInt(groupIdMatch[1], 10);
                // Füge groupId zur Nachricht hinzu, wenn sie fehlt
                message.groupId = groupId;
                console.log('GroupId aus der chatId extrahiert:', groupId);
              }
            }
            
            // WebSocket-Verbindung für Nachrichtensendung
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            const socket = new WebSocket(wsUrl);
            
            // Timeout für Verbindungsaufbau
            const connectionTimeout = setTimeout(() => {
              console.error('WebSocket-Verbindung konnte nicht hergestellt werden (Timeout)');
              socket.close();
            }, 5000);
            
            socket.onopen = () => {
              clearTimeout(connectionTimeout);
              console.log('Sende Chat-Nachricht über eigene WebSocket-Verbindung');
              
              // Gruppen abonnieren für korrekte Nachrichtenverteilung
              socket.send(JSON.stringify({ 
                type: 'subscribe', 
                topic: 'groups'
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
                console.log('Chat-Nachricht wurde gesendet, WebSocket geschlossen');
              }, 1000);
            };
            
            socket.onerror = (error) => {
              clearTimeout(connectionTimeout);
              console.error('Fehler beim Senden der Nachricht an den Server:', error);
            };
            
            socket.onmessage = (event) => {
              try {
                const response = JSON.parse(event.data);
                console.log('Antwort vom Server nach Nachrichtensendung:', response);
              } catch (e) {
                console.error('Fehler beim Parsen der WebSocket-Antwort:', e);
              }
            };
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
        
        // Zusätzlich WebSocket-Verbindung für Echtzeit-Updates einrichten
        const setupWebSocketSync = () => {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          
          const socket = new WebSocket(wsUrl);
          
          socket.onopen = () => {
            console.log('WebSocket-Verbindung für Gruppen-IDs-Synchronisierung hergestellt');
            
            // Abonniere Gruppen-IDs-Updates
            socket.send(JSON.stringify({
              type: 'subscribe',
              topic: 'groupIds'
            }));
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
            setTimeout(setupWebSocketSync, 5000);
          };
        };
        
        // Starte WebSocket-Synchronisierung
        setupWebSocketSync();
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