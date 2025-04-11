import { STORAGE_KEY, USERS_STORAGE_KEY } from "../contexts/UserContext";

// Constants for backup
const BACKUP_PREFIX = 'fitness-app-backup';
const MAX_BACKUPS = 5;

// Timestamp formatter for readable backup names
const formatTimestamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
};

// Create a backup of all important data before major app changes
export const createDataBackup = (): string => {
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
      timestamp: new Date().toISOString()
    };

    // Create a backup name with timestamp
    const backupName = `${BACKUP_PREFIX}-${formatTimestamp()}`;
    
    // Save the backup
    localStorage.setItem(backupName, JSON.stringify(backupData));
    
    // Clean up old backups if we have too many
    cleanupOldBackups();
    
    console.log(`✅ Backup erfolgreich erstellt: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Backups:', error);
    return '';
  }
};

// Restore a specific backup
export const restoreBackup = (backupName: string): boolean => {
  try {
    const backupDataStr = localStorage.getItem(backupName);
    if (!backupDataStr) {
      console.error(`Backup ${backupName} nicht gefunden!`);
      return false;
    }
    
    const backupData = JSON.parse(backupDataStr);
    
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
    
    console.log(`✅ Backup erfolgreich wiederhergestellt: ${backupName}`);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Wiederherstellen des Backups:', error);
    return false;
  }
};

// Get list of all available backups
export const getAvailableBackups = (): {name: string, timestamp: string}[] => {
  const backups: {name: string, timestamp: string}[] = [];
  
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
            timestamp: backupData.timestamp || 'Unbekanntes Datum'
          });
        }
      } catch (error) {
        console.warn(`Fehler beim Lesen des Backups ${key}:`, error);
      }
    }
  }
  
  // Sort by newest first
  return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Remove old backups if we have too many
const cleanupOldBackups = (): void => {
  const backups = getAvailableBackups();
  
  if (backups.length > MAX_BACKUPS) {
    // Remove oldest backups that exceed the limit
    for (let i = MAX_BACKUPS; i < backups.length; i++) {
      localStorage.removeItem(backups[i].name);
      console.log(`🗑️ Altes Backup entfernt: ${backups[i].name}`);
    }
  }
};

// Create an automatic backup before app updates
export const scheduleAutoBackup = (): void => {
  // Create a backup immediately
  createDataBackup();
  
  // Schedule regular backups (daily)
  const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
  setInterval(createDataBackup, backupInterval);
  
  // Backup when the user is about to close the app
  window.addEventListener('beforeunload', () => {
    createDataBackup();
  });
  
  console.log('🔄 Automatische Backups aktiviert');
};

// Create a handler for the Admin panel to manage backups
export const adminCreateBackup = (): string => {
  return createDataBackup();
};

export const adminRestoreBackup = (backupName: string): boolean => {
  return restoreBackup(backupName);
};

export const adminViewBackups = (): {name: string, timestamp: string}[] => {
  return getAvailableBackups();
};

export const adminDeleteBackup = (backupName: string): boolean => {
  try {
    localStorage.removeItem(backupName);
    console.log(`🗑️ Backup gelöscht: ${backupName}`);
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Löschen des Backups ${backupName}:`, error);
    return false;
  }
};