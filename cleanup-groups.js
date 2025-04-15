const fs = require('fs');
const path = require('path');

// Funktion zum Löschen aller Gruppen mit ID >= 5
async function deleteExcessGroups() {
  try {
    // Gruppen laden
    const groupsPath = path.join(__dirname, 'server', 'data', 'groups.json');
    let groups = [];
    
    if (fs.existsSync(groupsPath)) {
      const data = fs.readFileSync(groupsPath, 'utf8');
      groups = JSON.parse(data);
    }
    
    console.log(`Vorher: ${groups.length} Gruppen gefunden`);
    console.log("Gruppen-IDs:", groups.map(g => `${g.id} - ${g.name}`).join(', '));
    
    // Gruppen filtern, nur IDs < 5 behalten
    const filteredGroups = groups.filter(group => typeof group.id === 'number' && group.id < 5);
    
    console.log(`Nachher: ${filteredGroups.length} Gruppen behalten`);
    console.log("Beibehaltene Gruppen-IDs:", filteredGroups.map(g => `${g.id} - ${g.name}`).join(', '));
    
    // Zurückschreiben
    fs.writeFileSync(groupsPath, JSON.stringify(filteredGroups, null, 2));
    
    // Gruppenbereinigung auch in den group-ids.json vornehmen
    const groupIdsPath = path.join(__dirname, 'server', 'data', 'group-ids.json');
    let groupIds = {};
    
    if (fs.existsSync(groupIdsPath)) {
      const idData = fs.readFileSync(groupIdsPath, 'utf8');
      groupIds = JSON.parse(idData);
    }
    
    console.log("Vorher - Gruppe-Chat-Zuordnungen:", Object.keys(groupIds).length);
    
    // Neue Gruppen-IDs-Zuordnung erstellen, nur die ersten 4 behalten
    const newGroupIds = {};
    const preservedKeys = ['1', '2', '3', '4'];
    
    for (const key of preservedKeys) {
      if (groupIds[key]) {
        newGroupIds[key] = groupIds[key];
      }
    }
    
    console.log("Nachher - Gruppe-Chat-Zuordnungen:", Object.keys(newGroupIds).length);
    
    // Zurückschreiben
    fs.writeFileSync(groupIdsPath, JSON.stringify(newGroupIds, null, 2));
    
    console.log("Gruppen und Gruppen-IDs-Zuordnungen erfolgreich bereinigt!");
    
    // Bereinigen Sie auch die Chat-Daten (optional)
    const chatsPath = path.join(__dirname, 'server', 'data', 'chats.json');
    let chats = {};
    
    if (fs.existsSync(chatsPath)) {
      const chatData = fs.readFileSync(chatsPath, 'utf8');
      chats = JSON.parse(chatData);
    }
    
    // Wir behalten nur Chats, die zu den ersten 4 Gruppen gehören
    const validChatIds = Object.values(newGroupIds);
    const newChats = {};
    
    for (const chatId in chats) {
      if (validChatIds.includes(chatId) || chatId.startsWith('user-')) {
        newChats[chatId] = chats[chatId];
      }
    }
    
    console.log(`Chats: ${Object.keys(chats).length} -> ${Object.keys(newChats).length}`);
    
    fs.writeFileSync(chatsPath, JSON.stringify(newChats, null, 2));
    
    return { success: true, message: "Bereinigung abgeschlossen" };
  } catch (error) {
    console.error("Fehler bei der Bereinigung:", error);
    return { success: false, error: error.message };
  }
}

// Funktion ausführen
deleteExcessGroups()
  .then(result => {
    console.log("Ergebnis:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Fehler:", err);
    process.exit(1);
  });