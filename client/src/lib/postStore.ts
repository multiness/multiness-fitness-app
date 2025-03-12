import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addLike: (postId: number, userId: number) => void;
  removeLike: (postId: number, userId: number) => void;
  hasLiked: (postId: number, userId: number) => boolean;
  getLikes: (postId: number) => number[];
  addComment: (postId: number, userId: number, content: string) => void;
  getComments: (postId: number) => Comment[];
};

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
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
            [postId]: (state.likes[postId] || []).filter(id => id !== userId)
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
        get().comments[postId] || []
    }),
    {
      name: 'post-interaction-storage'
    }
  )
);
