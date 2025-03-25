import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Group {
  id: number;
  name: string;
  description: string;
  image?: string;
  participantIds: number[];
  adminIds: number[];
  creatorId: number;
  createdAt: Date;
  memberCount?: number;
  type?: 'public' | 'private';
  tags?: string[];
}

interface GroupStore {
  groups: Group[];
  joinedGroups: number[];
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: number, data: Partial<Group>) => void;
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
  isGroupMember: (groupId: number) => boolean;
  addAdmin: (groupId: number, userId: number) => void;
  removeAdmin: (groupId: number, userId: number) => void;
  isGroupAdmin: (groupId: number, userId: number) => boolean;
}

// Initialisieren Sie den Store mit einigen Beispiel-Gruppen
const initialGroups: Group[] = [
  {
    id: 1,
    name: "Morning Workout",
    description: "Frühmorgendliches Training für Frühaufsteher",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
    participantIds: [1, 2, 3],
    adminIds: [1],
    creatorId: 1,
    createdAt: new Date(),
    memberCount: 3,
    type: 'public',
    tags: ['Morgen', 'Workout', 'Fitness']
  },
  {
    id: 2,
    name: "Yoga Community",
    description: "Gemeinsames Yoga für alle Level",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
    participantIds: [1, 4, 5],
    adminIds: [1],
    creatorId: 1,
    createdAt: new Date(),
    memberCount: 3,
    type: 'public',
    tags: ['Yoga', 'Entspannung']
  }
];

export const useGroups = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: initialGroups, // Initialisiere mit Beispiel-Gruppen
      joinedGroups: [],

      setGroups: (groups) => set({ groups }),

      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group],
        joinedGroups: [...state.joinedGroups, group.id]
      })),

      updateGroup: (groupId, data) => set((state) => ({
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, ...data } : group
        )
      })),

      joinGroup: (groupId) => set((state) => ({
        joinedGroups: [...state.joinedGroups, groupId]
      })),

      leaveGroup: (groupId) => set((state) => ({
        joinedGroups: state.joinedGroups.filter(id => id !== groupId)
      })),

      isGroupMember: (groupId) => get().joinedGroups.includes(groupId),

      addAdmin: (groupId, userId) => set((state) => ({
        groups: state.groups.map(group =>
          group.id === groupId
            ? { ...group, adminIds: [...(group.adminIds || []), userId] }
            : group
        )
      })),

      removeAdmin: (groupId, userId) => set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (!group || group.creatorId === userId) return state;

        return {
          groups: state.groups.map(g =>
            g.id === groupId
              ? { ...g, adminIds: (g.adminIds || []).filter(id => id !== userId) }
              : g
          )
        };
      }),

      isGroupAdmin: (groupId, userId) => {
        const group = get().groups.find(g => g.id === groupId);
        return group ? (group.creatorId === userId || (group.adminIds || []).includes(userId)) : false;
      }
    }),
    {
      name: 'group-storage',
      version: 1,
    }
  )
);

// Alias für Abwärtskompatibilität
export const useGroupStore = useGroups;