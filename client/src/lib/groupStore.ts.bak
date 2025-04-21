import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';

// Typen aus dem shared schema
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

// Typen vom Server
interface DbGroup {
  id: number;
  name: string;
  description: string;
  image?: string;
  creatorId: number;
  createdAt: Date;
  isPrivate?: boolean;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: string;
  joinedAt: Date;
}

interface GroupStore {
  groups: Record<number, Group>;
  invitations: Record<number, number[]>; // groupId -> userId[]
  isLoading: boolean;
  lastFetched: number | null;
  
  // Database functions
  setGroups: (groups: DbGroup[], members: GroupMember[], mergeWithExisting?: boolean) => void;
  syncWithServer: (forceRefresh?: boolean) => Promise<void>;
  resetGroupIds: () => Promise<any>; // Neue Funktion zum Zurücksetzen der Gruppen-IDs
  
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
  isGroupAdmin: (groupId: number, userId?: number) => boolean; // Neue Funktion zum Prüfen von Admin-Rechten
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
  
  return {
    ...dbGroup,
    participantIds,
    adminIds
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
        try {
          // Generierung einer UUID für die Gruppe zur Vermeidung von Kollisionen
          // Format: group-uuid-[timestamp]-[random]-[checksum]
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 10);
          const checksum = (
            parseInt(timestamp, 36) ^ 
            parseInt(random, 36)
          ).toString(16).substring(0, 8);
          
          const uuidTag = `group-uuid-${timestamp.substring(2, 10)}-${random}-${checksum}`;
          console.log('Neue UUID für Gruppe generiert:', uuidTag);
          
          // Konvertiere die Daten für das Optimistic UI Update
          const tempId = Date.now();
          const participantIds = group.participantIds || [1]; // Standard: aktueller Benutzer (1)
          const newGroup = { 
            ...group, 
            id: tempId, 
            participantIds,
            createdAt: new Date(),
            creatorId: 1
          };
          
          // Optimistic UI Update
          console.log('Gruppe wird optimistisch hinzugefügt:', newGroup);
          set(state => ({
            groups: {
              ...state.groups,
              [tempId]: newGroup
            }
          }));
          
          // Senden an Backend
          const groupData = {
            ...group,
            id: null, // Wird vom Server generiert
            uuid: uuidTag // Zusätzliches Feld
          };
          
          console.log('Gruppe wird an Server gesendet:', groupData);
          const response = await apiRequest('POST', '/api/groups', groupData);
          const savedGroup: DbGroup = await response.json();
          
          console.log('Gruppe vom Server erhalten:', savedGroup);
          
          // Entferne temporäre Gruppe und füge die gespeicherte Gruppe hinzu
          set(state => {
            const { [tempId]: removeTemp, ...restGroups } = state.groups;
            return {
              groups: {
                ...restGroups,
                [savedGroup.id]: mapDbGroupToClientGroup(savedGroup, [{
                  id: tempId,
                  groupId: savedGroup.id,
                  userId: 1, // Current user
                  role: 'admin',
                  joinedAt: new Date()
                }])
              }
            };
          });
          
          return savedGroup.id;
        } catch (error) {
          console.error('Fehler beim Erstellen der Gruppe:', error);
          // Entferne temporäre Gruppe bei Fehler
          set(state => {
            const { [Date.now()]: removeTemp, ...restGroups } = state.groups;
            return { groups: restGroups };
          });
          throw error;
        }
      },
      
      updateGroup: async (groupId, updatedGroup) => {
        try {
          // Optimistic UI update
          set(state => ({
            groups: {
              ...state.groups,
              [groupId]: {
                ...state.groups[groupId],
                ...updatedGroup
              }
            }
          }));
          
          // Senden an Backend
          const response = await apiRequest('PATCH', `/api/groups/${groupId}`, updatedGroup);
          const updatedGroupFromServer: DbGroup = await response.json();
          
          // Update mit Serverdaten für Konsistenz
          set(state => ({
            groups: {
              ...state.groups,
              [groupId]: mapDbGroupToClientGroup(updatedGroupFromServer, 
                state.groups[groupId].participantIds.map(userId => ({
                  id: Math.random(), // Dummy ID
                  groupId,
                  userId,
                  role: state.groups[groupId].adminIds.includes(userId) ? 'admin' : 'member',
                  joinedAt: new Date()
                }))
              )
            }
          }));
          
          return updatedGroupFromServer;
        } catch (error) {
          console.error(`Fehler beim Aktualisieren der Gruppe ${groupId}:`, error);
          // Rollback bei Fehler
          await get().syncWithServer();
          throw error;
        }
      },
      
      removeGroup: (groupId) => {
        set(state => {
          const { [groupId]: removed, ...rest } = state.groups;
          return { groups: rest };
        });
      },
      
      joinGroup: (groupId, userId = 1) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              participantIds: [...(state.groups[groupId]?.participantIds || []), userId]
            }
          }
        }));
      },
      
      leaveGroup: (groupId, userId = 1) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              participantIds: state.groups[groupId].participantIds.filter(id => id !== userId),
              adminIds: state.groups[groupId].adminIds.filter(id => id !== userId)
            }
          }
        }));
      },
      
      inviteToGroup: (groupId, userId, inviterId = 1) => {
        set(state => ({
          invitations: {
            ...state.invitations,
            [groupId]: [...(state.invitations[groupId] || []), userId]
          }
        }));
      },
      
      acceptInvitation: (groupId, userId = 1) => {
        get().joinGroup(groupId, userId);
        set(state => ({
          invitations: {
            ...state.invitations,
            [groupId]: (state.invitations[groupId] || []).filter(id => id !== userId)
          }
        }));
      },
      
      declineInvitation: (groupId, userId = 1) => {
        set(state => ({
          invitations: {
            ...state.invitations,
            [groupId]: (state.invitations[groupId] || []).filter(id => id !== userId)
          }
        }));
      },
      
      addGoal: (groupId, goal) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              goals: [...(state.groups[groupId].goals || []), goal]
            }
          }
        }));
      },
      
      updateGoalProgress: (groupId, goalId, newValue) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              goals: (state.groups[groupId].goals || []).map(goal => 
                goal.id === goalId 
                  ? { ...goal, currentValue: goal.currentValue + newValue }
                  : goal
              )
            }
          }
        }));
      },
      
      makeAdmin: (groupId, userId) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              adminIds: [...(state.groups[groupId].adminIds || []), userId]
            }
          }
        }));
      },
      
      removeAdmin: (groupId, userId) => {
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              adminIds: (state.groups[groupId].adminIds || []).filter(id => id !== userId)
            }
          }
        }));
      },
      
      getGroupsForUser: (userId = 1) => {
        return Object.values(get().groups).filter(group => 
          group.participantIds.includes(userId)
        );
      },
      
      getUserInvitations: (userId = 1) => {
        return Object.entries(get().invitations)
          .filter(([_, userIds]) => userIds.includes(userId))
          .map(([groupId]) => parseInt(groupId));
      },
      
      setGroups: (dbGroups, members, mergeWithExisting = false) => {
        const groupsByIdMap = new Map<number, DbGroup>();
        dbGroups.forEach(group => groupsByIdMap.set(group.id, group));
        
        const membersByGroupId = new Map<number, GroupMember[]>();
        members.forEach(member => {
          if (!membersByGroupId.has(member.groupId)) {
            membersByGroupId.set(member.groupId, []);
          }
          membersByGroupId.get(member.groupId)?.push(member);
        });
        
        const clientGroups: Record<number, Group> = {};
        
        groupsByIdMap.forEach((dbGroup, id) => {
          const groupMembers = membersByGroupId.get(id) || [];
          clientGroups[id] = mapDbGroupToClientGroup(dbGroup, groupMembers);
        });
        
        if (mergeWithExisting) {
          set(state => ({
            groups: {
              ...state.groups,
              ...clientGroups
            },
            lastFetched: Date.now()
          }));
        } else {
          set({ 
            groups: clientGroups,
            lastFetched: Date.now() 
          });
        }
      },
      
      syncWithServer: async (forceRefresh = false) => {
        try {
          const now = Date.now();
          const lastFetched = get().lastFetched;
          
          // Überprüfe, ob ein Refresh nötig ist (maximal alle 30 Sekunden)
          if (!forceRefresh && lastFetched && (now - lastFetched < 30000)) {
            console.log('Verwende zwischengespeicherte Gruppen');
            return;
          }
          
          set({ isLoading: true });
          
          // Lade Gruppen vom Server
          const groupsResponse = await apiRequest('GET', '/api/groups');
          const groups: DbGroup[] = await groupsResponse.json();
          
          // Lade Mitglieder für jede Gruppe
          const membersPromises = groups.map(async group => {
            const membersResponse = await apiRequest('GET', `/api/groups/${group.id}/members`);
            const members: GroupMember[] = await membersResponse.json();
            return { groupId: group.id, members };
          });
          
          const membersResults = await Promise.all(membersPromises);
          const allMembers: GroupMember[] = membersResults.flatMap(result => result.members);
          
          // Aktualisiere den Store
          get().setGroups(groups, allMembers);
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Error synchronizing groups:', error);
          set({ isLoading: false });
        }
      },
      
      resetGroupIds: async () => {
        try {
          const response = await apiRequest('POST', '/api/group-ids/reset');
          return await response.json();
        } catch (error) {
          console.error('Fehler beim Zurücksetzen der Gruppen-IDs:', error);
          throw error;
        }
      },
      
      isGroupMember: (groupId, userId = 1) => {
        const group = get().groups[groupId];
        if (!group) return false;
        return group.participantIds.includes(userId) || group.creatorId === userId;
      },
      
      isGroupAdmin: (groupId, userId = 1) => {
        const group = get().groups[groupId];
        if (!group) return false;
        // Ein Benutzer ist Admin, wenn er Ersteller ist oder in der adminIds-Liste steht
        return group.creatorId === userId || (group.adminIds && group.adminIds.includes(userId));
      }
    };
  },
  {
    name: 'group-store',
    version: 1
  }
);

export const useGroupStore = create(initializeStore);