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
                  // Füge die Nachricht hinzu, wenn sie nicht bereits existiert
                  const messageExists = get().messages[chatId]?.some(m => m.id === data.message.id);
                  if (!messageExists) {
                    get().addMessage(chatId, data.message);
                  }
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
          if (message.groupId) {
            console.log('Sende Gruppennachricht über WebSocket:', message);
            
            // Für Gruppennachrichten - es ist wichtig, eine neue WebSocket-Verbindung zu erstellen,
            // anstatt die bestehende zu verwenden, da Zustand im Client konsistent bleiben muss
            const sendMessageToServer = async () => {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `${protocol}//${window.location.host}/ws`;
              const socket = new WebSocket(wsUrl);
              
              socket.onopen = () => {
                console.log('Sende Chat-Nachricht über eigene WebSocket-Verbindung');
                // Sende die Nachricht an alle Clients, die diesen Chat abonniert haben
                socket.send(JSON.stringify({
                  type: 'chat_message',
                  chatId: chatId,
                  message: message
                }));
                
                // Warte kurz, bevor die Verbindung geschlossen wird, damit die Nachricht übertragen werden kann
                setTimeout(() => {
                  socket.close();
                  console.log('Chat-Nachricht wurde gesendet, WebSocket geschlossen');
                }, 500);
              };
              
              socket.onerror = (error) => {
                console.error('Fehler beim Senden der Nachricht an den Server:', error);
              };
            };
            
            // Sende die Nachricht
            sendMessageToServer();
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
  return `${type}-${entityId}`;
};