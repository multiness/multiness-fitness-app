// Zentrale Storage Keys
export const STORAGE_KEYS = {
  USER: 'fitness-app-user',
  USERS: 'fitness-app-users',
  POSTS: 'fitness-app-posts',
  CHALLENGES: 'fitness-app-challenges',
  GROUPS: 'fitness-app-groups',
  NOTIFICATIONS: 'fitness-app-notifications'
} as const;

// Zentrale Storage Funktionen
export const storage = {
  getItem: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;

      const parsed = JSON.parse(item);
      return parsed || fallback;
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
    const handleStorage = (event: StorageEvent) => {
      // Nur auf unsere Storage Keys reagieren
      if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
        callback(event);
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      callback(event);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('storageUpdated', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('storageUpdated', handleCustomEvent as EventListener);
    };
  },

  // Hilfsfunktion zum Migrieren von alten Storage Keys
  migrateStorage: () => {
    // Alle alten Keys, die wir migrieren wollen
    const oldKeys = {
      'user-data': STORAGE_KEYS.USER,
      'users-data': STORAGE_KEYS.USERS,
      'posts-data': STORAGE_KEYS.POSTS,
      'challenges-data': STORAGE_KEYS.CHALLENGES,
    };

    Object.entries(oldKeys).forEach(([oldKey, newKey]) => {
      try {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          // Nur migrieren, wenn keine neuen Daten existieren
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, oldData);
          }
          // Alte Daten löschen
          localStorage.removeItem(oldKey);
        }
      } catch (error) {
        console.error(`Error migrating ${oldKey} to ${newKey}:`, error);
      }
    });
  }
};

// Migration beim Import ausführen
storage.migrateStorage();