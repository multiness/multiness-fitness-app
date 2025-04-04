import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post as DbPost, DailyGoal as DbDailyGoal } from '@shared/schema';
import { apiRequest } from './queryClient';

export type Post = {
  id: number;
  userId: number;
  content: string;
  image: string | null;
  createdAt: Date;
  updatedAt?: Date;
  groupId?: number | null;
  dailyGoal: any | null;
};

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
  isLoading: boolean;
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
  deleteDailyGoal: (userId: number) => void;
  // Neue Methoden für bessere Datensynchronisierung
  loadStoredPosts: () => Promise<void>;
};

// Hilfsfunktion zum Abrufen aller Benutzer statt useUsers() zu verwenden
const getUsersFromStorage = () => {
  const savedUsers = localStorage.getItem('fitness-app-users');
  return savedUsers ? JSON.parse(savedUsers) : [];
};

// Konstante für den lokalen Speicher
const LOCAL_STORAGE_POSTS_KEY = 'fitness-app-posts';

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},
      posts: {},
      isLoading: false,

      // Methode zum Laden der Posts von der API
      loadStoredPosts: async () => {
        try {
          set({ isLoading: true });
          const response = await fetch('/api/posts');
          const posts = await response.json();
          
          // Konvertiere das Array in ein Record-Objekt und bearbeite Daten
          const postsRecord: Record<number, Post> = {};
          posts.forEach((post: DbPost) => {
            postsRecord[post.id] = {
              ...post,
              createdAt: new Date(post.createdAt),
              updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
              // Wenn wir dailyGoalId haben, können wir dailyGoal aus der separaten DB-Tabelle laden
              dailyGoal: post.dailyGoalId ? { 
                type: 'custom',
                target: 100,
                unit: 'Stück',
                progress: 0,
                completed: false,
                createdAt: new Date()
              } : null
            };
          });
          
          set({ posts: postsRecord, isLoading: false });
        } catch (e) {
          console.error('Fehler beim Laden der Posts von API:', e);
          set({ isLoading: false });
          
          // Fallback: Lokale Daten laden
          const savedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
          if (savedPosts) {
            try {
              const parsedPosts = JSON.parse(savedPosts);
              set({ posts: parsedPosts });
            } catch (e) {
              console.error('Fehler beim Laden der Posts aus localStorage:', e);
            }
          }
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
          image: image ?? null, // Stelle sicher, dass undefined zu null wird
          createdAt: new Date(),
          dailyGoal: null
        };

        const updatedPosts = {
          ...get().posts,
          [postId]: post
        };
        
        // Speichere Posts im State und im lokalem Speicher
        set({ posts: updatedPosts });
        localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

        // Wir verwenden einen direkten Zugriff auf localStorage statt den Hook useUsers()
        const users = getUsersFromStorage();
        const author = users.find((u: {id: number}) => u.id === userId);
        
        // Nur Benachrichtigungen für Admin-Posts
        if (author?.isAdmin) {
          setTimeout(() => {
            import('./notificationStore').then(({ notifyNewPost }) => {
              notifyNewPost(author.username || author.name || "Admin", postId);
            });
          }, 0);
        }

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

        const updatedPosts = {
          ...get().posts,
          [postId]: post
        };
        
        // Speichere Posts sowohl im State als auch direkt im localStorage
        const updatedGoals = {
          ...get().dailyGoals,
          [userId]: goal
        };
        
        set({ 
          posts: updatedPosts,
          dailyGoals: updatedGoals
        });
        
        // Synchronisiere mit localStorage
        localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

        // Wir verwenden einen direkten Zugriff auf localStorage statt den Hook useUsers()
        const users = getUsersFromStorage();
        const author = users.find((u: {id: number}) => u.id === userId);
        
        // Nur Benachrichtigungen für Admin-Posts
        if (author?.isAdmin) {
          setTimeout(() => {
            import('./notificationStore').then(({ notifyNewPost }) => {
              notifyNewPost(author.username || author.name || "Admin", postId);
            });
          }, 0);
        }
      },

      updatePost: (postId, content) => {
        const updatedPosts = {
          ...get().posts,
          [postId]: {
            ...get().posts[postId],
            content,
            updatedAt: new Date()
          }
        };
        
        set({ posts: updatedPosts });
        localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));
      },

      deletePost: (postId) => {
        const { [postId]: deletedPost, ...remainingPosts } = get().posts;
        const { [postId]: deletedLikes, ...remainingLikes } = get().likes;
        const { [postId]: deletedComments, ...remainingComments } = get().comments;

        const updatedState = {
          posts: remainingPosts,
          likes: remainingLikes,
          comments: remainingComments
        };
        
        set(updatedState);
        localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(remainingPosts));
      },

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

      updateDailyGoalProgress: (userId, newProgressValue) =>
        set((state) => {
          const currentGoal = state.dailyGoals[userId];
          if (!currentGoal) return state;

          // Aktualisiere den Fortschritt durch Addition
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

        Object.entries(goals).forEach(([userIdStr, goal]) => {
          if (!goal) return;
          
          // Konvertieren des userId-Strings zu einer Nummer
          const userId = parseInt(userIdStr, 10);
          if (isNaN(userId)) return;

          const goalAge = now.getTime() - new Date(goal.createdAt).getTime();
          if (goalAge > 24 * 60 * 60 * 1000) {
            set((state) => {
              // Hier entfernen wir die einzelnen Einträge durch Nutzung von number als Index
              const newDailyGoals = { ...state.dailyGoals };
              const newGoalParticipants = { ...state.goalParticipants };
              
              delete newDailyGoals[userId];
              delete newGoalParticipants[userId];
              
              return {
                dailyGoals: newDailyGoals,
                goalParticipants: newGoalParticipants
              };
            });
          }
        });
      },
      deleteDailyGoal: (userId: number) =>
        set((state) => {
          // Verwenden des gleichen Ansatzes wie bei checkExpiredGoals
          const newDailyGoals = { ...state.dailyGoals };
          const newGoalParticipants = { ...state.goalParticipants };
          
          delete newDailyGoals[userId];
          delete newGoalParticipants[userId];
          
          return {
            dailyGoals: newDailyGoals,
            goalParticipants: newGoalParticipants
          };
        }),
    }),
    {
      name: 'post-interaction-storage',
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Übernimm explizit die Daten aus dem localStorage für Posts
            const savedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
            if (savedPosts) {
              try {
                state.posts = JSON.parse(savedPosts);
              } catch (e) {
                console.error('Fehler beim Parsen der gespeicherten Posts:', e);
              }
            }
          }
        };
      }
    }
  )
);