import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Notification = {
  id: number;
  type: 'challenge' | 'group' | 'event' | 'product';
  title: string;
  message: string;
  time: Date;
  unread: boolean;
  link: string;
};

type NotificationStore = {
  notifications: Record<number, Notification>;
  addNotification: (notification: Omit<Notification, "id">) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  getNotificationsByType: () => Record<string, Notification[]>;
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: {},

      addNotification: (notification) => {
        const id = Date.now();
        set((state) => ({
          notifications: {
            ...state.notifications,
            [id]: {
              ...notification,
              id,
            },
          },
        }));
      },

      markAsRead: (id: number) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            [id]: {
              ...state.notifications[id],
              unread: false,
            },
          },
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: Object.entries(state.notifications).reduce(
            (acc, [id, notification]) => ({
              ...acc,
              [id]: { ...notification, unread: false },
            }),
            {}
          ),
        }));
      },

      getUnreadCount: () => {
        const notifications = Object.values(get().notifications);
        return notifications.filter((n) => n.unread).length;
      },

      getNotificationsByType: () => {
        const notifications = Object.values(get().notifications);
        return notifications.reduce((acc, notification) => {
          if (!acc[notification.type]) {
            acc[notification.type] = [];
          }
          acc[notification.type].push(notification);
          return acc;
        }, {} as Record<string, Notification[]>);
      },
    }),
    {
      name: 'notification-storage',
      version: 1,
    }
  )
);
