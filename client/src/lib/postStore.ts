import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post } from '@shared/schema';
import { mockWorkoutGoals, mockExerciseDatabase } from '../data/mockData';

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
  parentId?: number;
  likes: number[];
  replies?: number[];
};

type PostStore = {
  likes: Record<number, number[]>;
  comments: Record<number, Comment[]>;
  dailyGoals: Record<number, DailyGoal>;
  goalParticipants: Record<number, number[]>;
  posts: Record<number, Post>;
  workoutData: {
    workoutGoals: any[];
    exerciseDatabase: any;
  };
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
  createPostWithGoal: (userId: number, content: string, goal: DailyGoal) => void;
  createPost: (userId: number, content: string, image?: string | null) => void;
  deleteDailyGoal: (userId: number) => void;
  getWorkoutData: () => { workoutGoals: any[]; exerciseDatabase: any };
  setWorkoutData: (data: { workoutGoals: any[]; exerciseDatabase: any }) => void;
  initializeWorkoutData: () => void;
};

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},
      posts: {},
      workoutData: {
        workoutGoals: [],
        exerciseDatabase: {
          emom: [],
          amrap: [],
          hit: [],
          running: []
        }
      },

      getDailyGoal: (userId) => {
        const goal = get().dailyGoals[userId];
        if (!goal) return undefined;

        // Konvertiere das Datum zurück in ein Date-Objekt
        return {
          ...goal,
          createdAt: new Date(goal.createdAt)
        };
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

      updateDailyGoalProgress: (userId, newProgressValue) =>
        set((state) => {
          const currentGoal = state.dailyGoals[userId];
          if (!currentGoal) return state;

          const updatedProgress = currentGoal.progress + newProgressValue;
          const isCompleted = updatedProgress >= currentGoal.target;

          return {
            dailyGoals: {
              ...state.dailyGoals,
              [userId]: {
                ...currentGoal,
                progress: isCompleted ? currentGoal.target : updatedProgress,
                completed: isCompleted
              }
            }
          };
        }),

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
          return comments.filter(c => !c.parentId);
        }
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
          image: image || null,
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

      deleteDailyGoal: (userId: number) =>
        set((state) => {
          const { [userId]: _, ...remainingGoals } = state.dailyGoals;
          return {
            dailyGoals: remainingGoals
          };
        }),

      getWorkoutData: () => get().workoutData,

      setWorkoutData: (data) => set({ workoutData: data }),

      initializeWorkoutData: () => {
        set({
          workoutData: {
            workoutGoals: mockWorkoutGoals,
            exerciseDatabase: mockExerciseDatabase
          }
        });
      },
    }),
    {
      name: 'post-interaction-storage',
      version: 1,
    }
  )
);

// Initialize workout data when the store is created
usePostStore.getState().initializeWorkoutData();