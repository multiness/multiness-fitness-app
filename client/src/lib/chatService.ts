import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: number;
  content: string;
  timestamp: string;
  userId: number;
  imageUrl?: string;
  groupId?: number;
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
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }));
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

          const wasGoalReached = currentGoal.progress < 100 && totalProgress >= 100;
          if (wasGoalReached) {
            const message = {
              id: Date.now(),
              userId: contribution.userId,
              content: `🎉 Großartig! Das Gruppenziel "${currentGoal.title}" wurde erreicht! Herzlichen Glückwunsch an alle Teilnehmer!\n\nZiel: ${currentGoal.title}\n${currentGoal.description ? `Beschreibung: ${currentGoal.description}\n` : ''}\nErreicht am: ${new Date().toLocaleDateString('de-DE')}\n\nGesamtziel: ${currentGoal.targetValue} ${currentGoal.unit}\nErreicht: ${totalValue.toFixed(1)} ${currentGoal.unit}\n\nKlicke unten, um die Beiträge aller Teilnehmer zu sehen!`,
              timestamp: new Date().toISOString(),
              groupId: parseInt(chatId.substring(6)),
            };
            get().addMessage(chatId, message);
          }

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
    }),
    {
      name: 'chat-storage',
      version: 1,
    }
  )
);

export const getChatId = (groupId?: number) => {
  return groupId ? `group-${groupId}` : 'direct';
};