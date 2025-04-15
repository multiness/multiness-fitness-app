import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';
import { Group as DbGroup, GroupMember } from '@shared/schema';

export interface GroupGoal {
  id: number;
  title: string;
  description?: string;
  target: number;
  unit: string;
  currentValue: number;
  endDate: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  image?: string;
  participantIds: number[];
  adminIds: number[];
  creatorId: number;
  createdAt: Date;
  isPrivate?: boolean;
  goals?: GroupGoal[];
}

type NewGroup = Omit<Group, 'id'>;

interface GroupStore {
  groups: Record<number, Group>;
  invitations: Record<number, number[]>; // groupId -> userId[]
  isLoading: boolean;
  lastFetched: number | null;
  
  // Database functions
  setGroups: (groups: DbGroup[], members: GroupMember[], mergeWithExisting?: boolean) => void;
  syncWithServer: (forceRefresh?: boolean) => Promise<void>;
  
  // Group functions
  addGroup: (group: NewGroup) => Promise<number>;
  updateGroup: (id: number, updatedGroup: Partial<Group>) => void;
  removeGroup: (id: number) => void;
  joinGroup: (groupId: number, userId: number) => void;
  leaveGroup: (groupId: number, userId: number) => void;
  inviteToGroup: (groupId: number, userId: number, inviterId: number) => void;
  acceptInvitation: (groupId: number, userId: number) => void;
  declineInvitation: (groupId: number, userId: number) => void;
  addGoal: (groupId: number, goal: GroupGoal) => void;
  updateGoalProgress: (groupId: number, goalId: number, newValue: number) => void;
  makeAdmin: (groupId: number, userId: number) => void;
  removeAdmin: (groupId: number, userId: number) => void;
  getGroupsForUser: (userId: number) => Group[];
  getUserInvitations: (userId: number) => number[];
  isGroupMember: (groupId: number, userId?: number) => boolean;
}

// Helper function to convert DB group to client group
const mapDbGroupToClientGroup = (dbGroup: DbGroup, members: GroupMember[] = []): Group => {
  // Extract members and admins
  const participantIds = members.map(m => m.userId);
  const adminIds = members.filter(m => m.role === 'admin').map(m => m.userId);
  
  // Make sure creator is a participant and admin
  if (dbGroup.creatorId && !participantIds.includes(dbGroup.creatorId)) {
    participantIds.push(dbGroup.creatorId);
  }
  
  if (dbGroup.creatorId && !adminIds.includes(dbGroup.creatorId)) {
    adminIds.push(dbGroup.creatorId);
  }
  
  // Ensure createdAt is a valid date
  let createdAt = new Date();
  try {
    createdAt = dbGroup.createdAt ? new Date(dbGroup.createdAt) : new Date();
  } catch (e) {
    console.error("Error parsing date:", e);
  }
  
  return {
    ...dbGroup,
    createdAt,
    participantIds,
    adminIds,
    goals: [] // Group goals will be implemented later
  } as Group;
};

// Initialize store with auto-loading from server
const initializeStore = persist<GroupStore>(
  (set, get) => {
    // Load from server immediately after initialization
    setTimeout(() => {
      const store = get();
      if (Object.keys(store.groups).length === 0) {
        console.log("Initializing group store and loading from server...");
        store.syncWithServer();
      }
    }, 100);

    return {
      isLoading: false,
      lastFetched: null,
      groups: {},
      invitations: {},
      
      addGroup: async (group: NewGroup) => {
        // Generierung einer UUID für die Gruppe zur Vermeidung von Kollisionen
        // Format: group-uuid-[timestamp]-[random]-[checksum]
        const timestamp = Date.now().toString(36).substring(2, 10);
        const random = Math.random().toString(36).substring(2, 10);
        const checksum = (
          parseInt(timestamp, 36) ^ 
          parseInt(random, 36)
        ).toString(16).substring(0, 8);
        
        const uuidTag = `group-uuid-${timestamp}-${random}-${checksum}`;
        console.log('Neue UUID für Gruppe generiert:', uuidTag);
        
        const tempId = Date.now();
        const newGroup = { ...group, id: tempId };
        
        // Lokale Gruppe aktualisieren für sofortige Anzeige
        set((state) => ({
          groups: {
            ...state.groups,
            [tempId]: newGroup
          }
        }));
        
        try {
          // Wir fügen ein Flag hinzu, das anzeigt, dass dies ein neuer Gruppentyp mit UUID ist
          const response = await apiRequest('POST', '/api/groups', {
            ...group,
            uuidTag: uuidTag
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Fehler beim Speichern der Gruppe auf dem Server:', errorText);
            
            // Entferne die temporäre Gruppe wieder
            set((state) => {
              const { [tempId]: _, ...restGroups } = state.groups;
              return {
                groups: restGroups
              };
            });
            
            throw new Error(`Server-Fehler: ${response.status} ${errorText}`);
          }
          
          // Erfolgsfall
          const savedGroup: DbGroup = await response.json();
          console.log('Gruppe erfolgreich auf Server gespeichert:', savedGroup);
          
          // Gruppe mit Server-ID aktualisieren und temporäre Gruppe entfernen
          set((state) => {
            const { [tempId]: _, ...restGroups } = state.groups;
            return {
              groups: {
                ...restGroups,
                [savedGroup.id]: mapDbGroupToClientGroup(savedGroup)
              }
            };
          });
          
          // Manuelles Update der Gruppen-IDs
          try {
            await get().syncWithServer();
          } catch (syncError) {
            console.error('Fehler bei der Synchronisierung nach Gruppenerstellung:', syncError);
          }
          
          // Gib die neue, permanente ID zurück
          return savedGroup.id;
          
        } catch (error) {
          console.error('Fehler beim Erstellen der Gruppe:', error);
          
          // Entferne die temporäre Gruppe im Fehlerfall
          set((state) => {
            const { [tempId]: _, ...restGroups } = state.groups;
            return {
              groups: restGroups
            };
          });
          
          // Fehler weitergeben, damit die Komponente darauf reagieren kann
          throw error;
        }
      },
      
      updateGroup: async (id, updatedGroup) => {
        try {
          // Optimistisches Update lokal anwenden
          set((state) => ({
            groups: {
              ...state.groups,
              [id]: { ...state.groups[id], ...updatedGroup }
            }
          }));
          
          // An Server senden
          const response = await apiRequest('PATCH', `/api/groups/${id}`, updatedGroup);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fehler beim Aktualisieren der Gruppe: ${errorText}`);
            throw new Error(`Server-Fehler: ${response.status} ${errorText}`);
          }

          const updatedGroupFromServer: DbGroup = await response.json();
          
          // Server-Antwort in den Store aktualisieren
          set((state) => ({
            groups: {
              ...state.groups,
              [id]: mapDbGroupToClientGroup(updatedGroupFromServer)
            }
          }));
          
          // WebSocket-Broadcast wird vom Server ausgelöst
          return updatedGroupFromServer;
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Gruppe:', error);
          throw error;
        }
      },
      
      removeGroup: async (id) => {
        try {
          // Prüfen, ob die Gruppe existiert, bevor wir versuchen, sie zu löschen
          const group = get().groups[id];
          if (!group) {
            throw new Error(`Gruppe mit ID ${id} existiert nicht und kann nicht gelöscht werden.`);
          }

          // Optimistisches Update lokal anwenden
          set((state) => {
            const { [id]: _, ...restGroups } = state.groups;
            return { groups: restGroups };
          });
          
          // Zusätzlich auch Gruppen-ID aus dem Speicher markieren
          try {
            await apiRequest('DELETE', `/api/group-ids/${id}`);
          } catch (groupIdError) {
            console.error(`Fehler beim Markieren der Gruppen-ID als gelöscht: ${groupIdError}`);
            // Kein Abbruch, wir versuchen trotzdem, die Gruppe zu löschen
          }
          
          // An Server senden
          const response = await apiRequest('DELETE', `/api/groups/${id}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fehler beim Löschen der Gruppe: ${errorText}`);
            
            // Versuche, die Gruppendaten wiederherzustellen, indem wir sie vom Server neu laden
            await get().syncWithServer();
            
            throw new Error(`Server-Fehler: ${response.status} ${errorText}`);
          }
          
          // Erfolgreich gelöscht - Daten aktualisieren
          console.debug(`Gruppe ${id} erfolgreich gelöscht`);
          
          // Manuelles Update der Gruppen-IDs und andere Server-Daten
          await get().syncWithServer();
          
        } catch (error) {
          console.error('Fehler beim Löschen der Gruppe:', error);
          throw error;
        }
      },
      
      joinGroup: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              participantIds: group.participantIds.includes(userId)
                ? group.participantIds
                : [...group.participantIds, userId]
            }
          }
        };
      }),
      
      leaveGroup: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              participantIds: group.participantIds.filter(id => id !== userId),
              adminIds: group.adminIds.filter(id => id !== userId)
            }
          }
        };
      }),
      
      inviteToGroup: (groupId, userId, inviterId) => {
        set((state) => {
          const currentInvitations = state.invitations[groupId] || [];
          
          // Only invite if not already invited
          if (currentInvitations.includes(userId)) {
            return state;
          }
          
          const group = state.groups[groupId];
          // Don't invite if user is already in the group
          if (group && group.participantIds.includes(userId)) {
            return state;
          }
          
          const newInvitations = {
            ...state.invitations,
            [groupId]: [...currentInvitations, userId]
          };
          
          return { invitations: newInvitations };
        });
        
        // Delayed notification to avoid circular dependencies
        setTimeout(() => {
          import('../contexts/UserContext').then(module => {
            const users = module.useUsers().getAllUsers();
            const group = get().groups[groupId];
            
            if (group) {
              const inviter = users.find((u: {id: number}) => u.id === inviterId);
              const invitedUser = users.find((u: {id: number}) => u.id === userId);
              
              if (inviter && invitedUser) {
                // Implement notification here later
                console.log('Group invitation:', {
                  userId: invitedUser.id,
                  groupId: group.id,
                  groupName: group.name,
                  inviterName: inviter.username || inviter.name || "A member"
                });
              }
            }
          });
        }, 0);
      },
      
      acceptInvitation: (groupId, userId) => set((state) => {
        const invitations = state.invitations[groupId] || [];
        
        // If user wasn't invited, do nothing
        if (!invitations.includes(userId)) {
          return state;
        }
        
        // Remove invitation and add user to group
        const group = state.groups[groupId];
        if (!group) return state;
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              participantIds: [...group.participantIds, userId]
            }
          },
          invitations: {
            ...state.invitations,
            [groupId]: invitations.filter(id => id !== userId)
          }
        };
      }),
      
      declineInvitation: (groupId, userId) => set((state) => {
        const invitations = state.invitations[groupId] || [];
        
        // If user wasn't invited, do nothing
        if (!invitations.includes(userId)) {
          return state;
        }
        
        return {
          invitations: {
            ...state.invitations,
            [groupId]: invitations.filter(id => id !== userId)
          }
        };
      }),
      
      addGoal: (groupId, goal) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              goals: [...(group.goals || []), goal]
            }
          }
        };
      }),
      
      updateGoalProgress: (groupId, goalId, newValue) => set((state) => {
        const group = state.groups[groupId];
        if (!group || !group.goals) return state;
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              goals: group.goals.map(goal => 
                goal.id === goalId
                  ? { 
                      ...goal, 
                      currentValue: goal.currentValue + newValue,
                      completedAt: goal.currentValue + newValue >= goal.target 
                        ? new Date() 
                        : goal.completedAt
                    }
                  : goal
              )
            }
          }
        };
      }),
      
      makeAdmin: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        
        // Only add if user is not already an admin
        if (group.adminIds.includes(userId)) {
          return state;
        }
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              adminIds: [...group.adminIds, userId]
            }
          }
        };
      }),
      
      removeAdmin: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        
        // Don't remove the creator as admin
        if (userId === group.creatorId) {
          return state;
        }
        
        return {
          groups: {
            ...state.groups,
            [groupId]: {
              ...group,
              adminIds: group.adminIds.filter(id => id !== userId)
            }
          }
        };
      }),
      
      getGroupsForUser: (userId) => {
        const groups = Object.values(get().groups);
        return groups.filter(group => 
          group.participantIds.includes(userId) || group.creatorId === userId
        );
      },
      
      getUserInvitations: (userId) => {
        const invitations = get().invitations;
        return Object.entries(invitations)
          .filter(([_, userIds]) => userIds.includes(userId))
          .map(([groupId]) => parseInt(groupId, 10));
      },
      
      setGroups: (dbGroups, members, mergeWithExisting = true) => {
        // Bei mergeWithExisting=true behalten wir vorhandene Gruppen bei und aktualisieren nur
        // Bei mergeWithExisting=false ersetzen wir alle Gruppen (wie bisher)
        
        // Vorhandene Gruppen als Basis nehmen, wenn gewünscht
        const existingGroups = mergeWithExisting ? get().groups : {};
        const groupsRecord: Record<number, Group> = { ...existingGroups };
        
        console.log(`Aktualisiere ${dbGroups.length} Gruppen, Merge-Modus: ${mergeWithExisting}`);
        
        // Convert data to client format und in den Store integrieren
        dbGroups.forEach(dbGroup => {
          // Find all members for this group
          const groupMembers = members.filter(m => m.groupId === dbGroup.id);
          const clientGroup = mapDbGroupToClientGroup(dbGroup, groupMembers);
          groupsRecord[dbGroup.id] = clientGroup;
        });
        
        set({ 
          groups: groupsRecord,
          lastFetched: Date.now(),
          isLoading: false // Immer isLoading zurücksetzen
        });
        
        // Logs für Debugging
        console.debug(`Groups synchronized: ${Object.keys(groupsRecord).length} groups loaded`);
      },
      
      syncWithServer: async (forceRefresh = false) => {
        try {
          // Prüfe, ob wir bereits Daten laden - vermeide doppelte Ladungen
          // Wenn forceRefresh=true, dann laden wir trotzdem neu
          if (get().isLoading && !forceRefresh) {
            console.debug('Gruppen werden bereits geladen, überspringe diese Anfrage');
            return;
          }
          
          // Setze Loading-State
          set({ isLoading: true });
          
          // Cache-Header für schnelleres Laden (deaktivieren bei erzwungener Aktualisierung)
          const cacheOptions = forceRefresh ? 
            { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } } :
            { headers: { 'Cache-Control': 'max-age=60' } };
          
          // Optimierte Parallelisierung der Anfragen
          const [groupsResponse, lastFetchTimestamp] = await Promise.all([
            fetch('/api/groups', cacheOptions),
            Promise.resolve(get().lastFetched)
          ]);
          
          // Wenn kürzlich erst abgefragt, verzögere nächste Anfrage (außer bei erzwungener Aktualisierung)
          const now = Date.now();
          const timeSinceLastFetch = lastFetchTimestamp ? now - lastFetchTimestamp : Infinity;
          // Zeit zwischen Anfragen reduzieren, um schnellere Aktualisierungen zu ermöglichen
          const MIN_FETCH_INTERVAL = 2000; // 2 Sekunden
          
          if (timeSinceLastFetch < MIN_FETCH_INTERVAL && !forceRefresh) {
            console.debug(`Letzte Gruppenabfrage vor ${timeSinceLastFetch}ms, aber wir fahren fort...`);
            // Trotzdem mit dem Laden weitermachen, anstatt komplett abzubrechen
          }
          
          if (!groupsResponse.ok) {
            throw new Error(`Server responded with ${groupsResponse.status}: ${groupsResponse.statusText}`);
          }
          
          const dbGroups = await groupsResponse.json();
          
          // Nur Gruppen laden, die geändert wurden oder neu sind
          const existingGroups = get().groups;
          
          // Optimierte Strategie für das Laden von Mitgliedern
          // Zuerst priorisierte Gruppen laden (mit ID 1-5), dann die restlichen
          const priorityGroups = dbGroups.filter((g: any) => typeof g.id === 'number' && g.id <= 5);
          const otherGroups = dbGroups.filter((g: any) => !(typeof g.id === 'number' && g.id <= 5));
          
          console.log("Lade Gruppen in zwei Phasen: Priorität", priorityGroups.length, "Andere", otherGroups.length);
          
          // Lade zuerst die priorisierten Gruppen
          const priorityPromises = priorityGroups.map(async (dbGroup: any) => {
            try {
              // Kürzerer Timeout für prioritäre Gruppen
              const controller = new AbortController();
              const signal = controller.signal;
              const timeout = setTimeout(() => controller.abort(), 3000); // 3 Sekunden Timeout
              
              const membersOptions = {
                ...cacheOptions,
                signal,
              };
              
              const membersResponse = await fetch(`/api/groups/${dbGroup.id}/members`, membersOptions);
              clearTimeout(timeout);
              
              if (membersResponse.ok) {
                const groupMembers = await membersResponse.json();
                console.log(`Prioritäre Gruppe ${dbGroup.id} geladen mit ${groupMembers.length} Mitgliedern`);
                return { groupId: dbGroup.id, members: groupMembers };
              } else {
                console.warn(`Could not load members for priority group ${dbGroup.id}: ${membersResponse.status}`);
                return { groupId: dbGroup.id, members: [] };
              }
            } catch (memberError) {
              console.error(`Error fetching members for priority group ${dbGroup.id}:`, memberError);
              return { groupId: dbGroup.id, members: [] };
            }
          });
          
          // Lade zuerst die priorisierten Gruppen und aktualisiere den Store
          const priorityResults = await Promise.all(priorityPromises);
          
          // Sammle die priorisierten Mitglieder
          const priorityMembers: GroupMember[] = [];
          priorityResults.forEach(result => {
            console.debug(`Priority group members loaded for group ${result.groupId}: ${result.members.length}`);
            priorityMembers.push(...result.members);
          });
          
          // Update the store mit den priorisierten Gruppen zuerst
          get().setGroups(priorityGroups, priorityMembers);
          
          // Dann die anderen Gruppen laden
          const otherPromises = otherGroups.map(async (dbGroup: any) => {
            try {
              const controller = new AbortController();
              const signal = controller.signal;
              const timeout = setTimeout(() => controller.abort(), 5000);
              
              const membersOptions = {
                ...cacheOptions,
                signal,
              };
              
              const membersResponse = await fetch(`/api/groups/${dbGroup.id}/members`, membersOptions);
              clearTimeout(timeout);
              
              if (membersResponse.ok) {
                const groupMembers = await membersResponse.json();
                return { groupId: dbGroup.id, members: groupMembers };
              } else {
                console.warn(`Could not load members for other group ${dbGroup.id}: ${membersResponse.status}`);
                return { groupId: dbGroup.id, members: [] };
              }
            } catch (memberError) {
              console.error(`Error fetching members for other group ${dbGroup.id}:`, memberError);
              return { groupId: dbGroup.id, members: [] };
            }
          });
          
          // Lade die anderen Gruppen
          const otherResults = await Promise.all(otherPromises);
          
          // Sammle die anderen Mitglieder
          const otherMembers: GroupMember[] = [];
          otherResults.forEach(result => {
            console.debug(`Other group members loaded for group ${result.groupId}: ${result.members.length}`);
            otherMembers.push(...result.members);
          });
          
          // Kombiniere alle Gruppen und Mitglieder
          const allMembers = [...priorityMembers, ...otherMembers];
          
          // Alle Gruppen kombinieren 
          const allGroups = [...priorityGroups, ...otherGroups];
          
          // Update the store mit allen Gruppen
          get().setGroups(allGroups, allMembers);
          
          // WebSocket-Verbindung nur einmal aufbauen und wiederverwenden
          const setupWebSocket = async () => {
            try {
              // Globalen WebSocket-Store verwenden, wenn verfügbar
              interface WebSocketManager {
                socket: WebSocket;
                isConnected: () => boolean;
              }
              
              const wsManager = (window as any)['groupWebSocketManager'] as WebSocketManager | undefined;
              
              if (wsManager && wsManager.isConnected()) {
                console.debug('Bestehende WebSocket-Verbindung wiederverwendet');
                return;
              }
              
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `${protocol}//${window.location.host}/ws`;
              const socket = new WebSocket(wsUrl);
              
              // Globalen Manager speichern
              (window as any)['groupWebSocketManager'] = {
                socket,
                isConnected: () => socket && socket.readyState === WebSocket.OPEN
              };
              
              socket.onopen = () => {
                console.debug('WebSocket connection established for group synchronization');
                socket.send(JSON.stringify({ type: 'subscribe', topic: 'groups' }));
              };
              
              socket.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'group_update') {
                    // Stille Verarbeitung von WebSocket-Updates
                    console.debug('Group update received via WebSocket');
                    // Sanfte Aktualisierung mit Verzögerung
                    setTimeout(() => get().syncWithServer(), 500);
                  }
                } catch (parseError) {
                  console.error('Error processing WebSocket message:', parseError);
                }
              };
              
              socket.onerror = (error) => {
                console.error('WebSocket error in group synchronization:', error);
              };
              
              socket.onclose = () => {
                console.debug('WebSocket connection closed for groups');
                // Cleanup
                if ((window as any)['groupWebSocketManager']?.socket === socket) {
                  (window as any)['groupWebSocketManager'] = null;
                }
                // Try reconnecting after 5 seconds
                setTimeout(setupWebSocket, 5000);
              };
            } catch (wsError) {
              console.error('Error setting up WebSocket for groups:', wsError);
            }
          };
          
          // Initialize WebSocket connection
          setupWebSocket();
          
          set({ isLoading: false, lastFetched: Date.now() });
          // Stille Synchronisierung ohne Benachrichtigung
          console.debug(`Groups synchronized: ${dbGroups.length} groups loaded`);
          
        } catch (error) {
          console.error('Error synchronizing groups:', error);
          set({ isLoading: false });
        }
      },
      
      isGroupMember: (groupId, userId = 1) => {
        const group = get().groups[groupId];
        if (!group) return false;
        return group.participantIds.includes(userId) || group.creatorId === userId;
      }
    };
  },
  {
    name: 'group-store',
    version: 1
  }
);

export const useGroupStore = create(initializeStore);