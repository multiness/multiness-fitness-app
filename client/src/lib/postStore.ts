import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  posts: Record<number, Post>;
  addLike: (postId: number, userId: number) => void;
  removeLike: (postId: number, userId: number) => void;
  hasLiked: (postId: number, userId: number) => boolean;
  getLikes: (postId: number) => number[];
  addComment: (postId: number, userId: number, content: string) => void;
  getComments: (postId: number) => Comment[];
  getPost: (postId: number) => Post | undefined;
  updatePost: (postId: number, content: string) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  initializePost: (post: Post) => void;
  setDailyGoal: (userId: number, goal: DailyGoal) => { hasExistingGoal: boolean };
  getDailyGoal: (userId: number) => DailyGoal | undefined;
  updateDailyGoalProgress: (userId: number, progress: number) => void;
  joinDailyGoal: (targetUserId: number, participantId: number) => void;
  leaveDailyGoal: (targetUserId: number, participantId: number) => void;
  getGoalParticipants: (userId: number) => number[];
  checkExpiredGoals: () => void;
  hasActiveGoal: (userId: number) => boolean;
  migrateExistingPosts: () => Promise<void>;
};

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},
      posts: {},

      initializePost: (post: Post) =>
        set((state) => ({
          posts: {
            ...state.posts,
            [post.id]: post
          }
        })),

      migrateExistingPosts: async () => {
        try {
          const existingPosts = Object.values(get().posts);
          if (existingPosts.length === 0) return;

          const response = await apiRequest('POST', '/api/posts/migrate', { posts: existingPosts });
          if (!response.ok) {
            throw new Error('Failed to migrate posts');
          }

          const migratedPosts = await response.json();
          console.log('Successfully migrated posts:', migratedPosts);

          const postsMap = migratedPosts.reduce((acc: Record<number, Post>, post: Post) => {
            acc[post.id] = post;
            return acc;
          }, {});

          set({ posts: postsMap });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        } catch (error) {
          console.error('Error migrating posts:', error);
          throw error;
        }
      },

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

      getPost: (postId) =>
        get().posts[postId],

      updatePost: async (postId, content) => {
        try {
          const response = await apiRequest('PATCH', `/api/posts/${postId}`, { content });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update post');
          }
          const updatedPost = await response.json();

          set((state) => ({
            posts: {
              ...state.posts,
              [postId]: updatedPost
            }
          }));

          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        } catch (error) {
          console.error('Error updating post:', error);
          throw error;
        }
      },

      deletePost: async (postId) => {
        try {
          await apiRequest('DELETE', `/api/posts/${postId}`);

          set((state) => {
            const { [postId]: deletedPost, ...remainingPosts } = state.posts;
            const { [postId]: deletedLikes, ...remainingLikes } = state.likes;
            const { [postId]: deletedComments, ...remainingComments } = state.comments;

            return {
              posts: remainingPosts,
              likes: remainingLikes,
              comments: remainingComments
            };
          });

          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        } catch (error) {
          console.error('Error deleting post:', error);
          throw error;
        }
      },

      setDailyGoal: (userId, goal) => {
        const existingGoal = get().getDailyGoal(userId);
        const hasExistingGoal = Boolean(existingGoal);

        const goalForStorage = {
          ...goal,
          createdAt: goal.createdAt.toISOString()
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
        const goal = get().dailyGoals[userId];

        if (!goal) return undefined;

        const goalWithDate = {
          ...goal,
          createdAt: new Date(goal.createdAt)
        };

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
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.migrateExistingPosts().catch(console.error);
          }
        };
      }
    }
  )
);