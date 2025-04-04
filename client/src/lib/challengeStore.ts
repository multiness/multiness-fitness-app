import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockChallenges } from '../data/mockData';
import { Challenge as DbChallenge, ChallengeParticipant } from '@shared/schema';
import { apiRequest } from './queryClient';

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
  participantIds: number[];  // Wird aus den Teilnehmerdaten abgeleitet
  workoutDetails: any;
  points?: {
    bronze: number;
    silver: number;
    gold: number;
  };
  createdAt: Date;
}

export interface ChallengeParticipantModel {
  id: number;
  challengeId: number;
  userId: number;
  joinedAt: Date;
  completedAt?: Date;
  currentProgress?: number;
  achievementLevel?: 'bronze' | 'silver' | 'gold';
  result?: any;
}

interface ChallengeState {
  challenges: Record<number, Challenge>;
  participants: Record<number, ChallengeParticipantModel[]>;
  isLoading: boolean;
  lastFetched: number | null;
}

interface ChallengeActions {
  // Datenbankfunktionen
  syncWithServer: () => Promise<void>;
  setChallenges: (challenges: Record<number, Challenge>) => void;
  
  // CRUD Operationen
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt'>) => Promise<number>;
  removeChallenge: (id: number) => Promise<void>;
  updateChallenge: (id: number, updatedChallenge: Partial<Challenge>) => Promise<void>;
  
  // Teilnehmer-Operationen
  joinChallenge: (challengeId: number, userId: number) => Promise<void>;
  leaveChallenge: (challengeId: number, userId: number) => Promise<void>;
  
  // Abfragen
  getActiveChallenges: () => Challenge[];
  getChallengesByUser: (userId: number) => Challenge[];
  getParticipants: (challengeId: number) => ChallengeParticipantModel[];
  updateParticipant: (challengeId: number, userId: number, data: Partial<ChallengeParticipantModel>) => Promise<void>;
  
  // Initialisierung
  createInitialChallenges: () => void;
}

type ChallengeStore = ChallengeState & ChallengeActions;

// Hilfsfunktion zum Konvertieren vom Server-Modell zum Client-Modell
const mapDbChallengeToClientChallenge = (dbChallenge: DbChallenge, participants: ChallengeParticipant[] = []): Challenge => {
  return {
    ...dbChallenge,
    startDate: new Date(dbChallenge.startDate),
    endDate: new Date(dbChallenge.endDate),
    createdAt: new Date(dbChallenge.createdAt),
    participantIds: participants.map(p => p.userId),
    // Stelle sicher, dass der Typ korrekt ist
    type: dbChallenge.type as 'emom' | 'amrap' | 'hiit' | 'running' | 'custom',
    status: dbChallenge.status as 'active' | 'completed' | 'upcoming'
  } as Challenge;
};

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

// Hilfsfunktion zum Konvertieren von ChallengeParticipant zu ChallengeParticipantModel
const mapDbParticipantToClientParticipant = (participant: ChallengeParticipant): ChallengeParticipantModel => {
  return {
    ...participant,
    joinedAt: new Date(participant.joinedAt),
    completedAt: participant.completedAt ? new Date(participant.completedAt) : undefined
  } as ChallengeParticipantModel;
};

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: loadChallengesFromStorage(),
      participants: {},
      isLoading: false,
      lastFetched: null,
      
      // Synchronisiere Daten mit dem Server
      setChallenges: (challenges) => {
        set({ 
          challenges,
          lastFetched: Date.now()
        });
      },
      
      syncWithServer: async () => {
        try {
          set({ isLoading: true });
          
          // Hole alle Challenges vom Server
          const response = await fetch('/api/challenges');
          const challenges = await response.json();
          
          // Konvertiere das Array in ein Record-Objekt und wandle Datumsangaben um
          const challengesRecord: Record<number, Challenge> = {};
          const participantsRecord: Record<number, ChallengeParticipantModel[]> = {};
          
          // Hole für jede Challenge die Teilnehmer
          for (const dbChallenge of challenges) {
            try {
              const participantsResponse = await fetch(`/api/challenges/${dbChallenge.id}/participants`);
              const participants = await participantsResponse.json();
              
              // Wenn participantIds nicht vorhanden ist, füge leeres Array hinzu
              if (!dbChallenge.participantIds) {
                dbChallenge.participantIds = participants.map((p: ChallengeParticipant) => p.userId);
              }
              
              // Konvertiere DB-Challenge in Client-Challenge
              const clientChallenge = mapDbChallengeToClientChallenge(dbChallenge, participants);
              challengesRecord[dbChallenge.id] = clientChallenge;
              
              // Speichere Teilnehmer
              participantsRecord[dbChallenge.id] = participants.map(mapDbParticipantToClientParticipant);
            } catch (err) {
              console.error(`Fehler beim Abrufen der Teilnehmer für Challenge ${dbChallenge.id}:`, err);
              
              // Falls Teilnehmer nicht abrufbar, nutze leeres Array
              if (!dbChallenge.participantIds) {
                dbChallenge.participantIds = [];
              }
              
              const clientChallenge = mapDbChallengeToClientChallenge(dbChallenge, []);
              challengesRecord[dbChallenge.id] = clientChallenge;
              participantsRecord[dbChallenge.id] = [];
            }
          }
          
          set({ 
            challenges: challengesRecord,
            participants: participantsRecord,
            isLoading: false,
            lastFetched: Date.now()
          });
        } catch (error) {
          console.error('Fehler bei der Synchronisation mit dem Server:', error);
          set({ isLoading: false });
        }
      },
      
      createInitialChallenges: () => {
        const currentChallenges = get().challenges;
        
        if (Object.keys(currentChallenges).length === 0) {
          // Verwende nur die vordefinierten defaultChallenges
          const recordChallenges = arrayToRecord(defaultChallenges);
          
          set({ challenges: recordChallenges });
          
          // Wenn möglich, sende die Challenges an den Server
          try {
            Promise.all(Object.values(recordChallenges).map(async (challenge) => {
              // Bereite die Daten für den Server vor
              const challengeData = {
                title: challenge.title,
                description: challenge.description,
                image: challenge.image,
                creatorId: challenge.creatorId,
                startDate: challenge.startDate.toISOString(),
                endDate: challenge.endDate.toISOString(),
                type: challenge.type,
                status: challenge.status,
                workoutDetails: challenge.workoutDetails,
                points: challenge.points
              };
              
              try {
                // Sende Challenge an Server
                await apiRequest('/api/challenges', 'POST', challengeData);
                
                // Füge Teilnehmer hinzu
                for (const userId of challenge.participantIds) {
                  await apiRequest(`/api/challenges/${challenge.id}/participants`, 'POST', { userId });
                }
              } catch (error) {
                console.error('Fehler beim Erstellen der initialen Challenge:', error);
              }
            }));
          } catch (error) {
            console.error('Fehler beim Erstellen der initialen Challenges:', error);
          }
        }
      },
      
      addChallenge: async (challengeData) => {
        try {
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
          
          // Bereite Daten für Server vor
          const serverChallengeData = {
            title: challengeData.title,
            description: challengeData.description,
            image: challengeData.image,
            creatorId: challengeData.creatorId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            type: challengeData.type,
            status,
            workoutDetails: challengeData.workoutDetails,
            points: challengeData.points
          };
          
          // Sende an Server
          const response = await fetch('/api/challenges', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(serverChallengeData),
          });
          const newChallenge = await response.json();
          
          // Erstelle Client-Challenge
          const clientChallenge: Challenge = {
            ...newChallenge,
            startDate: new Date(newChallenge.startDate),
            endDate: new Date(newChallenge.endDate),
            createdAt: new Date(newChallenge.createdAt),
            participantIds: [newChallenge.creatorId]
          };
          
          const updatedChallenges = {
            ...get().challenges,
            [clientChallenge.id]: clientChallenge
          };
          
          set({ challenges: updatedChallenges });
          
          return clientChallenge.id;
        } catch (error) {
          console.error('Fehler beim Erstellen der Challenge:', error);
          throw error;
        }
      },
      
      removeChallenge: async (id) => {
        try {
          // Entferne Challenge vom Server (API noch nicht implementiert)
          // await apiRequest(`/api/challenges/${id}`, 'DELETE');
          
          // Lokalen Store aktualisieren
          const { [id]: removed, ...remainingChallenges } = get().challenges;
          set({ challenges: remainingChallenges });
        } catch (error) {
          console.error('Fehler beim Löschen der Challenge:', error);
          throw error;
        }
      },
      
      updateChallenge: async (id, updatedChallenge) => {
        try {
          const challenge = get().challenges[id];
          
          if (!challenge) throw new Error('Challenge nicht gefunden');
          
          // Wenn Start- oder Enddatum geändert wurden, aktualisiere den Status
          let status = updatedChallenge.status || challenge.status;
          const now = new Date();
          
          if (updatedChallenge.startDate || updatedChallenge.endDate) {
            const startDate = updatedChallenge.startDate 
              ? (updatedChallenge.startDate instanceof Date 
                ? updatedChallenge.startDate 
                : new Date(updatedChallenge.startDate))
              : challenge.startDate;
              
            const endDate = updatedChallenge.endDate 
              ? (updatedChallenge.endDate instanceof Date 
                ? updatedChallenge.endDate 
                : new Date(updatedChallenge.endDate))
              : challenge.endDate;
            
            if (startDate > now) {
              status = 'upcoming';
            } else if (endDate < now) {
              status = 'completed';
            } else {
              status = 'active';
            }
          }
          
          // Bereite Daten für Server vor
          const serverUpdateData = {
            ...updatedChallenge,
            status,
            startDate: updatedChallenge.startDate ? 
              (updatedChallenge.startDate instanceof Date ? 
                updatedChallenge.startDate.toISOString() : 
                updatedChallenge.startDate) : 
              undefined,
            endDate: updatedChallenge.endDate ? 
              (updatedChallenge.endDate instanceof Date ? 
                updatedChallenge.endDate.toISOString() : 
                updatedChallenge.endDate) : 
              undefined
          };
          
          // Sende an Server
          await apiRequest(`/api/challenges/${id}`, 'PATCH', serverUpdateData);
          
          // Lokalen Store aktualisieren
          const updatedObj = { ...challenge, ...updatedChallenge, status };
          
          const updatedChallenges = {
            ...get().challenges,
            [id]: updatedObj
          };
          
          set({ challenges: updatedChallenges });
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Challenge:', error);
          throw error;
        }
      },
      
      joinChallenge: async (challengeId, userId) => {
        try {
          const challenge = get().challenges[challengeId];
          
          if (!challenge) throw new Error('Challenge nicht gefunden');
          
          if (challenge.participantIds.includes(userId)) return; // Bereits Teilnehmer
          
          // An Server senden
          await apiRequest(`/api/challenges/${challengeId}/participants`, 'POST', { userId });
          
          // Lokalen Store aktualisieren
          const participants = get().participants;
          const challengeParticipants = participants[challengeId] || [];
          
          // Neue Teilnehmerdaten
          const newParticipant: ChallengeParticipantModel = {
            id: Date.now(), // Temporäre ID, bis vom Server ersetzt
            challengeId,
            userId,
            joinedAt: new Date()
          };
          
          // Aktualisiere Teilnehmer
          set({
            participants: {
              ...participants,
              [challengeId]: [...challengeParticipants, newParticipant]
            },
            challenges: {
              ...get().challenges,
              [challengeId]: {
                ...challenge,
                participantIds: [...challenge.participantIds, userId]
              }
            }
          });
        } catch (error) {
          console.error('Fehler beim Beitreten zur Challenge:', error);
          throw error;
        }
      },
      
      leaveChallenge: async (challengeId, userId) => {
        try {
          const challenge = get().challenges[challengeId];
          
          if (!challenge) throw new Error('Challenge nicht gefunden');
          
          // An Server senden (API noch nicht implementiert)
          // await apiRequest(`/api/challenges/${challengeId}/participants/${userId}`, 'DELETE');
          
          // Lokalen Store aktualisieren
          const participants = get().participants;
          const challengeParticipants = participants[challengeId] || [];
          
          set({
            participants: {
              ...participants,
              [challengeId]: challengeParticipants.filter(p => p.userId !== userId)
            },
            challenges: {
              ...get().challenges,
              [challengeId]: {
                ...challenge,
                participantIds: challenge.participantIds.filter(id => id !== userId)
              }
            }
          });
        } catch (error) {
          console.error('Fehler beim Verlassen der Challenge:', error);
          throw error;
        }
      },
      
      getActiveChallenges: () => {
        const now = new Date();
        
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
        
        return challenges;
      },
      
      getChallengesByUser: (userId) => {
        return Object.values(get().challenges)
          .map(processChallengeDates)
          .filter(challenge => 
            challenge.participantIds.includes(userId) || challenge.creatorId === userId
          );
      },
      
      getParticipants: (challengeId) => {
        return get().participants[challengeId] || [];
      },
      
      updateParticipant: async (challengeId, userId, data) => {
        try {
          // An Server senden
          await apiRequest(
            `/api/challenges/${challengeId}/participants/${userId}`, 
            'PATCH', 
            data
          );
          
          // Lokalen Store aktualisieren
          const participants = get().participants;
          const challengeParticipants = participants[challengeId] || [];
          
          const updatedParticipants = challengeParticipants.map(participant => {
            if (participant.userId === userId) {
              return { ...participant, ...data };
            }
            return participant;
          });
          
          set({
            participants: {
              ...participants,
              [challengeId]: updatedParticipants
            }
          });
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Teilnehmers:', error);
          throw error;
        }
      }
    }),
    {
      name: 'challenge-store',
      version: 2, // Neue Version für Datenmodell
      partialize: (state) => ({
        challenges: state.challenges,
        participants: state.participants,
        lastFetched: state.lastFetched
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Nach der Rehydrierung, überprüfe, ob eine Aktualisierung vom Server nötig ist
            const lastFetched = state.lastFetched || 0;
            const now = Date.now();
            const twoHoursInMs = 2 * 60 * 60 * 1000;
            
            // Wenn die letzte Aktualisierung mehr als 2 Stunden her ist oder nie erfolgt ist
            if (!lastFetched || (now - lastFetched) > twoHoursInMs) {
              state.syncWithServer();
            }
          }
        };
      }
    }
  )
);