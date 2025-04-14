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
  type: 'emom' | 'amrap' | 'hiit' | 'running' | 'custom' | 'fitness_test' | 'badge';
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
const mapDbChallengeToClientChallenge = (dbChallenge: any, participants: ChallengeParticipant[] = []): Challenge => {
  // Stelle sicher, dass participantIds immer ein Array ist
  const participantIds = participants.map(p => p.userId);
  
  return {
    id: dbChallenge.id,
    title: dbChallenge.title,
    description: dbChallenge.description,
    image: dbChallenge.image || undefined,
    startDate: new Date(dbChallenge.startDate),
    endDate: new Date(dbChallenge.endDate),
    createdAt: new Date(dbChallenge.createdAt),
    type: (dbChallenge.type || 'custom') as 'emom' | 'amrap' | 'hiit' | 'running' | 'custom' | 'fitness_test' | 'badge',
    status: (dbChallenge.status || 'active') as 'active' | 'completed' | 'upcoming',
    creatorId: dbChallenge.creatorId,
    participantIds: participantIds,
    workoutDetails: dbChallenge.workoutDetails || {},
    points: dbChallenge.points || { bronze: 50, silver: 75, gold: 100 }
  };
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
          console.log("Challenge-Synchronisierung: Lädt Challenges vom Server...");
          set({ isLoading: true });
          
          // Cache-Problem umgehen mit einem Timestamp-Parameter
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/challenges?_=${timestamp}`);
          
          if (!response.ok) {
            throw new Error(`Server antwortete mit ${response.status}: ${response.statusText}`);
          }
          
          const challenges = await response.json();
          // Nur die Anzahl der Challenges loggen, nicht die kompletten Daten
          console.log(`Challenge-Synchronisierung: ${challenges.length} Challenges vom Server geladen`);
          
          // Keine Challenges im Server-Response
          if (!Array.isArray(challenges)) {
            throw new Error('Ungültiges Datenformat vom Server');
          }
          
          // Konvertiere das Array in ein Record-Objekt und wandle Datumsangaben um
          const challengesRecord: Record<number, Challenge> = {};
          const participantsRecord: Record<number, ChallengeParticipantModel[]> = {};
          
          // Hole für jede Challenge die Teilnehmer parallel
          await Promise.all(challenges.map(async (dbChallenge) => {
            try {
              const participantsResponse = await fetch(`/api/challenges/${dbChallenge.id}/participants?_=${timestamp}`);
              
              if (!participantsResponse.ok) {
                console.warn(`Konnte Teilnehmer für Challenge ${dbChallenge.id} nicht laden: ${participantsResponse.status}`);
                throw new Error(`Server antwortete mit ${participantsResponse.status}`);
              }
              
              const participants = await participantsResponse.json();
              // Nur die Anzahl der Teilnehmer loggen, nicht die kompletten Daten
              console.log(`Challenge-Synchronisierung: ${participants.length} Teilnehmer für Challenge ${dbChallenge.id} geladen`);
              
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
          }));
          
          console.log("Challenge-Synchronisierung: Verarbeitet", Object.keys(challengesRecord).length, "Challenges");
          
          // Merge mit bestehenden Challenges, damit lokale Daten nicht verloren gehen
          const existingChallenges = get().challenges;
          const existingParticipants = get().participants;
          
          // Kombiniere existierende und neue Daten
          const mergedChallenges = {
            ...existingChallenges,
            ...challengesRecord
          };
          
          const mergedParticipants = {
            ...existingParticipants,
            ...participantsRecord
          };
          
          // Reduzierte Logging-Ausgabe ohne vollständige Challenge-Daten
          console.log("Challenge-Synchronisierung: Challenges erfolgreich aktualisiert");
          
          set({ 
            challenges: mergedChallenges,
            participants: mergedParticipants,
            isLoading: false,
            lastFetched: Date.now()
          });
          
          // Speichere im localStorage für Fallback
          try {
            localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(mergedChallenges));
            localStorage.setItem('fitness-app-participants', JSON.stringify(mergedParticipants));
            console.log("Challenges und Teilnehmer erfolgreich im localStorage nach Sync gespeichert");
          } catch (storageError) {
            console.error("Fehler beim Speichern im localStorage nach Sync:", storageError);
          }
        } catch (error) {
          console.error('Fehler bei der Synchronisation der Challenges:', error);
          set({ isLoading: false });
          
          // Fallback: Lokale Daten laden
          const savedChallenges = localStorage.getItem(CHALLENGE_STORAGE_KEY);
          if (savedChallenges) {
            try {
              const parsedChallenges = JSON.parse(savedChallenges);
              set({ challenges: parsedChallenges });
            } catch (e) {
              console.error('Fehler beim Laden der Challenges aus localStorage:', e);
            }
          }
        }
      },
      
      createInitialChallenges: async () => {
        const currentChallenges = get().challenges;
        
        try {
          // Überprüfe, ob wir bereits Challenges vom Server haben
          const response = await fetch('/api/challenges');
          const serverChallenges = await response.json();
          
          if (Array.isArray(serverChallenges) && serverChallenges.length > 0) {
            console.log("Challenges existieren bereits auf dem Server:", serverChallenges.length);
            // Aktualisiere unseren lokalen Store durch Synchronisierung
            await get().syncWithServer();
            return;
          }
          
          // Keine Challenges auf dem Server vorhanden oder leere Liste
          // Verwende nur die vordefinierten defaultChallenges
          console.log("Erstelle initiale Challenges auf dem Server...");
          const recordChallenges = arrayToRecord(defaultChallenges);
          
          // Setze zuerst, um lokale Anzeige zu haben
          set({ challenges: recordChallenges });
          
          // Wenn möglich, sende die Challenges an den Server
          try {
            // Sende die Challenges parallel zum Server
            await Promise.all(Object.values(recordChallenges).map(async (challenge) => {
              console.log(`Erstelle Challenge "${challenge.title}" auf dem Server...`);
              
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
                // Sende Challenge mit direktem Fetch an Server
                const challengeResponse = await fetch('/api/challenges', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(challengeData),
                });
                
                if (!challengeResponse.ok) {
                  throw new Error(`Server antwortete mit ${challengeResponse.status}`);
                }
                
                const newChallenge = await challengeResponse.json();
                console.log(`Challenge "${challenge.title}" erstellt mit ID ${newChallenge.id}`);
                
                // Füge Teilnehmer mit direktem Fetch hinzu
                for (const userId of challenge.participantIds) {
                  const participantResponse = await fetch(`/api/challenges/${newChallenge.id}/participants`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                  });
                  
                  if (!participantResponse.ok) {
                    console.warn(`Konnte Teilnehmer ${userId} nicht zu Challenge ${newChallenge.id} hinzufügen: ${participantResponse.status}`);
                  } else {
                    console.log(`Teilnehmer ${userId} zu Challenge ${newChallenge.id} hinzugefügt`);
                  }
                }
              } catch (error) {
                console.error(`Fehler beim Erstellen der Challenge "${challenge.title}":`, error);
              }
            }));
            
            // Synchronisiere nach dem Erstellen mit dem Server
            await get().syncWithServer();
            console.log("Alle initialen Challenges erstellt und synchronisiert");
          } catch (error) {
            console.error('Fehler beim Erstellen der initialen Challenges:', error);
          }
        } catch (error) {
          console.error('Fehler beim Überprüfen vorhandener Challenges:', error);
          
          // Fallback: Verwende lokale Challenges
          if (Object.keys(currentChallenges).length === 0) {
            const recordChallenges = arrayToRecord(defaultChallenges);
            set({ challenges: recordChallenges });
          }
        }
      },
      
      addChallenge: async (challengeData) => {
        try {
          console.log("Challenge hinzufügen gestartet mit Daten:", challengeData);
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
          
          // Stelle sicher, dass isPublic gesetzt ist
          if (challengeData.isPublic === undefined) {
            challengeData.isPublic = true;
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
            workoutDetails: challengeData.workoutDetails || {},
            points: challengeData.points,
            isPublic: challengeData.isPublic
          };
          
          console.log("Sende Challenge an Server:", JSON.stringify(serverChallengeData));
          
          // Sende an Server
          const response = await fetch('/api/challenges', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(serverChallengeData),
          });
          
          // Erfasse vollständige Antwort für Debugging
          const responseText = await response.text();
          console.log(`Server-Antwort HTTP ${response.status}:`, responseText);
          
          if (!response.ok) {
            console.error("Server-Fehlerantwort:", responseText);
            throw new Error(`Server antwortete mit ${response.status}: ${responseText}`);
          }
          
          // Parse die Antwort
          let newChallenge;
          try {
            newChallenge = JSON.parse(responseText);
            console.log("Neue Challenge vom Server erhalten:", newChallenge);
          } catch (parseError) {
            console.error("Fehler beim Parsen der Server-Antwort:", parseError);
            // Versuche einen minimalen Fallback zu erstellen
            newChallenge = {
              id: Date.now(), // Temporäre ID, wenn der Server keine zurückgibt
              ...serverChallengeData,
              createdAt: new Date().toISOString()
            };
            console.warn("Fallback-Challenge erstellt:", newChallenge);
          }
          
          // Stelle sicher, dass alle erwarteten Felder existieren
          if (!newChallenge || !newChallenge.id) {
            console.error("Ungültige Challenge-Daten vom Server erhalten:", newChallenge);
            throw new Error("Server hat ungültige Challenge-Daten zurückgegeben");
          }
          
          // Erstelle Client-Challenge mit allen notwendigen Standardwerten
          const clientChallenge: Challenge = {
            ...newChallenge,
            startDate: new Date(newChallenge.startDate),
            endDate: new Date(newChallenge.endDate),
            createdAt: new Date(newChallenge.createdAt || now),
            updatedAt: new Date(newChallenge.updatedAt || now),
            participantIds: newChallenge.participantIds || [newChallenge.creatorId],
            workoutDetails: newChallenge.workoutDetails || {},
            points: newChallenge.points || { bronze: 0, silver: 0, gold: 0 },
            isPublic: newChallenge.isPublic !== undefined ? newChallenge.isPublic : true,
          };
          
          const updatedChallenges = {
            ...get().challenges,
            [clientChallenge.id]: clientChallenge
          };
          
          console.log("Aktualisiere lokale Challenges:", updatedChallenges);
          
          set({ challenges: updatedChallenges });
          
          // Speichere in localStorage für Persistenz
          try {
            localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
          } catch (storageError) {
            console.warn("Konnte Challenges nicht in localStorage speichern:", storageError);
          }
          
          // Sofortige Synchronisierung mit dem Server auslösen
          setTimeout(() => {
            console.log("Synchronisiere mit Server nach Challenge-Erstellung");
            get().syncWithServer();
          }, 500);
          
          // Erneute Synchronisierung nach kurzer Verzögerung, um sicherzustellen,
          // dass die Challenge überall angezeigt wird
          setTimeout(() => {
            console.log("Zweite Synchronisierung mit Server nach Challenge-Erstellung");
            get().syncWithServer();
          }, 2000);
          
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
          console.log("Challenge aktualisieren gestartet mit ID:", id, "und Daten:", updatedChallenge);
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
          
          console.log("Sende Challenge-Update an Server:", serverUpdateData);
          
          // Verwende direkten Fetch-Aufruf statt apiRequest
          const response = await fetch(`/api/challenges/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(serverUpdateData)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server antwortete mit ${response.status}: ${errorText}`);
            throw new Error(`Server antwortete mit ${response.status}: ${errorText}`);
          }
          
          const updatedFromServer = await response.json();
          console.log("Aktualisierte Challenge vom Server erhalten:", updatedFromServer);
          
          // Lokalen Store aktualisieren
          const updatedObj = { 
            ...challenge, 
            ...updatedChallenge, 
            status,
            startDate: new Date(updatedFromServer.startDate || challenge.startDate),
            endDate: new Date(updatedFromServer.endDate || challenge.endDate),
            updatedAt: new Date(updatedFromServer.updatedAt || new Date())
          };
          
          const updatedChallenges = {
            ...get().challenges,
            [id]: updatedObj
          };
          
          console.log("Aktualisiere lokale Challenges:", updatedChallenges);
          
          set({ challenges: updatedChallenges });
          
          // Speichere in localStorage für Persistenz
          localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
          
          // Synchronisiere mit dem Server, um sicherzustellen, dass alle Ansichten aktuell sind
          setTimeout(() => {
            get().syncWithServer();
          }, 1000);
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Challenge:', error);
          throw error;
        }
      },
      
      joinChallenge: async (challengeId, userId) => {
        try {
          console.log("Challenge beitreten gestartet mit Challenge-ID:", challengeId, "und User-ID:", userId);
          const challenge = get().challenges[challengeId];
          
          if (!challenge) throw new Error('Challenge nicht gefunden');
          
          if (challenge.participantIds.includes(userId)) {
            console.log("Benutzer ist bereits Teilnehmer dieser Challenge");
            return; // Bereits Teilnehmer
          }
          
          // Stelle sicher, dass wir hier eine Zahl haben und keinen String
          const numUserId = Number(userId);
          if (isNaN(numUserId)) {
            throw new Error(`Ungültige User-ID: ${userId}`);
          }
          
          // Verwende direkten Fetch-Aufruf statt apiRequest
          console.log(`Sende Beitrittsanfrage an Server für Challenge ${challengeId} und User ${numUserId}`);
          const response = await fetch(`/api/challenges/${challengeId}/participants`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: numUserId })
          });
          
          // Logge die Anfrage für Debugging
          console.log("Anfrage-Daten:", { challengeId, userId: numUserId });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server antwortete mit ${response.status}: ${errorText}`);
            throw new Error(`Server antwortete mit ${response.status}: ${errorText}`);
          }
          
          const serverResponse = await response.json();
          console.log("Server-Antwort nach Beitritt:", serverResponse);
          
          // Lokalen Store aktualisieren
          const participants = get().participants;
          const challengeParticipants = participants[challengeId] || [];
          
          // Stellen Sie sicher, dass die Serverantwort verwendet wird
          const newParticipant: ChallengeParticipantModel = {
            id: serverResponse.id || Date.now(),
            challengeId: serverResponse.challengeId || challengeId,
            userId: serverResponse.userId || numUserId,
            joinedAt: serverResponse.joinedAt ? new Date(serverResponse.joinedAt) : new Date(),
            result: serverResponse.result || null,
            completedAt: serverResponse.completedAt ? new Date(serverResponse.completedAt) : null,
            achievementLevel: serverResponse.achievementLevel || null,
            currentProgress: serverResponse.currentProgress || 0,
            points: serverResponse.points || 0
          };
          
          console.log("Neuer Teilnehmer mit Serverdaten:", newParticipant);
          
          const updatedParticipants = {
            ...participants,
            [challengeId]: [...challengeParticipants, newParticipant]
          };
          
          const updatedChallenges = {
            ...get().challenges,
            [challengeId]: {
              ...challenge,
              participantIds: [...challenge.participantIds, numUserId]
            }
          };
          
          // Aktualisiere Teilnehmer im State
          set({
            participants: updatedParticipants,
            challenges: updatedChallenges
          });
          
          // Speichere explizit in localStorage für Persistenz
          try {
            localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
            localStorage.setItem('fitness-app-participants', JSON.stringify(updatedParticipants));
            console.log("Teilnahme erfolgreich im localStorage gespeichert");
          } catch (err) {
            console.error("Fehler beim Speichern der Teilnahme im localStorage:", err);
          }
          
          // Synchronisiere sofort und nach einer kurzen Verzögerung nochmals
          get().syncWithServer(); // Sofortiger Aufruf
          
          // Erneute Synchronisierung nach kurzer Verzögerung für mehr Zuverlässigkeit
          setTimeout(() => {
            console.log("Wiederholte Server-Synchronisierung nach Teilnahme");
            get().syncWithServer();
          }, 2000);
          
          return newParticipant; // Gib den neuen Teilnehmer zurück für weitere Verarbeitung
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
          
          const updatedParticipants = {
            ...participants,
            [challengeId]: challengeParticipants.filter(p => p.userId !== userId)
          };
          
          const updatedChallenges = {
            ...get().challenges,
            [challengeId]: {
              ...challenge,
              participantIds: challenge.participantIds.filter(id => id !== userId)
            }
          };
          
          // Setze im State
          set({
            participants: updatedParticipants,
            challenges: updatedChallenges
          });
          
          // Speichere im localStorage für Persistenz
          try {
            localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(updatedChallenges));
            localStorage.setItem('fitness-app-participants', JSON.stringify(updatedParticipants));
            console.log("Teilnahmebeendigung im localStorage gespeichert");
          } catch (storageError) {
            console.warn("Konnte Challenges/Teilnehmer nicht in localStorage speichern:", storageError);
          }
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
          console.log(`Aktualisiere Ergebnis für Challenge ${challengeId}, User ${userId}:`, data);
          
          // An Server senden
          const response = await fetch(`/api/challenges/${challengeId}/participants/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server antwortete mit ${response.status}: ${errorText}`);
            throw new Error(`Server antwortete mit ${response.status}: ${errorText}`);
          }
          
          const serverResponse = await response.json();
          console.log("Server-Antwort nach Ergebnis-Update:", serverResponse);
          
          // Lokalen Store aktualisieren
          const participants = get().participants;
          const challengeParticipants = participants[challengeId] || [];
          
          const updatedParticipants = challengeParticipants.map(participant => {
            if (participant.userId === userId) {
              return { ...participant, ...data };
            }
            return participant;
          });
          
          const updatedParticipantsState = {
            ...participants,
            [challengeId]: updatedParticipants
          };
          
          // State aktualisieren
          set({
            participants: updatedParticipantsState
          });
          
          // Explizit in localStorage speichern
          try {
            localStorage.setItem('fitness-app-participants', JSON.stringify(updatedParticipantsState));
            console.log("Teilnahme-Ergebnis erfolgreich im localStorage gespeichert");
          } catch (storageError) {
            console.error("Fehler beim Speichern des Teilnahme-Ergebnisses im localStorage:", storageError);
          }
          
          // Synchronisiere mit dem Server nach kurzer Verzögerung
          setTimeout(() => {
            get().syncWithServer();
          }, 1000);
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
            // Versuche Teilnehmerdaten aus localStorage zu laden
            try {
              const storedParticipants = localStorage.getItem('fitness-app-participants');
              if (storedParticipants) {
                const parsedParticipants = JSON.parse(storedParticipants);
                console.log("Lade gespeicherte Teilnehmerdaten:", parsedParticipants);
                state.participants = parsedParticipants;
              }
            } catch (e) {
              console.error('Fehler beim Laden der Teilnehmerdaten aus localStorage:', e);
            }
            
            // Nach der Rehydrierung, überprüfe, ob eine Aktualisierung vom Server nötig ist
            const lastFetched = state.lastFetched || 0;
            const now = Date.now();
            const twoHoursInMs = 2 * 60 * 60 * 1000;
            
            // Immer sofort mit dem Server synchronisieren, um die neuesten Daten zu haben
            state.syncWithServer();
          }
        };
      }
    }
  )
);