import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post } from '@shared/schema';

export type DailyGoal = {
  type: 'water' | 'steps' | 'distance' | 'custom';
  target: number;
  unit: string;
  progress: number;
  completed: boolean;
  customName?: string; // Für individuelle Ziele
  participants?: number[]; // Array von User IDs die mitmachen
};

export type Comment = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  timestamp: string;
};

type PostStore = {
  likes: Record<number, number[]>; // postId -> array of userIds who liked
  comments: Record<number, Comment[]>; // postId -> array of comments
  dailyGoals: Record<number, DailyGoal>; // userId -> active daily goal
  goalParticipants: Record<number, number[]>; // userId -> array of participant userIds
  addLike: (postId: number, userId: number) => void;
  removeLike: (postId: number, userId: number) => void;
  hasLiked: (postId: number, userId: number) => boolean;
  getLikes: (postId: number) => number[];
  addComment: (postId: number, userId: number, content: string) => void;
  getComments: (postId: number) => Comment[];
  setDailyGoal: (userId: number, goal: DailyGoal) => void;
  getDailyGoal: (userId: number) => DailyGoal | undefined;
  updateDailyGoalProgress: (userId: number, progress: number) => void;
  joinDailyGoal: (targetUserId: number, participantId: number) => void;
  leaveDailyGoal: (targetUserId: number, participantId: number) => void;
  getGoalParticipants: (userId: number) => number[];
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
      setDailyGoal: (userId, goal) =>
        set((state) => ({
          dailyGoals: {
            ...state.dailyGoals,
            [userId]: goal
          }
        })),
      getDailyGoal: (userId) =>
        get().dailyGoals[userId],
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
        get().goalParticipants[userId] || []
    }),
    {
      name: 'post-interaction-storage'
    }
  )
);

interface PostStore2 {
  posts: (Post & { dailyGoal?: DailyGoal })[];
  addPost: (post: Post & { dailyGoal?: DailyGoal }) => void;
  getPosts: () => (Post & { dailyGoal?: DailyGoal })[];
}

export const usePostStore2 = create<PostStore2>()(
  persist(
    (set, get) => ({
      posts: [],
      addPost: (post) => {
        set((state) => ({
          posts: [post, ...state.posts]
        }));
      },
      getPosts: () => get().posts,
    }),
    {
      name: 'post-storage'
    }
  )
);