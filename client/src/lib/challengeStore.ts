import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockChallenges } from '../data/mockData';

// Konstante für den lokalen Speicher
export const CHALLENGE_STORAGE_KEY = 'fitness-app-challenges';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  image?: string;
  startDate: Date;
  endDate: Date;
  type: 'emom' | 'amrap' | 'hiit' | 'running' | 'custom';
  status: 'active' | 'completed' | 'upcoming';
  creatorId: number;
  participantIds: number[];
  workoutDetails: any;
  points?: {
    bronze: number;
    silver: number;
    gold: number;
  };
  createdAt: Date;
}

interface ChallengeState {
  challenges: Record<number, Challenge>;
}

interface ChallengeActions {
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt'>) => number;
  removeChallenge: (id: number) => void;
  updateChallenge: (id: number, updatedChallenge: Partial<Challenge>) => void;
  joinChallenge: (challengeId: number, userId: number) => void;
  leaveChallenge: (challengeId: number, userId: number) => void;
  getActiveChallenges: () => Challenge[];
  getChallengesByUser: (userId: number) => Challenge[];
  createInitialChallenges: () => void;
}

type ChallengeStore = ChallengeState & ChallengeActions;

// Standard-Beispiel Challenges
const defaultChallenges: Challenge[] = [
  {
    id: 1,
    title: '30 Tage Push-Up Challenge',
    description: 'Steigere deine Kraft und Ausdauer mit täglichen Push-Ups. Beginne mit 10 und steigere dich bis zu 100!',
    image: 'https://images.unsplash.com/photo-1598971639058-a852862a1633?w=800&auto=format',
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
    type: 'custom',
    status: 'active',
    creatorId: 1,
    participantIds: [1, 2, 3, 5],
    workoutDetails: {
      description: 'Täglich steigende Anzahl an Push-Ups',
      exercises: [
        {
          name: 'Push-Ups',
          sets: 4,
          reps: 'ansteigend',
          description: 'Standardausführung mit schulterbreiter Handposition'
        }
      ]
    },
    points: {
      bronze: 50,
      silver: 75,
      gold: 90
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6)
  },
  {
    id: 2,
    title: '5km Lauf-Challenge',
    description: 'Verbessere deine 5km-Zeit über 4 Wochen mit strukturiertem Training.',
    image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&auto=format',
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    type: 'running',
    status: 'active',
    creatorId: 2,
    participantIds: [1, 2, 4, 6, 7],
    workoutDetails: {
      type: 'distance',
      target: 5,
      description: 'Verbessere deine 5km Zeit mit regelmäßigen Läufen'
    },
    points: {
      bronze: 50,
      silver: 75,
      gold: 90
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
  }
];

// Konvertiere Challenge-Array zu einem Record mit IDs als Schlüssel
const arrayToRecord = (challenges: Challenge[]): Record<number, Challenge> => {
  return challenges.reduce((acc, challenge) => {
    acc[challenge.id] = challenge;
    return acc;
  }, {} as Record<number, Challenge>);
};

// Hilsfunktion zum Laden von Challenges aus localStorage
const loadChallengesFromStorage = (): Record<number, Challenge> => {
  try {
    const storedChallenges = localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (storedChallenges) {
      return JSON.parse(storedChallenges);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Challenges aus localStorage:', error);
  }
  return {};
};

// Hilfsfunktion zum Umwandeln von Date-Strings zurück in Date-Objekte
const processChallengeDates = (challenge: Challenge): Challenge => {
  return {
    ...challenge,
    startDate: new Date(challenge.startDate),
    endDate: new Date(challenge.endDate),
    createdAt: new Date(challenge.createdAt)
  };
};

// Hilsfunktion, um beim ersten Aufruf die Beispiel-Challenges zu erstellen
export function createInitialChallenges() {
  const storedChallenges = localStorage.getItem(CHALLENGE_STORAGE_KEY);
  
  if (!storedChallenges || Object.keys(JSON.parse(storedChallenges)).length === 0) {
    // Kombiniere Basis-Challenges mit denen aus mockData wenn vorhanden
    const allInitialChallenges = [...defaultChallenges, ...mockChallenges];
    const recordChallenges = arrayToRecord(allInitialChallenges);
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(recordChallenges));
    
    // Aktualisiere den Store, wenn er bereits initialisiert ist
    const store = useChallengeStore.getState();
    if (store) {
      store.challenges = recordChallenges;
    }
  }
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: loadChallengesFromStorage(),
      
      createInitialChallenges: () => {
        const currentChallenges = get().challenges;
        
        if (Object.keys(currentChallenges).length === 0) {
          // Kombiniere Basis-Challenges mit denen aus mockData wenn vorhanden
          const allInitialChallenges = [...defaultChallenges, ...mockChallenges];
          const recordChallenges = arrayToRecord(allInitialChallenges);
          
          set({ challenges: recordChallenges });
          localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(recordChallenges));
        }
      },
      
      addChallenge: (challengeData) => {
        const id = Date.now();
        const now = new Date();
        
        // Definiere den Challenge-Status basierend auf Start- und Enddatum
        let status: 'active' | 'completed' | 'upcoming';
        const startDate = challengeData.startDate instanceof Date 
          ? challengeData.startDate 
          : new Date(challengeData.startDate);
        
        const endDate = challengeData.endDate instanceof Date 
          ? challengeData.endDate 
          : new Date(challengeData.endDate);
        
        if (startDate > now) {
          status = 'upcoming';
        } else if (endDate < now) {
          status = 'completed';
        } else {
          status = 'active';
        }
        
        const newChallenge: Challenge = {
          ...challengeData,
          id,
          createdAt: new Date(),
          status, // Explizit den berechneten Status setzen
          participantIds: challengeData.participantIds || [challengeData.creatorId]
        };
        
        console.log("Neue Challenge erstellt:", newChallenge);
        
        const updatedChallenges = {
          ...get().challenges,
          [id]: newChallenge
        };
        
        set({ challenges: updatedChallenges });
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
        
        return id;
      },
      
      removeChallenge: (id) => {
        const { [id]: removed, ...remainingChallenges } = get().challenges;
        
        set({ challenges: remainingChallenges });
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(remainingChallenges));
      },
      
      updateChallenge: (id, updatedChallenge) => {
        const challenge = get().challenges[id];
        
        if (!challenge) return;
        
        // Wenn Start- oder Enddatum geändert wurden, aktualisiere den Status
        let status = updatedChallenge.status || challenge.status;
        const now = new Date();
        
        if (updatedChallenge.startDate || updatedChallenge.endDate) {
          const startDate = updatedChallenge.startDate 
            ? (updatedChallenge.startDate instanceof Date 
              ? updatedChallenge.startDate 
              : new Date(updatedChallenge.startDate))
            : (challenge.startDate instanceof Date 
              ? challenge.startDate 
              : new Date(challenge.startDate));
            
          const endDate = updatedChallenge.endDate 
            ? (updatedChallenge.endDate instanceof Date 
              ? updatedChallenge.endDate 
              : new Date(updatedChallenge.endDate))
            : (challenge.endDate instanceof Date 
              ? challenge.endDate 
              : new Date(challenge.endDate));
          
          if (startDate > now) {
            status = 'upcoming';
          } else if (endDate < now) {
            status = 'completed';
          } else {
            status = 'active';
          }
        }
        
        const updatedObj = { ...challenge, ...updatedChallenge, status };
        
        console.log("Challenge aktualisiert:", updatedObj);
        
        const updatedChallenges = {
          ...get().challenges,
          [id]: updatedObj
        };
        
        set({ challenges: updatedChallenges });
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
      },
      
      joinChallenge: (challengeId, userId) => {
        const challenge = get().challenges[challengeId];
        
        if (!challenge) return;
        
        if (challenge.participantIds.includes(userId)) return;
        
        const updatedChallenge = {
          ...challenge,
          participantIds: [...challenge.participantIds, userId]
        };
        
        const updatedChallenges = {
          ...get().challenges,
          [challengeId]: updatedChallenge
        };
        
        set({ challenges: updatedChallenges });
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
      },
      
      leaveChallenge: (challengeId, userId) => {
        const challenge = get().challenges[challengeId];
        
        if (!challenge) return;
        
        const updatedChallenge = {
          ...challenge,
          participantIds: challenge.participantIds.filter(id => id !== userId)
        };
        
        const updatedChallenges = {
          ...get().challenges,
          [challengeId]: updatedChallenge
        };
        
        set({ challenges: updatedChallenges });
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
      },
      
      getActiveChallenges: () => {
        const now = new Date();
        console.log("Aktuelle Zeit:", now);
        const challenges = Object.values(get().challenges)
          .map(processChallengeDates)
          .filter(challenge => {
            // Stelle sicher, dass wir mit echten Date-Objekten arbeiten
            const startDate = challenge.startDate instanceof Date 
              ? challenge.startDate 
              : new Date(challenge.startDate);
            
            const endDate = challenge.endDate instanceof Date 
              ? challenge.endDate 
              : new Date(challenge.endDate);
            
            console.log(
              `Challenge ${challenge.id}: ${challenge.title}`,
              "Start:", startDate,
              "Ende:", endDate,
              "Aktiv:", startDate <= now && endDate >= now,
              "Status:", challenge.status
            );
            
            // Aktualisiere den Status der Challenge basierend auf dem Datum
            if (startDate > now) {
              challenge.status = 'upcoming';
            } else if (endDate < now) {
              challenge.status = 'completed';
            } else {
              challenge.status = 'active';
            }
            
            // Eine Challenge gilt als aktiv, wenn sie nicht beendet ist
            return challenge.status !== 'completed';
          });
        
        console.log("Aktive Challenges:", challenges.length);
        return challenges;
      },
      
      getChallengesByUser: (userId) => {
        return Object.values(get().challenges)
          .map(processChallengeDates)
          .filter(challenge => 
            challenge.participantIds.includes(userId) || challenge.creatorId === userId
          );
      }
    }),
    {
      name: 'challenge-store',
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Überprüfe und lade Challenges aus localStorage
            const storedChallenges = localStorage.getItem(CHALLENGE_STORAGE_KEY);
            if (storedChallenges) {
              try {
                state.challenges = JSON.parse(storedChallenges);
              } catch (e) {
                console.error('Fehler beim Parsen der gespeicherten Challenges:', e);
              }
            }
          }
        };
      }
    }
  )
);