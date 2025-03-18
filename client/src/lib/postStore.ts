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
  parentId?: number; // Für nested comments
  likes: number[]; // Array von User IDs die den Kommentar geliked haben
  replies?: number[]; // IDs der Antwort-Kommentare
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
  addComment: (postId: number, userId: number, content: string, parentId?: number) => void;
  getComments: (postId: number, parentId?: number) => Comment[];
  addCommentLike: (postId: number, commentId: number, userId: number) => void;
  removeCommentLike: (postId: number, commentId: number, userId: number) => void;
  hasLikedComment: (postId: number, commentId: number, userId: number) => boolean;
  updatePost: (postId: number, content: string) => void;
  deletePost: (postId: number) => void;
  setDailyGoal: (userId: number, goal: DailyGoal) => { hasExistingGoal: boolean };
  getDailyGoal: (userId: number) => DailyGoal | undefined;
  updateDailyGoalProgress: (userId: number, progress: number) => void;
  joinDailyGoal: (targetUserId: number, participantId: number) => void;
  leaveDailyGoal: (targetUserId: number, participantId: number) => void;
  getGoalParticipants: (userId: number) => number[];
  checkExpiredGoals: () => void;
  hasActiveGoal: (userId: number) => boolean;
  createPostWithGoal: (userId: number, content: string, goal: DailyGoal) => void;
  createPost: (userId: number, content: string, image?: string | null) => void;
};

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},
      posts: {},

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

      addComment: (postId, userId, content, parentId) => {
        const comment: Comment = {
          id: Date.now(),
          postId,
          userId,
          content,
          timestamp: new Date().toISOString(),
          likes: [],
          parentId,
          replies: []
        };

        set((state) => {
          const updatedComments = [...(state.comments[postId] || []), comment];

          // Wenn es ein Reply ist, füge die ID zum Parent-Kommentar hinzu
          if (parentId) {
            const parentIndex = updatedComments.findIndex(c => c.id === parentId);
            if (parentIndex !== -1) {
              updatedComments[parentIndex] = {
                ...updatedComments[parentIndex],
                replies: [...(updatedComments[parentIndex].replies || []), comment.id]
              };
            }
          }

          return {
            comments: {
              ...state.comments,
              [postId]: updatedComments
            }
          };
        });
      },

      getComments: (postId, parentId) => {
        const comments = get().comments[postId] || [];
        if (parentId === undefined) {
          // Hauptkommentare (keine Antworten)
          return comments.filter(c => !c.parentId);
        }
        // Antworten auf einen spezifischen Kommentar
        return comments.filter(c => c.parentId === parentId);
      },

      addCommentLike: (postId, commentId, userId) =>
        set((state) => {
          const comments = state.comments[postId] || [];
          const commentIndex = comments.findIndex(c => c.id === commentId);

          if (commentIndex === -1) return state;

          const updatedComments = [...comments];
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            likes: [...(updatedComments[commentIndex].likes || []), userId]
          };

          return {
            comments: {
              ...state.comments,
              [postId]: updatedComments
            }
          };
        }),

      removeCommentLike: (postId, commentId, userId) =>
        set((state) => {
          const comments = state.comments[postId] || [];
          const commentIndex = comments.findIndex(c => c.id === commentId);

          if (commentIndex === -1) return state;

          const updatedComments = [...comments];
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            likes: (updatedComments[commentIndex].likes || []).filter(id => id !== userId)
          };

          return {
            comments: {
              ...state.comments,
              [postId]: updatedComments
            }
          };
        }),

      hasLikedComment: (postId, commentId, userId) => {
        const comments = get().comments[postId] || [];
        const comment = comments.find(c => c.id === commentId);
        return comment ? (comment.likes || []).includes(userId) : false;
      },

      createPost: (userId, content, image) => {
        const postId = Date.now();
        const post: Post = {
          id: postId,
          userId,
          content,
          image,
          createdAt: new Date()
        };

        set((state) => ({
          posts: {
            ...state.posts,
            [postId]: post
          }
        }));

        return postId;
      },

      createPostWithGoal: (userId, content, goal) => {
        const postId = Date.now();
        const post: Post = {
          id: postId,
          userId,
          content,
          image: null,
          createdAt: new Date(),
          dailyGoal: goal
        };

        set((state) => ({
          posts: {
            ...state.posts,
            [postId]: post
          },
          dailyGoals: {
            ...state.dailyGoals,
            [userId]: goal
          }
        }));
      },

      updatePost: (postId, content) =>
        set((state) => ({
          posts: {
            ...state.posts,
            [postId]: {
              ...state.posts[postId],
              content,
              updatedAt: new Date()
            }
          }
        })),

      deletePost: (postId) =>
        set((state) => {
          const { [postId]: deletedPost, ...remainingPosts } = state.posts;
          const { [postId]: deletedLikes, ...remainingLikes } = state.likes;
          const { [postId]: deletedComments, ...remainingComments } = state.comments;

          return {
            posts: remainingPosts,
            likes: remainingLikes,
            comments: remainingComments
          };
        }),

      hasActiveGoal: (userId) => {
        return Boolean(get().getDailyGoal(userId));
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

      setDailyGoal: (userId, goal) => {
        const existingGoal = get().getDailyGoal(userId);
        const hasExistingGoal = Boolean(existingGoal);

        set((state) => ({
          dailyGoals: {
            ...state.dailyGoals,
            [userId]: goal
          }
        }));

        return { hasExistingGoal };
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
    }
  )
);