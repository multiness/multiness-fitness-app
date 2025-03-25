// Zentrale Storage Keys
export const STORAGE_KEYS = {
  USER: 'fitness-app-user',
  USERS: 'fitness-app-users',
  POSTS: 'fitness-app-posts',
  CHALLENGES: 'fitness-app-challenges',
  GROUPS: 'fitness-app-groups',
  NOTIFICATIONS: 'fitness-app-notifications'
} as const;

// Debug-Funktion
const debugStorage = (action: string, key: string, value?: any) => {
  console.group('Storage Debug');
  console.log('Action:', action);
  console.log('Key:', key);
  console.log('Value:', value);
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.groupEnd();
};

// Zentrale Storage Funktionen
export const storage = {
  getItem: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      debugStorage('GET', key, item);

      if (!item) {
        debugStorage('FALLBACK', key, fallback);
        return fallback;
      }

      const parsed = JSON.parse(item);
      if (!parsed) {
        debugStorage('INVALID_DATA', key, parsed);
        return fallback;
      }

      return parsed;
    } catch (error) {
      console.error(`Error loading from storage (${key}):`, error);
      return fallback;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      debugStorage('SET', key, value);
      localStorage.setItem(key, JSON.stringify(value));

      // Dispatch event für andere Komponenten
      window.dispatchEvent(new CustomEvent('storageUpdated', {
        detail: { key, value }
      }));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  },

  // Hilfsfunktion zum Prüfen ob Daten existieren
  hasItem: (key: string): boolean => {
    const item = localStorage.getItem(key);
    debugStorage('CHECK', key, !!item);
    return !!item;
  },

  // Hilfsfunktion zum Löschen alter Daten
  removeItem: (key: string): void => {
    debugStorage('REMOVE', key);
    localStorage.removeItem(key);
  },

  // Event listener für Storage-Updates
  addStorageListener: (callback: (event: StorageEvent | CustomEvent) => void) => {
    const handleStorage = (event: StorageEvent) => {
      // Nur auf unsere Storage Keys reagieren
      if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
        debugStorage('STORAGE_EVENT', event.key, event.newValue);
        callback(event);
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      debugStorage('CUSTOM_EVENT', event.type, event.detail);
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
    debugStorage('START_MIGRATION', 'all');

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
          debugStorage('MIGRATE_OLD_DATA', oldKey, oldData);

          // Nur migrieren, wenn keine neuen Daten existieren
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, oldData);
            debugStorage('MIGRATE_SUCCESS', newKey, oldData);
          }
          // Alte Daten löschen
          localStorage.removeItem(oldKey);
          debugStorage('REMOVE_OLD_DATA', oldKey);
        }
      } catch (error) {
        console.error(`Error migrating ${oldKey} to ${newKey}:`, error);
      }
    });

    debugStorage('END_MIGRATION', 'all');
  },

  // Debug-Funktion zum Anzeigen aller Daten
  debug: () => {
    console.group('Storage Debug - All Data');
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      console.log(key, value ? JSON.parse(value) : null);
    });
    console.groupEnd();
  }
};

// Migration beim Import ausführen
storage.migrateStorage();