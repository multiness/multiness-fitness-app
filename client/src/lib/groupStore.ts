import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Group = {
  id: number;
  name: string;
  description: string;
  image?: string;
  participantIds: number[];
  adminIds: number[];
  creatorId: number;
};

type GroupStore = {
  groups: Record<number, Group>;
  joinedGroups: number[];
  createGroup: (group: Omit<Group, 'id'>) => number;
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
  isGroupMember: (groupId: number) => boolean;
  updateGroup: (groupId: number, data: Partial<Group>) => void;
  addAdmin: (groupId: number, userId: number) => void;
  removeAdmin: (groupId: number, userId: number) => void;
  isGroupAdmin: (groupId: number, userId: number) => boolean;
};

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: {},
      joinedGroups: [],

      createGroup: (groupData) => {
        const id = Date.now();
        const group = { ...groupData, id };

        set((state) => ({
          groups: {
            ...state.groups,
            [id]: group
          },
          joinedGroups: [...state.joinedGroups, id]
        }));

        console.log('Group created:', group);
        return id;
      },

      joinGroup: (groupId) => 
        set((state) => ({
          joinedGroups: [...state.joinedGroups, groupId]
        })),

      leaveGroup: (groupId) =>
        set((state) => ({
          joinedGroups: state.joinedGroups.filter(id => id !== groupId)
        })),

      isGroupMember: (groupId) =>
        get().joinedGroups.includes(groupId),

      updateGroup: (groupId, data) => {
        console.log('Updating group:', groupId, 'with data:', data);
        set((state) => ({
          groups: {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              ...data
            }
          }
        }));
      },

      addAdmin: (groupId, userId) =>
        set((state) => {
          const group = state.groups[groupId];
          if (!group) return state;

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                adminIds: [...(group.adminIds || []), userId]
              }
            }
          };
        }),

      removeAdmin: (groupId, userId) =>
        set((state) => {
          const group = state.groups[groupId];
          if (!group || group.creatorId === userId) return state;

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                adminIds: (group.adminIds || []).filter(id => id !== userId)
              }
            }
          };
        }),

      isGroupAdmin: (groupId, userId) => {
        const group = get().groups[groupId];
        const isAdmin = group ? (group.creatorId === userId || (group.adminIds || []).includes(userId)) : false;
        console.log('Checking admin status:', { groupId, userId, group, isAdmin });
        return isAdmin;
      }
    }),
    {
      name: 'group-storage',
      version: 1,
    }
  )
);