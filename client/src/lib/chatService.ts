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

export type GroupGoal = {
  id: number;
  groupId: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  createdAt: string;
  createdBy: number;
};

type ChatStore = {
  messages: Record<string, Message[]>;
  groupGoals: Record<string, GroupGoal>;
  addMessage: (chatId: string, message: Message) => void;
  getMessages: (chatId: string) => Message[];
  setGroupGoal: (chatId: string, goal: GroupGoal) => void;
  getGroupGoal: (chatId: string) => GroupGoal | undefined;
  updateGroupGoalProgress: (chatId: string, progress: number) => void;
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
      setGroupGoal: (chatId, goal) => {
        set((state) => ({
          groupGoals: {
            ...state.groupGoals,
            [chatId]: goal,
          },
        }));
      },
      getGroupGoal: (chatId) => {
        return get().groupGoals[chatId];
      },
      updateGroupGoalProgress: (chatId, progress) => {
        set((state) => ({
          groupGoals: {
            ...state.groupGoals,
            [chatId]: state.groupGoals[chatId] 
              ? { ...state.groupGoals[chatId], progress }
              : undefined,
          },
        }));
      },
    }),
    {
      name: 'chat-storage'
    }
  )
);

// Helper Funktion um Chat-ID zu generieren
export const getChatId = (groupId?: number) => {
  return groupId ? `group-${groupId}` : 'direct';
};