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
          const totalProgress = newContributions.reduce((sum, c) => sum + c.progress, 0);

          return {
            groupGoals: {
              ...state.groupGoals,
              [chatId]: {
                ...currentGoal,
                progress: Math.min(100, totalProgress),
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