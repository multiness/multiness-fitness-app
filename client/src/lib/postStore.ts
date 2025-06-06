import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post as DbPost, DailyGoal as DbDailyGoal } from '../../../shared/schema';
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

// Konstanten für den lokalen Speicher
const LOCAL_STORAGE_POSTS_KEY = 'fitness-app-posts';
const DELETED_POSTS_KEY = 'fitness-app-deleted-posts';
const POST_DELETE_TRIGGER_PREFIX = 'post-deleted-trigger-';

// Hilfsfunktion zum Laden der gelöschten Post-IDs
function getDeletedPostIds(): number[] {
  try {
    const deletedPostsStr = localStorage.getItem(DELETED_POSTS_KEY);
    return deletedPostsStr ? JSON.parse(deletedPostsStr) : [];
  } catch (error) {
    console.error('Fehler beim Laden der gelöschten Posts:', error);
    return [];
  }
}

// Hilfsfunktion zum Speichern der gelöschten Post-IDs
function saveDeletedPostIds(ids: number[]) {
  try {
    localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Fehler beim Speichern der gelöschten Posts:', error);
  }
}

// Event-Listener für lokale Storage-Änderungen, um Synchronisation zu verbessern
if (typeof window !== 'undefined') {  
  window.addEventListener('storage', (event) => {
    // Reagiere auf Änderungen der gelöschten Posts
    if (event.key === DELETED_POSTS_KEY) {
      console.log('Änderung an gelöschten Posts erkannt', event.newValue);
      
      // Löst eine manuelle Aktualisierung in allen geöffneten Tabs aus
      try {
        const deleteEvent = new CustomEvent('force-deleted-posts-sync', {
          detail: { deletedIds: getDeletedPostIds() }
        });
        window.dispatchEvent(deleteEvent);
        console.log('force-deleted-posts-sync Event ausgelöst');
      } catch (e) {
        console.error('Fehler beim Auslösen des Sync-Events:', e);
      }
    }
    
    // Prüfe auf temporäre Schlüssel, die einen gelöschten Post signalisieren
    if (event.key && event.key.startsWith(POST_DELETE_TRIGGER_PREFIX)) {
      try {
        const deletedPostId = Number(event.newValue);
        if (!isNaN(deletedPostId)) {
          console.log(`Post ${deletedPostId} wurde in einem anderen Tab gelöscht`);
          
          // Auslösen des post-deleted Events
          const deleteEvent = new CustomEvent('post-deleted', { 
            detail: { postId: deletedPostId } 
          });
          window.dispatchEvent(deleteEvent);
          
          // Füge die gelöschte ID zur Liste hinzu
          const deletedIds = getDeletedPostIds();
          if (!deletedIds.includes(deletedPostId)) {
            deletedIds.push(deletedPostId);
            saveDeletedPostIds(deletedIds);
          }
        }
      } catch (e) {
        console.warn('Fehler bei der Verarbeitung der gelöschten Post-ID:', e);
      }
    }
  });
  
  // Wenn ein Tab aktiv wird, synchronisiere die gelöschten Posts neu
  window.addEventListener('focus', () => {
    console.log('Tab ist aktiv geworden, lade gelöschte Posts');
    const deletedIds = getDeletedPostIds();
    console.log('Aktuell gelöschte Post-IDs:', deletedIds);
    
    // Löse ein force-deleted-posts-sync Event aus, um Daten zu aktualisieren
    const forceSyncEvent = new CustomEvent('force-deleted-posts-sync', { 
      detail: { 
        timestamp: Date.now(),
        reason: 'tab-focus', 
        deletedPostIds: deletedIds 
      } 
    });
    window.dispatchEvent(forceSyncEvent);
  });
  
  // Reagiere auf localStorage Änderungen in anderen Tabs
  window.addEventListener('storage', (event) => {
    // Prüfe, ob es sich um den Schlüssel für gelöschte Posts handelt
    if (event.key === DELETED_POSTS_KEY) {
      console.log('Storage-Event: Gelöschte Posts haben sich geändert');
      
      // Löse ein force-deleted-posts-sync Event aus
      const forceSyncEvent = new CustomEvent('force-deleted-posts-sync', { 
        detail: { 
          timestamp: Date.now(),
          reason: 'storage-change',
          deletedPostIds: event.newValue ? JSON.parse(event.newValue) : []
        } 
      });
      window.dispatchEvent(forceSyncEvent);
    }
    // Reagiere auf die speziellen Delete-Trigger-Keys
    else if (event.key && event.key.startsWith(POST_DELETE_TRIGGER_PREFIX)) {
      console.log('Storage-Event: Post-Lösch-Trigger erkannt');
      
      // Extrahiere die Post-ID aus dem localStorage-Wert
      const postId = event.newValue ? parseInt(event.newValue, 10) : null;
      
      if (postId && !isNaN(postId)) {
        console.log(`Storage-Event: Post mit ID ${postId} als gelöscht markiert`);
        
        // Sende ein lokales post-deleted Event
        const deleteEvent = new CustomEvent('post-deleted', { detail: { postId } });
        window.dispatchEvent(deleteEvent);
      }
    }
  });
}

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      likes: {},
      comments: {},
      dailyGoals: {},
      goalParticipants: {},
      posts: {},
      isLoading: false,

      // Methode zum Laden der Posts von der API mit verbesserter Synchronisierung
      loadStoredPosts: async () => {
        try {
          console.log("loadStoredPosts: Lade Posts von der API und prüfe auf Aktualisierungen...");
          set({ isLoading: true });
          
          // Hole zunächst die Liste der gelöschten Post-IDs aus dem localStorage
          const deletedPostIds = JSON.parse(localStorage.getItem(DELETED_POSTS_KEY) || '[]');
          console.log("Gelöschte Post-IDs vor API-Aufruf:", deletedPostIds);
          
          // Verhindere Cache-Probleme durch Hinzufügen eines Zeitstempels
          const timestamp = new Date().getTime();
          // Füge immer einen Cache-Buster-Parameter hinzu
          const response = await fetch(`/api/posts?nocache=${timestamp}`, {
            // Füge Cache-Kontrollheader hinzu
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const posts = await response.json();
          console.log(`loadStoredPosts: ${posts.length} Posts von API geladen:`, 
            posts.map((p: any) => p.id));
          
          // Validiere das Antwortformat
          if (!Array.isArray(posts)) {
            throw new Error('Ungültiges Datenformat vom Server');
          }
          
          // Lade die aktuelle Liste der gelöschten Posts
          let deletedPostsIds: number[] = [];
          try {
            const deletedPostsStr = localStorage.getItem(DELETED_POSTS_KEY);
            if (deletedPostsStr) {
              deletedPostsIds = JSON.parse(deletedPostsStr);
              console.log("Geladene gelöschte Post-IDs:", deletedPostsIds);
            }
          } catch (error) {
            console.error("Fehler beim Laden der gelöschten Posts:", error);
          }
          
          // Konvertiere das Array in ein Record-Objekt und bearbeite Daten
          const postsRecord: Record<number, Post> = {};
          
          posts.forEach((post: any) => {
            // Wenn das Post-Objekt gültig ist und nicht in der Liste der gelöschten Posts
            if (post && typeof post === 'object' && 'id' in post && 
                !deletedPostsIds.includes(Number(post.id))) {
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
            } else if (deletedPostsIds.includes(Number(post.id))) {
              console.log(`Post ID ${post.id} übersprungen, da als gelöscht markiert`);
            } else if (!post || typeof post !== 'object' || !('id' in post)) {
              console.warn("Ungültiges Post-Objekt in API-Antwort:", post);
            }
          });
          
          // Stille Verarbeitung ohne Ausgabe aller Post-Daten
          console.debug("loadStoredPosts: Posts verarbeitet");
          
          // Merge mit bestehenden Posts, damit lokale Daten nicht verloren gehen
          const existingPosts = get().posts;
          
          // Entferne alle gelöschten Posts aus den existierenden Posts
          const filteredExistingPosts: Record<number, Post> = {};
          Object.entries(existingPosts).forEach(([key, value]) => {
            const postId = Number(key);
            if (!deletedPostsIds.includes(postId)) {
              filteredExistingPosts[postId] = value;
            }
          });
          
          // WICHTIG: Hier ist das Problem - wir sollten zuerst die neuen Posts nehmen
          // und dann die alten hinzufügen, damit neue Posts nicht überschrieben werden
          // Prioritäten: 1. Neue Posts von API, 2. Lokale nicht gelöschte Posts
          const mergedPosts = {
            ...postsRecord,  // Neue Posts zuerst!
            ...filteredExistingPosts  // Dann lokale Posts
          };
          
          // Stille Verarbeitung der kombinierten Posts
          console.debug("loadStoredPosts: Posts kombiniert, Anzahl:", Object.keys(mergedPosts).length);
          
          set({ posts: mergedPosts, isLoading: false });
          
          // Speichere im localStorage für Notfall-Fallback
          localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(mergedPosts));
          
          // Löse ein force-deleted-posts-sync Event aus, um alle Tabs zu synchronisieren
          const forceSyncEvent = new CustomEvent('force-deleted-posts-sync', { 
            detail: { 
              timestamp: Date.now(),
              deletedPostIds: deletedPostsIds 
            } 
          });
          window.dispatchEvent(forceSyncEvent);
          console.log("Tab-übergreifende Synchronisierung ausgelöst mit force-deleted-posts-sync");
          
          // Füge einen Event-Listener für post-deleted hinzu
          const handlePostDeleted = (event: CustomEvent) => {
            const { postId } = event.detail;
            console.log(`Event post-deleted empfangen für Post ID ${postId}`);
            
            // Entferne den gelöschten Post aus dem State
            set((state) => {
              const { [postId]: _, ...remainingPosts } = state.posts;
              return { posts: remainingPosts };
            });
          };
          
          // Entferne den alten Listener, um Duplikate zu vermeiden
          window.removeEventListener('post-deleted', handlePostDeleted as EventListener);
          // Füge den neuen Listener hinzu
          window.addEventListener('post-deleted', handlePostDeleted as EventListener);
          
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
          
          // Verzögerung hinzufügen, um sicherzustellen, dass der Server den Post speichern kann
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // WICHTIG: Direkt nach dem Erstellen eines neuen Posts immer alle aktuellen Daten vom Server laden
          console.log("Lade alle Posts neu, um Synchronisierung sicherzustellen");
          await get().loadStoredPosts();
          
          // Zusätzlich Event zum Aktualisieren der Ansicht auslösen
          window.dispatchEvent(new CustomEvent('force-posts-update', { 
            detail: { 
              timestamp: Date.now(),
              action: 'post-created',
              postId: newPost.id
            } 
          }));
          
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

      updatePost: async (postId, content) => {
        try {
          console.log("updatePost aufgerufen mit:", { postId, content });
          
          // Server-Änderung ausführen
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }
          
          const updatedPostFromServer = await response.json();
          console.log("Antwort vom Server nach Post-Update:", updatedPostFromServer);
          
          // Lokalen State aktualisieren
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
          
          // Lade die aktuellen Posts neu, um überall synchronisiert zu sein
          await get().loadStoredPosts();
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Posts:', error);
          
          // Lokalen State trotzdem aktualisieren als Fallback
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
        }
      },

      deletePost: async (postId) => {
        try {
          console.log("deletePost aufgerufen mit:", { postId });
          
          // Server-Löschung ausführen
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }
          
          console.log("Post erfolgreich vom Server gelöscht");
          
          // Speichere eine Liste der gelöschten Posts im localStorage für die Synchronisierung
          const DELETED_POSTS_KEY = 'fitness-app-deleted-posts';
          let deletedPostsIds = JSON.parse(localStorage.getItem(DELETED_POSTS_KEY) || '[]');
          
          // Stelle sicher, dass die postId als Zahl gespeichert wird
          const postIdNum = Number(postId);
          
          // Füge die ID zur Liste der gelöschten Posts hinzu, wenn sie noch nicht vorhanden ist
          if (!deletedPostsIds.includes(postIdNum)) {
            deletedPostsIds.push(postIdNum);
            localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(deletedPostsIds));
            console.log(`Post ID ${postIdNum} zur Liste der gelöschten Posts hinzugefügt (lokal)`);
          }
          
          // Stellen wir sicher, dass diese Änderung auch auf allen anderen Tabs/Geräten synchronisiert wird
          // Stoßen wir das Browser-weite storage Event an
          try {
            // Setze einen temporären localStorage-Wert, um ein Storage-Event auszulösen
            // LocalStorage-Events werden zwischen Tabs/Browsern synchronisiert, sessionStorage nicht
            const tempKey = `${POST_DELETE_TRIGGER_PREFIX}${Date.now()}`;
            localStorage.setItem(tempKey, String(postIdNum));
            
            // Erst nach der erfolgten Synchronisierung im Storage entfernen wir den temporären Key
            setTimeout(() => {
              localStorage.removeItem(tempKey);
              console.log(`Temporärer Key ${tempKey} für Post-Löschung entfernt`);
            }, 500); // Längere Verzögerung um mehr Zeit für die Synchronisierung zu geben
          } catch (e) {
            console.warn("Konnte localStorage nicht nutzen für Synchronisierung:", e);
          }
          
          // Lokalen State aktualisieren
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
          
          // Broadcast ein benutzerdefiniertes Event, damit andere Tabs/Fenster die Änderung mitbekommen
          const deleteEvent = new CustomEvent('post-deleted', { detail: { postId: postIdNum } });
          window.dispatchEvent(deleteEvent);
          
          // Wir erzwingen eine komplette Aktualisierung des Zustand
          setTimeout(async () => {
            console.log("Erzwinge Post-Aktualisierung nach dem Löschen...");
            await get().loadStoredPosts();
          }, 100);
        } catch (error) {
          console.error('Fehler beim Löschen des Posts:', error);
          
          // Falls der Server-Aufruf scheitert, trotzdem lokal löschen
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
        }
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
      },


    }
  )
);