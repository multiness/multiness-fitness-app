import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bell, Dumbbell, Users2, Calendar, Package, MessageSquare } from 'lucide-react';

export type NotificationType = 'challenge' | 'group' | 'event' | 'product' | 'post' | 'admin';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  unread: boolean;
  link: string;
  entityId?: number; // ID der betreffenden Entität (Challenge-ID, Group-ID, etc.)
  iconName: string; // Name des Lucide-Icons
}

type NotificationStore = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'unread'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  getGroupedNotifications: () => Record<NotificationType, Notification[]>;
  clearNotifications: () => void;
  deleteNotification: (id: number) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now(),
          time: new Date(),
          unread: true,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, unread: false } : n
          )
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, unread: false }))
        }));
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => n.unread).length;
      },

      getGroupedNotifications: () => {
        return get().notifications.reduce((acc, notification) => {
          if (!acc[notification.type]) {
            acc[notification.type] = [];
          }
          acc[notification.type].push(notification);
          return acc;
        }, {} as Record<NotificationType, Notification[]>);
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      }
    }),
    {
      name: 'notification-storage',
      version: 1,
    }
  )
);

// Hilfsfunktion, um das richtige Icon zu erhalten
export const getNotificationIcon = (iconName: string) => {
  switch (iconName) {
    case 'Bell': return Bell;
    case 'Dumbbell': return Dumbbell;
    case 'Users2': return Users2;
    case 'Calendar': return Calendar;
    case 'Package': return Package;
    case 'MessageSquare': return MessageSquare;
    default: return Bell;
  }
};

// Helper-Funktionen für häufige Notification-Typen
export const notifyNewChallenge = (title: string, challengeId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'challenge',
    title: 'Neue Challenge',
    message: `"${title}" wurde erstellt`,
    link: `/challenges/${challengeId}`,
    entityId: challengeId,
    iconName: 'Dumbbell'
  });
};

export const notifyNewGroup = (title: string, groupId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'group',
    title: 'Neue Gruppe',
    message: `"${title}" wurde erstellt`,
    link: `/groups/${groupId}`,
    entityId: groupId,
    iconName: 'Users2'
  });
};

export const notifyNewEvent = (title: string, eventId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'event',
    title: 'Neues Event',
    message: `"${title}" wurde angekündigt`,
    link: `/events/${eventId}`,
    entityId: eventId,
    iconName: 'Calendar'
  });
};

export const notifyNewProduct = (title: string, productId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'product',
    title: 'Neues Produkt',
    message: `"${title}" ist jetzt im Shop verfügbar`,
    link: `/products/${productId}`,
    entityId: productId,
    iconName: 'Package'
  });
};

export const notifyNewPost = (authorName: string, postId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'post',
    title: 'Neuer Beitrag',
    message: `${authorName} hat einen neuen Beitrag veröffentlicht`,
    link: `/posts/${postId}`,
    entityId: postId,
    iconName: 'MessageSquare'
  });
};

export const notifyAdminMessage = (title: string, message: string, link = '/') => {
  useNotificationStore.getState().addNotification({
    type: 'admin',
    title,
    message,
    link,
    iconName: 'Bell'
  });
};