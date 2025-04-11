import { STORAGE_KEY, USERS_STORAGE_KEY } from "../contexts/UserContext";

// Constants for backup
const BACKUP_PREFIX = 'fitness-app-backup';
const SERVER_BACKUP_PREFIX = '/api/backups';
const MAX_BACKUPS = 5;

// Timestamp formatter for readable backup names
const formatTimestamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
};

// Hilfsfunktion, um Backups mit dem Server zu synchronisieren
const syncBackupWithServer = async (backupName: string, backupData: any): Promise<boolean> => {
  try {
    // Sende Backup an den Server zur Speicherung in der Datenbank
    const response = await fetch(`${SERVER_BACKUP_PREFIX}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: backupName,
        data: backupData,
        timestamp: new Date().toISOString()
      }),
    });
    
    if (response.ok) {
      console.log('✅ Backup wurde erfolgreich mit dem Server synchronisiert');
      return true;
    } else {
      console.error('❌ Server-Synchronisierung des Backups fehlgeschlagen:', 
                    await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler bei der Backup-Synchronisierung mit dem Server:', error);
    return false;
  }
};

// Create a backup of all important data before major app changes
export const createDataBackup = async (): Promise<string> => {
  try {
    // Get all data that needs to be backed up
    const backupData = {
      currentUser: localStorage.getItem(STORAGE_KEY),
      users: localStorage.getItem(USERS_STORAGE_KEY),
      // Add more important data as needed
      posts: localStorage.getItem('fitness-app-posts'),
      challenges: localStorage.getItem('fitness-app-challenges'),
      dailyGoals: localStorage.getItem('fitness-app-daily-goals'),
      challengeParticipants: localStorage.getItem('fitness-app-challenge-participants'),
      // Events und Produkte hinzufügen
      events: localStorage.getItem('fitness-app-events'),
      eventParticipants: localStorage.getItem('fitness-app-event-participants'),
      products: localStorage.getItem('fitness-app-products'),
      orders: localStorage.getItem('fitness-app-orders'),
      // Gruppen hinzufügen
      groups: localStorage.getItem('fitness-app-groups'),
      groupMembers: localStorage.getItem('fitness-app-group-members'),
      timestamp: new Date().toISOString(),
      device: navigator.userAgent, // Hilft bei der Identifizierung des Geräts
      isAdmin: true // Zeigt an, dass dieses Backup von einem Admin erstellt wurde
    };

    // Create a backup name with timestamp
    const backupName = `${BACKUP_PREFIX}-${formatTimestamp()}`;
    
    // Save the backup locally first
    localStorage.setItem(backupName, JSON.stringify(backupData));
    
    // Versuche, das Backup mit dem Server zu synchronisieren
    await syncBackupWithServer(backupName, backupData);
    
    // Clean up old backups if we have too many
    cleanupOldBackups();
    
    console.log(`✅ Backup erfolgreich erstellt: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Backups:', error);
    return '';
  }
};

// Hilfsfunktion: Holt ein Backup vom Server
const fetchBackupFromServer = async (backupName: string): Promise<any> => {
  try {
    // Extrahiere nur den Namen ohne Präfix, wenn vorhanden
    const cleanName = backupName.startsWith(BACKUP_PREFIX) 
      ? backupName 
      : backupName.replace(`${BACKUP_PREFIX}-`, '');
      
    const response = await fetch(`${SERVER_BACKUP_PREFIX}/${encodeURIComponent(cleanName)}`);
    
    if (response.ok) {
      const serverBackup = await response.json();
      console.log('✅ Backup vom Server geladen');
      return serverBackup.data;
    } else {
      console.error('❌ Fehler beim Laden des Backups vom Server:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Netzwerkfehler beim Abrufen des Backups vom Server:', error);
    return null;
  }
};

// Restore a specific backup
export const restoreBackup = async (backupName: string): Promise<boolean> => {
  try {
    // Versuche zunächst, das Backup lokal zu laden
    let backupDataStr = localStorage.getItem(backupName);
    let backupData: any = null;
    
    if (backupDataStr) {
      // Lokales Backup gefunden
      backupData = JSON.parse(backupDataStr);
      console.log('📦 Lokales Backup gefunden');
    } else {
      // Versuche, das Backup vom Server zu laden
      console.log('🔄 Kein lokales Backup gefunden, versuche vom Server zu laden');
      backupData = await fetchBackupFromServer(backupName);
      
      if (!backupData) {
        console.error(`Backup ${backupName} weder lokal noch auf dem Server gefunden!`);
        return false;
      }
    }
    
    // Restore all backed up data
    if (backupData.currentUser) localStorage.setItem(STORAGE_KEY, backupData.currentUser);
    if (backupData.users) localStorage.setItem(USERS_STORAGE_KEY, backupData.users);
    if (backupData.posts) localStorage.setItem('fitness-app-posts', backupData.posts);
    if (backupData.challenges) localStorage.setItem('fitness-app-challenges', backupData.challenges);
    if (backupData.dailyGoals) localStorage.setItem('fitness-app-daily-goals', backupData.dailyGoals);
    if (backupData.challengeParticipants) localStorage.setItem('fitness-app-challenge-participants', backupData.challengeParticipants);
    
    // Events und Produkte wiederherstellen
    if (backupData.events) localStorage.setItem('fitness-app-events', backupData.events);
    if (backupData.eventParticipants) localStorage.setItem('fitness-app-event-participants', backupData.eventParticipants);
    if (backupData.products) localStorage.setItem('fitness-app-products', backupData.products);
    if (backupData.orders) localStorage.setItem('fitness-app-orders', backupData.orders);
    
    // Gruppen wiederherstellen
    if (backupData.groups) localStorage.setItem('fitness-app-groups', backupData.groups);
    if (backupData.groupMembers) localStorage.setItem('fitness-app-group-members', backupData.groupMembers);
    
    // Speicher das Backup auch lokal, wenn es vom Server kam
    if (!backupDataStr && backupData) {
      localStorage.setItem(backupName, JSON.stringify(backupData));
    }
    
    console.log(`✅ Backup erfolgreich wiederhergestellt: ${backupName}`);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Wiederherstellen des Backups:', error);
    return false;
  }
};

// Typ-Definitionen für Backups
type BackupInfo = {
  name: string;
  timestamp: string;
  isLocalBackup?: boolean;
  isServerBackup?: boolean;
};

// Hilfsfunktion zum Abrufen der Server-Backups mit Retry-Mechanismus
const getServerBackups = async (): Promise<BackupInfo[]> => {
  // Maximale Anzahl an Versuchen und Anfangsverzögerung
  const maxRetries = 3;
  const initialDelay = 500; // ms
  
  // Retry-Funktion mit exponentieller Verzögerung
  const retryFetch = async (retries: number): Promise<BackupInfo[]> => {
    try {
      const response = await fetch(`${SERVER_BACKUP_PREFIX}/list`, {
        // Cache-Header hinzufügen, um sicherzustellen, dass wir immer neue Daten erhalten
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const serverBackups = await response.json();
        console.log('✅ Server-Backups erfolgreich geladen:', serverBackups.length, 'Backups gefunden');
        
        // Formatiere und gib die Backup-Informationen zurück
        return serverBackups.map((backup: any) => ({
          name: backup.name,
          timestamp: backup.timestamp,
          isServerBackup: true // Markiere als Server-Backup
        }));
      } else {
        const errorText = await response.text();
        console.error('❌ Fehler beim Laden der Server-Backups:', errorText);
        
        // Wenn wir noch Versuche übrig haben, versuche es erneut
        if (retries > 0) {
          const delay = initialDelay * Math.pow(2, maxRetries - retries);
          console.log(`🔄 Wiederhole Server-Backup-Abruf in ${delay}ms... (${retries} Versuche übrig)`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryFetch(retries - 1);
        } else {
          return [];
        }
      }
    } catch (error) {
      console.error('❌ Netzwerkfehler beim Abrufen der Server-Backups:', error);
      
      // Wenn wir noch Versuche übrig haben, versuche es erneut
      if (retries > 0) {
        const delay = initialDelay * Math.pow(2, maxRetries - retries);
        console.log(`🔄 Wiederhole Server-Backup-Abruf in ${delay}ms... (${retries} Versuche übrig)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryFetch(retries - 1);
      } else {
        return [];
      }
    }
  };
  
  // Starte den ersten Versuch
  return retryFetch(maxRetries);
};

// Holt lokale Backups aus dem localStorage
const getLocalBackups = (): BackupInfo[] => {
  const backups: BackupInfo[] = [];
  
  // Loop through all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(BACKUP_PREFIX)) {
      try {
        const backupDataStr = localStorage.getItem(key);
        if (backupDataStr) {
          const backupData = JSON.parse(backupDataStr);
          backups.push({
            name: key, 
            timestamp: backupData.timestamp || 'Unbekanntes Datum',
            isLocalBackup: true // Markiere als lokales Backup
          });
        }
      } catch (error) {
        console.warn(`Fehler beim Lesen des Backups ${key}:`, error);
      }
    }
  }
  
  return backups;
};

// Funktion zum Entfernen von Mock-Backups oder nicht synchronisierten Backups
const cleanupUnsyncedBackups = async (serverBackups: BackupInfo[]): Promise<void> => {
  // Hole alle lokalen Backups
  const localBackups = getLocalBackups();
  
  // Finde lokale Backups, die nicht auf dem Server existieren
  const unsyncedBackups = localBackups.filter(localBackup => 
    !serverBackups.some(serverBackup => serverBackup.name === localBackup.name)
  );
  
  // Lösche nicht synchronisierte Backups
  if (unsyncedBackups.length > 0) {
    console.log(`🧹 Entferne ${unsyncedBackups.length} nicht synchronisierte lokale Backup(s)...`);
    
    for (const backup of unsyncedBackups) {
      localStorage.removeItem(backup.name);
      console.log(`🗑️ Nicht synchronisiertes lokales Backup entfernt: ${backup.name}`);
    }
  }
};

// Get list of all available backups (local und remote)
export const getAvailableBackups = async (): Promise<BackupInfo[]> => {
  // Server-Backups holen (asynchron)
  let serverBackups: BackupInfo[] = [];
  try {
    serverBackups = await getServerBackups();
    
    // Bereinige nicht synchronisierte Backups
    await cleanupUnsyncedBackups(serverBackups);
  } catch (error) {
    console.error('Fehler beim Abrufen der Server-Backups:', error);
  }
  
  // Lokale Backups holen (nach der Bereinigung)
  const localBackups = getLocalBackups();
  
  // Beide Listen zusammenführen und Duplikate entfernen
  // Wenn ein Backup sowohl lokal als auch auf dem Server existiert, bevorzugen wir die lokale Version
  const allBackups = [...localBackups];
  
  // Füge nur Server-Backups hinzu, die nicht bereits lokal vorhanden sind
  for (const serverBackup of serverBackups) {
    if (!localBackups.some(local => local.name === serverBackup.name)) {
      allBackups.push(serverBackup);
    }
  }
  
  // Sort by newest first
  return allBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Remove old backups if we have too many
const cleanupOldBackups = async (): Promise<void> => {
  try {
    // Nur lokale Backups für die Bereinigung berücksichtigen
    const localBackups = getLocalBackups();
    
    if (localBackups.length > MAX_BACKUPS) {
      // Remove oldest backups that exceed the limit
      for (let i = MAX_BACKUPS; i < localBackups.length; i++) {
        localStorage.removeItem(localBackups[i].name);
        console.log(`🗑️ Altes Backup entfernt: ${localBackups[i].name}`);
      }
    }
  } catch (error) {
    console.error('Fehler bei der Backup-Bereinigung:', error);
  }
};

// Create an automatic backup before app updates
export const scheduleAutoBackup = async (): Promise<void> => {
  // Create a backup immediately
  await createDataBackup();
  
  // Schedule regular backups (daily)
  const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
  setInterval(async () => {
    await createDataBackup();
  }, backupInterval);
  
  // Backup when the user is about to close the app
  window.addEventListener('beforeunload', () => {
    // Wir können hier nicht auf das Promise warten, daher nur aufrufen
    createDataBackup();
  });
  
  console.log('🔄 Automatische Backups aktiviert');
};

// Create a handler for the Admin panel to manage backups
export const adminCreateBackup = async (): Promise<string> => {
  return await createDataBackup();
};

export const adminRestoreBackup = async (backupName: string): Promise<boolean> => {
  return await restoreBackup(backupName);
};

export const adminViewBackups = async (): Promise<BackupInfo[]> => {
  return await getAvailableBackups();
};

// Löscht ein Backup lokal und auf dem Server
export const adminDeleteBackup = async (backupName: string): Promise<boolean> => {
  let success = true;
  
  // Lokal löschen
  try {
    localStorage.removeItem(backupName);
    console.log(`🗑️ Lokales Backup gelöscht: ${backupName}`);
  } catch (error) {
    console.error(`❌ Fehler beim Löschen des lokalen Backups ${backupName}:`, error);
    success = false;
  }
  
  // Auf dem Server löschen
  try {
    const response = await fetch(`${SERVER_BACKUP_PREFIX}/${encodeURIComponent(backupName)}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      console.log(`🗑️ Server-Backup gelöscht: ${backupName}`);
    } else {
      console.warn(`⚠️ Server-Backup ${backupName} konnte nicht gelöscht werden:`, await response.text());
      // Wir betrachten es trotzdem als Erfolg, wenn das lokale Backup gelöscht wurde
    }
  } catch (error) {
    console.warn(`⚠️ Netzwerkfehler beim Löschen des Server-Backups ${backupName}:`, error);
    // Wir betrachten es trotzdem als Erfolg, wenn das lokale Backup gelöscht wurde
  }
  
  return success;
};