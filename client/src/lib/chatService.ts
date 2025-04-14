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

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
      groupGoals: {},
      
      initializeGroupChat: (groupId: number) => {
        const chatId = getChatId(groupId, 'group');
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId] || []
          }
        }));
        console.log('Initialized chat for group:', groupId);
        
        // Bestehende Nachrichten vom Server laden
        const fetchMessages = async () => {
          try {
            console.log(`Lade Chat-Nachrichten für ${chatId} vom Server...`);
            const response = await fetch(`/api/chat/${chatId}/messages`);
            
            if (response.ok) {
              const serverMessages = await response.json();
              console.log(`${serverMessages.length} Nachrichten vom Server geladen für ${chatId}`);
              
              // Nur neue Nachrichten hinzufügen
              if (serverMessages.length > 0) {
                set((state) => {
                  const existingMessages = state.messages[chatId] || [];
                  const existingIds = new Set(existingMessages.map(m => m.id));
                  
                  // Nur neue Nachrichten hinzufügen
                  const newMessages = serverMessages.filter(m => !existingIds.has(m.id));
                  
                  if (newMessages.length > 0) {
                    console.log(`${newMessages.length} neue Nachrichten hinzugefügt für ${chatId}`);
                    return {
                      messages: {
                        ...state.messages,
                        [chatId]: [...existingMessages, ...newMessages]
                      }
                    };
                  }
                  
                  return state;
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
        const syncChatMessages = async () => {
          try {
            // WebSocket für Echtzeit-Nachrichten
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            const socket = new WebSocket(wsUrl);
            
            socket.onopen = () => {
              console.log('WebSocket-Verbindung für Chat-Synchronisierung hergestellt');
              // Abonniere Chat-Updates für diese Gruppe
              socket.send(JSON.stringify({ 
                type: 'subscribe', 
                topic: 'chat',
                groupId: groupId
              }));
            };
            
            socket.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'chat_message' && data.chatId === chatId) {
                  console.log('Neue Chat-Nachricht über WebSocket empfangen:', data);
                  
                  // Füge die Nachricht DIREKT ins State ein, anstatt addMessage aufzurufen
                  // Dies verhindert Rekursion und doppelte Verarbeitung
                  set((state) => {
                    // Prüfe, ob die Nachricht bereits existiert
                    const existingMessages = state.messages[chatId] || [];
                    const messageExists = existingMessages.some(m => m.id === data.message.id);
                    
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
              } catch (parseError) {
                console.error('Fehler beim Verarbeiten der Chat-WebSocket-Nachricht:', parseError);
              }
            };
            
            socket.onerror = (error) => {
              console.error('WebSocket-Fehler bei Chat-Synchronisierung:', error);
            };
            
            socket.onclose = () => {
              console.log('WebSocket-Verbindung für Chat geschlossen');
              // Versuche nach 5 Sekunden erneut zu verbinden
              setTimeout(syncChatMessages, 5000);
            };
          } catch (error) {
            console.error('Fehler bei der Chat-Synchronisierung:', error);
          }
        };
        
        // Starte Synchronisierung
        syncChatMessages();
      },

      addMessage: (chatId, message) => {
        // Füge die Nachricht lokal hinzu
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }));
        
        // Sende die Nachricht an den Server und andere Clients per WebSocket
        try {
          // Prüfe, ob es sich um eine Gruppennachricht handelt - entweder durch groupId oder chatId Format
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
            
            // Für Gruppennachrichten - neue WebSocket-Verbindung erstellen
            const sendMessageToServer = async () => {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `${protocol}//${window.location.host}/ws`;
              
              try {
                // Erstelle eine neue Verbindung für das Senden von Nachrichten
                const socket = new WebSocket(wsUrl);
                
                // Füge eine timeout-Funktion hinzu, die nach 5 Sekunden ausgelöst wird, 
                // wenn die Verbindung nicht hergestellt werden kann
                const connectionTimeout = setTimeout(() => {
                  console.error('WebSocket-Verbindung konnte nicht hergestellt werden (Timeout)');
                  try {
                    socket.close();
                  } catch (e) {
                    // Ignoriere Fehler beim Schließen
                  }
                }, 5000);
                
                socket.onopen = () => {
                  // Timeout abbrechen
                  clearTimeout(connectionTimeout);
                  
                  console.log('Sende Chat-Nachricht über eigene WebSocket-Verbindung');
                  
                  // Zuerst Gruppen abonnieren (wichtig für korrekte Nachrichtenverteilung)
                  socket.send(JSON.stringify({ 
                    type: 'subscribe', 
                    topic: 'groups'
                  }));
                  
                  // Dann die Nachricht an alle Clients senden
                  socket.send(JSON.stringify({
                    type: 'chat_message',
                    chatId: chatId,
                    message: message
                  }));
                  
                  // Warte kurz, bevor die Verbindung geschlossen wird
                  setTimeout(() => {
                    try {
                      socket.close();
                      console.log('Chat-Nachricht wurde gesendet, WebSocket geschlossen');
                    } catch (e) {
                      console.error('Fehler beim Schließen der WebSocket-Verbindung:', e);
                    }
                  }, 1000);
                };
                
                socket.onerror = (error) => {
                  // Timeout abbrechen
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
              } catch (e) {
                console.error('Fehler beim Erstellen der WebSocket-Verbindung:', e);
              }
            };
            
            // Sende die Nachricht
            sendMessageToServer();
          } else {
            console.log('Keine Gruppennachricht, nicht über WebSocket gesendet:', chatId);
          }
        } catch (error) {
          console.error('Fehler beim Senden der Nachricht:', error);
        }
      },

      getMessages: (chatId) => {
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

      getGroupGoal: (chatId) => {
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

export const getChatId = (entityId?: number, type: 'user' | 'group' = 'user') => {
  if (!entityId) return '';
  
  // Für Gruppen - Verwende eindeutige ID-Generierung
  if (type === 'group') {
    // Benutze Gruppenname und ID als dauerhafte Kennung
    // Statt einer rein numerischen ID, die wiederverwendet werden könnte
    const storedId = localStorage.getItem(`group_chat_id_${entityId}`);
    
    if (storedId) {
      return storedId;
    } else {
      // Erstelle eine neue eindeutige ID mit Timestamp, um Kollisionen zu vermeiden
      const uniqueId = `group-${entityId}-${Date.now()}`;
      // Speichere diese zur späteren Verwendung
      localStorage.setItem(`group_chat_id_${entityId}`, uniqueId);
      return uniqueId;
    }
  }
  
  // Für Benutzer bleibt das Format gleich
  return `${type}-${entityId}`;
};