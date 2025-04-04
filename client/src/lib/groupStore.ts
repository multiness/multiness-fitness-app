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

interface GroupStore {
  groups: Record<number, Group>;
  invitations: Record<number, number[]>; // groupId -> userId[]
  isLoading: boolean;
  lastFetched: number | null;
  
  // Neue Datenbankfunktionen
  setGroups: (groups: DbGroup[], members: GroupMember[]) => void;
  syncWithServer: () => Promise<void>;
  
  // Bestehende Funktionen
  addGroup: (group: Group) => number;
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

// Hilfsfunktion zum Konvertieren einer DB-Gruppe in eine Client-Gruppe
const mapDbGroupToClientGroup = (dbGroup: DbGroup, members: GroupMember[] = []): Group => {
  // Extrahiere Admins und Mitglieder
  const participantIds = members.map(m => m.userId);
  const adminIds = members.filter(m => m.role === 'admin').map(m => m.userId);
  
  return {
    ...dbGroup,
    createdAt: new Date(dbGroup.createdAt),
    participantIds,
    adminIds,
    goals: [] // Gruppenziele werden später implementiert
  } as Group;
};

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      isLoading: false,
      lastFetched: null,
      groups: {
        1: {
          id: 1,
          name: "Laufgruppe Berlin",
          description: "Gemeinsames Training für den Berlin Marathon",
          image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&auto=format",
          participantIds: [1, 2, 3, 4, 5],
          adminIds: [1],
          creatorId: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          goals: [
            {
              id: 1,
              title: "Gemeinsame Laufdistanz",
              description: "Unser Ziel bis zum Marathon",
              target: 1000,
              unit: "km",
              currentValue: 568,
              endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 29),
            }
          ]
        },
        2: {
          id: 2,
          name: "Fitness Freunde",
          description: "Motivation und Tipps für tägliches Training",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
          participantIds: [1, 3, 6, 8],
          adminIds: [3],
          creatorId: 3,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
          goals: [
            {
              id: 1,
              title: "Gemeinsame Workout-Sessions",
              target: 100,
              unit: "Sessions",
              currentValue: 78,
              endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44),
            }
          ]
        },
        3: {
          id: 3,
          name: "Yoga & Meditation",
          description: "Innere Ruhe und Flexibilität für Sportler",
          image: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&auto=format",
          participantIds: [2, 4, 7, 9],
          adminIds: [4],
          creatorId: 4,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
          isPrivate: true
        }
      },
      
      invitations: {},
      
      addGroup: (group) => {
        const id = Date.now();
        const newGroup = { ...group, id };
        
        set((state) => ({
          groups: {
            ...state.groups,
            [id]: newGroup
          }
        }));
        
        return id;
      },
      
      updateGroup: (id, updatedGroup) => set((state) => ({
        groups: {
          ...state.groups,
          [id]: { ...state.groups[id], ...updatedGroup }
        }
      })),
      
      removeGroup: (id) => set((state) => {
        const { [id]: _, ...restGroups } = state.groups;
        return { groups: restGroups };
      }),
      
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
          
          // Nur einladen, wenn nicht bereits eingeladen
          if (currentInvitations.includes(userId)) {
            return state;
          }
          
          const group = state.groups[groupId];
          // Nicht einladen, wenn der User bereits in der Gruppe ist
          if (group && group.participantIds.includes(userId)) {
            return state;
          }
          
          const newInvitations = {
            ...state.invitations,
            [groupId]: [...currentInvitations, userId]
          };
          
          return { invitations: newInvitations };
        });
        
        // Verzögerte Benachrichtigung, um zirkuläre Abhängigkeiten zu vermeiden
        setTimeout(() => {
          import('../contexts/UserContext').then(module => {
            const users = module.useUsers().getAllUsers();
            const group = get().groups[groupId];
            
            if (group) {
              const inviter = users.find((u: {id: number}) => u.id === inviterId);
              const invitedUser = users.find((u: {id: number}) => u.id === userId);
              
              if (inviter && invitedUser) {
                // Später hier Benachrichtigung implementieren
                console.log('Gruppeneinladung:', {
                  userId: invitedUser.id,
                  groupId: group.id,
                  groupName: group.name,
                  inviterName: inviter.username || inviter.name || "Ein Mitglied"
                });
              }
            }
          });
        }, 0);
      },
      
      acceptInvitation: (groupId, userId) => set((state) => {
        const invitations = state.invitations[groupId] || [];
        
        // Wenn der User nicht eingeladen wurde, nichts tun
        if (!invitations.includes(userId)) {
          return state;
        }
        
        // Entferne die Einladung und füge den User zur Gruppe hinzu
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
        
        // Wenn der User nicht eingeladen wurde, nichts tun
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
        
        // Nur hinzufügen, wenn der User nicht bereits Admin ist
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
        
        // Den Ersteller nicht als Admin entfernen
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
      
      // Prüft, ob ein Benutzer Mitglied einer Gruppe ist
      setGroups: (dbGroups, members) => {
        const groupsRecord: Record<number, Group> = {};
        
        // Konvertiere die Daten in das Client-Format
        dbGroups.forEach(dbGroup => {
          // Finde alle Mitglieder für diese Gruppe
          const groupMembers = members.filter(m => m.groupId === dbGroup.id);
          const clientGroup = mapDbGroupToClientGroup(dbGroup, groupMembers);
          groupsRecord[dbGroup.id] = clientGroup;
        });
        
        set({ 
          groups: groupsRecord,
          lastFetched: Date.now()
        });
      },
      
      syncWithServer: async () => {
        try {
          set({ isLoading: true });
          
          // Rufe alle Gruppen vom Server ab
          const groupsResponse = await fetch('/api/groups');
          const dbGroups = await groupsResponse.json();
          
          // Für jede Gruppe die Mitglieder abrufen
          const allMembers: GroupMember[] = [];
          
          for (const dbGroup of dbGroups) {
            const membersResponse = await fetch(`/api/groups/${dbGroup.id}/members`);
            const groupMembers = await membersResponse.json();
            allMembers.push(...groupMembers);
          }
          
          // Aktualisiere den Store
          get().setGroups(dbGroups, allMembers);
          set({ isLoading: false });
          
        } catch (error) {
          console.error('Fehler bei der Synchronisation der Gruppen:', error);
          set({ isLoading: false });
        }
      },
      
      isGroupMember: (groupId, userId = 1) => {
        const group = get().groups[groupId];
        if (!group) return false;
        return group.participantIds.includes(userId) || group.creatorId === userId;
      }
    }),
    {
      name: 'group-store',
      version: 1
    }
  )
);