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

type ChatStore = {
  messages: Record<string, Message[]>;
  addMessage: (chatId: string, message: Message) => void;
  getMessages: (chatId: string) => Message[];
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
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