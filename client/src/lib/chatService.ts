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
  progress: number;
  timestamp: string;
};

export type GroupGoal = {
  id: number;
  groupId: string;
  title: string;
  description?: string;
  targetDate: string;
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
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
      groupGoals: {},
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
              progress: 0, // Initialer Fortschritt ist 0
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

          // Bestehende Beiträge abrufen oder leeres Array initialisieren
          const existingContributions = currentGoal.contributions || [];

          // Neuen Beitrag hinzufügen
          const newContributions = [...existingContributions, contribution];

          // Gesamtfortschritt berechnen (Summe aller Beiträge)
          const totalProgress = Math.min(
            100,
            newContributions.reduce((sum, c) => sum + c.progress, 0)
          );

          // Prüfen ob das Ziel gerade erreicht wurde
          const wasGoalReached = currentGoal.progress < 100 && totalProgress >= 100;
          if (wasGoalReached) {
            // Erfolgsnachricht zum Chat hinzufügen
            const message = {
              id: Date.now(),
              userId: contribution.userId,
              content: `🎉 Großartig! Das Gruppenziel "${currentGoal.title}" wurde erreicht! Herzlichen Glückwunsch an alle Teilnehmer!

Ziel: ${currentGoal.title}
${currentGoal.description ? `Beschreibung: ${currentGoal.description}\n` : ''}
Erreicht am: ${new Date().toLocaleDateString('de-DE')}

Klicke unten, um die Beiträge aller Teilnehmer zu sehen!`,
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
      name: 'chat-storage'
    }
  )
);

export const getChatId = (groupId?: number) => {
  return groupId ? `group-${groupId}` : 'direct';
};