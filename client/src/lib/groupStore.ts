import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type GroupMembershipStore = {
  joinedGroups: number[];
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
  isGroupMember: (groupId: number) => boolean;
};

export const useGroupStore = create<GroupMembershipStore>()(
  persist(
    (set, get) => ({
      joinedGroups: [],
      joinGroup: (groupId) => 
        set((state) => ({
          joinedGroups: [...state.joinedGroups, groupId]
        })),
      leaveGroup: (groupId) =>
        set((state) => ({
          joinedGroups: state.joinedGroups.filter(id => id !== groupId)
        })),
      isGroupMember: (groupId) =>
        get().joinedGroups.includes(groupId)
    }),
    {
      name: 'group-membership-storage'
    }
  )
);
