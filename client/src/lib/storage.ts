// Zentrale Speicherschlüssel
export const STORAGE_KEYS = {
  USER: 'fitness-app-user',
  USERS: 'fitness-app-users',
  POSTS: 'fitness-app-posts',
  CHALLENGES: 'fitness-app-challenges',
  GROUPS: 'fitness-app-groups',
  NOTIFICATIONS: 'fitness-app-notifications'
} as const;

// Hilfsfunktionen für einheitliche Datenspeicherung
export const storage = {
  getItem: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error loading from storage (${key}):`, error);
      return fallback;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch event für andere Komponenten
      window.dispatchEvent(new CustomEvent('storageUpdated', {
        detail: { key, value }
      }));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  },

  // Event listener für Storage-Updates
  addStorageListener: (callback: (event: StorageEvent | CustomEvent) => void) => {
    window.addEventListener('storage', callback);
    window.addEventListener('storageUpdated', callback);
    return () => {
      window.removeEventListener('storage', callback);
      window.removeEventListener('storageUpdated', callback);
    };
  }
};
