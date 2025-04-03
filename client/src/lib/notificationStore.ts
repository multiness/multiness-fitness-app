import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Bell, Package, Trophy, Users, Calendar, MessageSquare, Medal } from 'lucide-react'

export type NotificationType = 
  | 'challenge'
  | 'group'
  | 'event'
  | 'product'
  | 'post'
  | 'admin'
  | 'message'
  | 'achievement';

export type Notification = {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  targetId?: number; // ID des verknüpften Inhalts
  actionUrl?: string; // URL zum Navigieren beim Anklicken
  iconSrc?: string;
  initiatorId?: number; // Benutzer, der die Aktion ausgelöst hat
};

type NotificationStore = {
  notifications: Record<number, Notification>;
  currentTab: NotificationType | 'all';
  unreadCount: number;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAll: () => void;
  setCurrentTab: (tab: NotificationType | 'all') => void;
  
  getUnreadCount: () => number;
  getNotificationsByType: (type: NotificationType | 'all') => Notification[];
  hasUnreadNotifications: () => boolean;
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: {},
      currentTab: 'all',
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newId = Date.now();
        const newNotification: Notification = {
          ...notification,
          id: newId,
          timestamp: new Date(),
          read: false
        };
        
        set((state) => ({
          notifications: {
            ...state.notifications,
            [newId]: newNotification
          },
          unreadCount: state.unreadCount + 1
        }));
      },
      
      markAsRead: (id) => {
        set((state) => {
          if (!state.notifications[id]) return state;
          
          if (state.notifications[id].read) return state;
          
          return {
            notifications: {
              ...state.notifications,
              [id]: {
                ...state.notifications[id],
                read: true
              }
            },
            unreadCount: Math.max(0, state.unreadCount - 1)
          };
        });
      },
      
      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = Object.entries(state.notifications).reduce(
            (acc, [id, notification]) => ({
              ...acc,
              [id]: { ...notification, read: true }
            }),
            {}
          );
          
          return {
            notifications: updatedNotifications,
            unreadCount: 0
          };
        });
      },
      
      deleteNotification: (id) => {
        set((state) => {
          const { [id]: notification, ...rest } = state.notifications;
          
          if (!notification) return state;
          
          const updatedUnreadCount = notification.read
            ? state.unreadCount
            : Math.max(0, state.unreadCount - 1);
          
          return {
            notifications: rest,
            unreadCount: updatedUnreadCount
          };
        });
      },
      
      clearAll: () => {
        set({ notifications: {}, unreadCount: 0 });
      },
      
      setCurrentTab: (tab) => {
        set({ currentTab: tab });
      },
      
      getUnreadCount: () => {
        return get().unreadCount;
      },
      
      getNotificationsByType: (type) => {
        const notifications = Object.values(get().notifications);
        if (type === 'all') return notifications;
        return notifications.filter(notification => notification.type === type);
      },
      
      hasUnreadNotifications: () => {
        return get().unreadCount > 0;
      }
    }),
    {
      name: 'notification-storage'
    }
  )
);

// Helper-Funktion um passende Icons zu Benachrichtigungstypen zu erhalten
export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'challenge':
      return Trophy;
    case 'group':
      return Users;
    case 'event':
      return Calendar;
    case 'product':
      return Package;
    case 'message':
      return MessageSquare;
    case 'achievement':
      return Medal;
    default:
      return Bell;
  }
};

// Helper-Funktion um Benachrichtigungen nach Typ zu gruppieren
export const getGroupedNotifications = () => {
  const store = useNotificationStore.getState();
  const all = Object.values(store.notifications);
  
  return {
    all,
    challenge: all.filter(n => n.type === 'challenge'),
    group: all.filter(n => n.type === 'group'),
    event: all.filter(n => n.type === 'event'),
    product: all.filter(n => n.type === 'product'),
    post: all.filter(n => n.type === 'post'),
    admin: all.filter(n => n.type === 'admin'),
    message: all.filter(n => n.type === 'message'),
    achievement: all.filter(n => n.type === 'achievement'),
  };
};

// Hilfsfunktionen zum Erstellen von Benachrichtigungen
export const notifyNewChallenge = (challengeName: string, challengeId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'challenge',
    message: `Neue Challenge: ${challengeName}`,
    targetId: challengeId,
    actionUrl: `/challenges/${challengeId}`
  });
};

export const notifyNewProduct = (productName: string, productId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'product',
    message: `Neues Produkt: ${productName}`,
    targetId: productId,
    actionUrl: `/products/${productId}`
  });
};

export const notifyProductOnSale = (productName: string, productId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'product',
    message: `SALE: ${productName} jetzt im Angebot!`,
    targetId: productId,
    actionUrl: `/products/${productId}`
  });
};

export const notifyNewPost = (authorName: string, postId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'post',
    message: `Neuer Beitrag von ${authorName}`,
    targetId: postId,
    actionUrl: `/posts/${postId}`
  });
};

export const notifyNewGroup = (groupName: string, groupId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'group',
    message: `Neue Gruppe: ${groupName}`,
    targetId: groupId,
    actionUrl: `/groups/${groupId}`
  });
};

export const notifyAddedToGroup = (groupName: string, groupId: number, initiatorId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'group',
    message: `Du wurdest zur Gruppe ${groupName} hinzugefügt`,
    targetId: groupId,
    actionUrl: `/groups/${groupId}`,
    initiatorId
  });
};

export const notifyNewMessage = (senderName: string, chatId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'message',
    message: `Neue Nachricht von ${senderName}`,
    targetId: chatId,
    actionUrl: `/chat/${chatId}`
  });
};

export const notifyNewEvent = (eventName: string, eventId: number) => {
  useNotificationStore.getState().addNotification({
    type: 'event',
    message: `Neues Event: ${eventName}`,
    targetId: eventId,
    actionUrl: `/events/${eventId}`
  });
};

export const notifyAchievement = (achievement: string) => {
  useNotificationStore.getState().addNotification({
    type: 'achievement',
    message: `Neuer Erfolg: ${achievement}`
  });
};

export const notifyAdminMessage = (message: string) => {
  useNotificationStore.getState().addNotification({
    type: 'admin',
    message
  });
};