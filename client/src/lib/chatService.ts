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
        const chatId = getChatId(groupId);
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId] || []
          }
        }));
        console.log('Initialized chat for group:', groupId);
        
        // Nachrichten mit dem Server synchronisieren
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
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }));
        
        // Sende die Nachricht an den Server
        try {
          if (message.groupId) {
            // Für Gruppennachrichten
            const sendMessageToServer = async () => {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `${protocol}//${window.location.host}/ws`;
              const socket = new WebSocket(wsUrl);
              
              socket.onopen = () => {
                socket.send(JSON.stringify({
                  type: 'chat_message',
                  chatId: chatId,
                  message: message
                }));
                socket.close();
              };
              
              socket.onerror = (error) => {
                console.error('Fehler beim Senden der Nachricht an den Server:', error);
              };
            };
            
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