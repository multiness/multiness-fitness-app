import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post } from '@shared/schema';

export type DailyGoal = {
  type: 'water' | 'steps' | 'distance' | 'custom';
  target: number;
  unit: string;
  progress: number;
  completed: boolean;
  customName?: string;
  createdAt: Date;
};

export type Comment = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  timestamp: string;
};

type PostStore = {
  likes: Record<number, number[]>;
  comments: Record<number, Comment[]>;
  dailyGoals: Record<number, DailyGoal>;
  goalParticipants: Record<number, number[]>;
  addLike: (postId: number, userId: number) => void;
  removeLike: (postId: number, userId: number) => void;
  hasLiked: (postId: number, userId: number) => boolean;
  getLikes: (postId: number) => number[];
  addComment: (postId: number, userId: number, content: string) => void;
  getComments: (postId: number) => Comment[];
  setDailyGoal: (userId: number, goal: DailyGoal) => { hasExistingGoal: boolean };
  getDailyGoal: (userId: number) => DailyGoal | undefined;
  updateDailyGoalProgress: (userId: number, progress: number) => void;
  joinDailyGoal: (targetUserId: number, participantId: number) => void;
  leaveDailyGoal: (targetUserId: number, participantId: number) => void;
  getGoalParticipants: (userId: number) => number[];
  checkExpiredGoals: () => void;
  hasActiveGoal: (userId: number) => boolean;
};

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},

      addLike: (postId, userId) =>
        set((state) => ({
          likes: {
            ...state.likes,
            [postId]: [...(state.likes[postId] || []), userId]
          }
        })),

      removeLike: (postId, userId) =>
        set((state) => ({
          likes: {
            ...state.likes,
            [postId]: (state.likes[postId] || []).filter((id) => id !== userId)
          }
        })),

      hasLiked: (postId, userId) =>
        (get().likes[postId] || []).includes(userId),

      getLikes: (postId) =>
        get().likes[postId] || [],

      addComment: (postId, userId, content) => {
        const comment: Comment = {
          id: Date.now(),
          postId,
          userId,
          content,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: [...(state.comments[postId] || []), comment]
          }
        }));
      },

      getComments: (postId) =>
        get().comments[postId] || [],

      setDailyGoal: (userId, goal) => {
        console.log('Setting daily goal for user:', userId, goal);
        const existingGoal = get().getDailyGoal(userId);
        const hasExistingGoal = Boolean(existingGoal);

        // Create a plain object version of the goal for storage
        const goalForStorage = {
          ...goal,
          createdAt: goal.createdAt.toISOString() // Convert Date to string for storage
        };

        set((state) => ({
          dailyGoals: {
            ...state.dailyGoals,
            [userId]: goalForStorage
          }
        }));

        return { hasExistingGoal };
      },

      getDailyGoal: (userId) => {
        console.log('Getting daily goal for user:', userId);
        const goal = get().dailyGoals[userId];
        console.log('Found goal:', goal);

        if (!goal) return undefined;

        // Convert stored goal back to proper format with Date object
        const goalWithDate = {
          ...goal,
          createdAt: new Date(goal.createdAt)
        };

        // Check if goal is expired (24h)
        const now = new Date();
        const goalAge = now.getTime() - goalWithDate.createdAt.getTime();
        const isExpired = goalAge > 24 * 60 * 60 * 1000;

        if (isExpired) {
          set((state) => {
            const { [userId]: _, ...remainingGoals } = state.dailyGoals;
            const { [userId]: __, ...remainingParticipants } = state.goalParticipants;
            return {
              dailyGoals: remainingGoals,
              goalParticipants: remainingParticipants
            };
          });
          return undefined;
        }

        return goalWithDate;
      },

      hasActiveGoal: (userId) => {
        return Boolean(get().getDailyGoal(userId));
      },

      updateDailyGoalProgress: (userId, progress) =>
        set((state) => {
          const currentGoal = state.dailyGoals[userId];
          if (!currentGoal) return state;

          return {
            dailyGoals: {
              ...state.dailyGoals,
              [userId]: {
                ...currentGoal,
                progress,
                completed: progress >= currentGoal.target
              }
            }
          };
        }),

      joinDailyGoal: (targetUserId, participantId) =>
        set((state) => ({
          goalParticipants: {
            ...state.goalParticipants,
            [targetUserId]: [...(state.goalParticipants[targetUserId] || []), participantId]
          }
        })),

      leaveDailyGoal: (targetUserId, participantId) =>
        set((state) => ({
          goalParticipants: {
            ...state.goalParticipants,
            [targetUserId]: (state.goalParticipants[targetUserId] || []).filter(id => id !== participantId)
          }
        })),

      getGoalParticipants: (userId) =>
        get().goalParticipants[userId] || [],

      checkExpiredGoals: () => {
        const now = new Date();
        const goals = get().dailyGoals;

        Object.entries(goals).forEach(([userId, goal]) => {
          if (!goal) return;

          const goalAge = now.getTime() - new Date(goal.createdAt).getTime();
          if (goalAge > 24 * 60 * 60 * 1000) {
            set((state) => {
              const { [userId]: _, ...remainingGoals } = state.dailyGoals;
              const { [userId]: __, ...remainingParticipants } = state.goalParticipants;
              return {
                dailyGoals: remainingGoals,
                goalParticipants: remainingParticipants
              };
            });
          }
        });
      }
    }),
    {
      name: 'post-interaction-storage',
      version: 1, // Add version number to handle storage migrations
    }
  )
);