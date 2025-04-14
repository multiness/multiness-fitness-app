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
          console.debug("loadStoredPosts: Lade Posts von der API...");
          set({ isLoading: true });
          
          // Cache-Problem umgehen mit einem Parameter
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/posts?_=${timestamp}`);
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const posts = await response.json();
          // Stille Verarbeitung, logge nur die Anzahl der Posts
          console.debug(`loadStoredPosts: ${posts.length} Posts von API geladen`);
          
          // Keine Posts im Server-Response
          if (!Array.isArray(posts)) {
            throw new Error('Ungültiges Datenformat vom Server');
          }
          
          // Konvertiere das Array in ein Record-Objekt und bearbeite Daten
          const postsRecord: Record<number, Post> = {};
          
          posts.forEach((post: any) => {
            // Wenn das Post-Objekt gültig ist
            if (post && typeof post === 'object' && 'id' in post) {
              postsRecord[post.id] = {
                id: post.id,
                userId: post.userId,
                content: post.content,
                image: post.image,
                createdAt: new Date(post.createdAt),
                updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
                groupId: post.groupId,
                // Wenn wir dailyGoalId haben, können wir dailyGoal später aus der separaten DB-Tabelle laden
                dailyGoal: post.dailyGoalId ? { 
                  type: post.dailyGoal?.type || 'custom',
                  target: post.dailyGoal?.target || 100,
                  unit: post.dailyGoal?.unit || 'l',
                  progress: post.dailyGoal?.progress || 0,
                  completed: post.dailyGoal?.completed || false,
                  createdAt: post.dailyGoal?.createdAt ? new Date(post.dailyGoal.createdAt) : new Date(),
                  customName: post.dailyGoal?.customName || null
                } : null
              };
            } else {
              console.warn("Ungültiges Post-Objekt in API-Antwort:", post);
            }
          });
          
          // Stille Verarbeitung ohne Ausgabe aller Post-Daten
          console.debug("loadStoredPosts: Posts verarbeitet");
          
          // Merge mit bestehenden Posts, damit lokale Daten nicht verloren gehen
          const existingPosts = get().posts;
          
          // Kombiniere existierende und neue Posts
          const mergedPosts = {
            ...existingPosts,
            ...postsRecord
          };
          
          // Stille Verarbeitung der kombinierten Posts
          console.debug("loadStoredPosts: Posts kombiniert, Anzahl:", Object.keys(mergedPosts).length);
          
          set({ posts: mergedPosts, isLoading: false });
          
          // Speichere im localStorage für Notfall-Fallback
          localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(mergedPosts));
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

      createPost: async (userId, content, image) => {
        try {
          console.log("createPost aufgerufen mit:", { userId, content, image });
          
          // Erstelle Post über API mit Fetch direkt (keine apiRequest Funktion)
          const postData = {
            userId,
            content,
            image: image ?? null
          };
          
          console.log("Post-Daten, die gesendet werden:", postData);
          
          // Manuelles Fetch anstatt apiRequest
          const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }
          
          const newPost = await response.json();
          console.log("Antwort vom Server beim Post erstellen:", newPost);
          
          // Stelle sicher, dass wir ein korrektes Post-Objekt haben
          if (newPost && typeof newPost === 'object' && 'id' in newPost) {
            // Daten im lokalen Store aktualisieren
            const post: Post = {
              id: newPost.id,
              userId: newPost.userId,
              content: newPost.content,
              image: newPost.image,
              createdAt: new Date(newPost.createdAt),
              updatedAt: newPost.updatedAt ? new Date(newPost.updatedAt) : undefined,
              dailyGoal: null
            };

            const updatedPosts = {
              ...get().posts,
              [post.id]: post
            };
            
            // Speichere Posts im State
            set({ posts: updatedPosts });
            
            // Wir verwenden einen direkten Zugriff auf localStorage statt den Hook useUsers()
            const users = getUsersFromStorage();
            const author = users.find((u: {id: number}) => u.id === userId);
            
            // Nur Benachrichtigungen für Admin-Posts
            if (author?.isAdmin) {
              setTimeout(() => {
                import('./notificationStore').then(({ notifyNewPost }) => {
                  notifyNewPost(author.username || author.name || "Admin", post.id);
                });
              }, 0);
            }

            // Lade die aktuellen Posts neu
            console.log("Lade Posts vom Server neu...");
            await get().loadStoredPosts();
            console.log("Posts neu geladen, aktueller Stand:", get().posts);
            
            return post.id;
          } else {
            throw new Error('Ungültige Antwort vom Server');
          }
        } catch (error) {
          console.error('Fehler beim Erstellen des Posts:', error);
          
          // Fallback: Lokales Erstellen
          const postId = Date.now();
          const post: Post = {
            id: postId,
            userId,
            content,
            image: image ?? null,
            createdAt: new Date(),
            dailyGoal: null
          };
          
          const updatedPosts = {
            ...get().posts,
            [postId]: post
          };
          
          set({ posts: updatedPosts });
          localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));
          
          return postId;
        }
      },

      createPostWithGoal: async (userId, content, goal) => {
        try {
          console.log("createPostWithGoal aufgerufen mit:", { userId, content, goal });
          
          // Erstelle das DailyGoal zuerst
          const dailyGoalData = {
            userId,
            type: goal.type,
            target: goal.target,
            unit: goal.unit,
            progress: goal.progress,
            completed: goal.completed,
            customName: goal.customName,
            date: new Date() // Wichtig, dieses Feld wird benötigt
          };
          
          // Speichere Goals sowohl im State als auch für den API-Aufruf
          const updatedGoals = {
            ...get().dailyGoals,
            [userId]: goal
          };
          
          // Versuche, das Tagesziel zu erstellen
          try {
            const goalResponse = await fetch('/api/daily-goals', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(dailyGoalData),
            });
            
            if (goalResponse.ok) {
              const newGoal = await goalResponse.json();
              console.log("Neues Tagesziel erstellt:", newGoal);
              
              // Erstelle den Post mit DailyGoal über API
              const postData = {
                userId,
                content,
                image: null,
                dailyGoalId: newGoal.id
              };
              
              console.log("Post-Daten mit Ziel, die gesendet werden:", postData);
              
              // Manuelles Fetch anstatt apiRequest
              const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
              });
              
              if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
              }
              
              const newPost = await response.json();
              console.log("Antwort vom Server beim Post mit Goal erstellen:", newPost);
              
              // Stelle sicher, dass wir ein korrektes Post-Objekt haben
              if (newPost && typeof newPost === 'object' && 'id' in newPost) {
                // Daten im lokalen Store aktualisieren
                const post: Post = {
                  id: newPost.id,
                  userId: newPost.userId,
                  content: newPost.content,
                  image: newPost.image,
                  createdAt: new Date(newPost.createdAt),
                  updatedAt: newPost.updatedAt ? new Date(newPost.updatedAt) : undefined,
                  dailyGoal: goal
                };

                const updatedPosts = {
                  ...get().posts,
                  [post.id]: post
                };
                
                // Speichere Posts im State
                set({ 
                  posts: updatedPosts,
                  dailyGoals: updatedGoals
                });
                
                // Wir verwenden einen direkten Zugriff auf localStorage statt den Hook useUsers()
                const users = getUsersFromStorage();
                const author = users.find((u: {id: number}) => u.id === userId);
                
                // Nur Benachrichtigungen für Admin-Posts
                if (author?.isAdmin) {
                  setTimeout(() => {
                    import('./notificationStore').then(({ notifyNewPost }) => {
                      notifyNewPost(author.username || author.name || "Admin", post.id);
                    });
                  }, 0);
                }

                // Lade die aktuellen Posts neu
                console.log("Lade Posts vom Server neu...");
                await get().loadStoredPosts();
                console.log("Posts neu geladen, aktueller Stand:", get().posts);
                
                return post.id;
              } else {
                throw new Error('Ungültige Antwort vom Server');
              }
            } else {
              throw new Error(`Fehler beim Erstellen des Tagesziels: ${goalResponse.status}`);
            }
          } catch (goalError) {
            console.error("Fehler bei der DailyGoal-Erstellung:", goalError);
            
            // Erstelle den Post ohne DailyGoal über API
            const postData = {
              userId,
              content,
              image: null
            };
            
            // Manuelles Fetch anstatt apiRequest für den Post
            const response = await fetch('/api/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const newPost = await response.json();
            console.log("Fallback: Post ohne Goal erstellt:", newPost);
            
            // Stelle sicher, dass wir ein korrektes Post-Objekt haben
            if (newPost && typeof newPost === 'object' && 'id' in newPost) {
              // Daten im lokalen Store aktualisieren
              const post: Post = {
                id: newPost.id,
                userId: newPost.userId,
                content: newPost.content,
                image: newPost.image,
                createdAt: new Date(newPost.createdAt),
                updatedAt: newPost.updatedAt ? new Date(newPost.updatedAt) : undefined,
                dailyGoal: goal // Wir nehmen das Goal lokal mit, auch wenn es nicht in der DB ist
              };

              // Nur lokale Speicherung für den Post
              const updatedPosts = {
                ...get().posts,
                [post.id]: post
              };
              
              // Speichere Posts und Goals im lokalen State
              set({ 
                posts: updatedPosts,
                dailyGoals: updatedGoals
              });
              
              return post.id;
            }
          }
          
          throw new Error('Keine gültige Antwort vom Server');
        } catch (error) {
          console.error('Fehler beim Erstellen des Posts mit Goal:', error);
          
          // Fallback: Lokales Erstellen
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
          
          // Lokaler Fallback
          localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));
          
          return postId;
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