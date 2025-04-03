import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface ChallengeStore {
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
  removeChallenge: (id: number) => void;
  updateChallenge: (id: number, updatedChallenge: Partial<Challenge>) => void;
  joinChallenge: (challengeId: number, userId: number) => void;
  leaveChallenge: (challengeId: number, userId: number) => void;
  getActiveChallenges: () => Challenge[];
  getChallengesByUser: (userId: number) => Challenge[];
}

// Hilsfunktion, um beim ersten Aufruf die Beispiel-Challenges zu erstellen, falls noch keine existieren
export function createInitialChallenges() {
  // Diese Funktion wird in Home.tsx aufgerufen, um sicherzustellen, dass Daten vorhanden sind
  // Tut nichts, wenn bereits Challenges existieren
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: [
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
        },
        {
          id: 3,
          title: 'HIIT-Challenge',
          description: '4-Wochen Hochintensives Intervalltraining für maximale Fettverbrennung',
          image: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&auto=format',
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
          type: 'hiit',
          status: 'active',
          creatorId: 3,
          participantIds: [1, 3, 5, 8],
          workoutDetails: {
            intervals: 8,
            workTime: 40,
            restTime: 20,
            exercises: [
              { name: 'Burpees', description: 'Vollständige Ausführung mit Sprung' },
              { name: 'Mountain Climbers', description: 'Zügiges Tempo' },
              { name: 'Jumping Jacks', description: 'Volle Bewegungsamplitude' },
              { name: 'Squat Jumps', description: 'Tiefe Kniebeuge mit explosivem Sprung' }
            ]
          },
          points: {
            bronze: 50,
            silver: 75,
            gold: 90
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
        },
        {
          id: 4,
          title: '20-Minuten EMOM-Challenge',
          description: 'Every Minute On the Minute - Herausforderndes Workout für Kraft und Kondition',
          image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&auto=format',
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 29),
          type: 'emom',
          status: 'active',
          creatorId: 1,
          participantIds: [1, 2, 4, 7],
          workoutDetails: {
            timePerRound: 60,
            rounds: 20,
            exercises: [
              { name: 'Kettlebell Swings', reps: 15, description: 'Mit 16kg/12kg Kettlebell' },
              { name: 'Box Jumps', reps: 10, description: 'Auf 50cm Box' },
              { name: 'Push-Ups', reps: 15, description: 'Auf Knien ist auch erlaubt' },
              { name: 'Goblet Squats', reps: 15, description: 'Mit Kettlebell oder Hantel' }
            ]
          },
          points: {
            bronze: 50,
            silver: 75,
            gold: 90
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ],
      
      addChallenge: (challenge) => set((state) => ({
        challenges: [...state.challenges, challenge]
      })),
      
      removeChallenge: (id) => set((state) => ({
        challenges: state.challenges.filter(challenge => challenge.id !== id)
      })),
      
      updateChallenge: (id, updatedChallenge) => set((state) => ({
        challenges: state.challenges.map(challenge => 
          challenge.id === id ? { ...challenge, ...updatedChallenge } : challenge
        )
      })),
      
      joinChallenge: (challengeId, userId) => set((state) => ({
        challenges: state.challenges.map(challenge => 
          challenge.id === challengeId
            ? { 
                ...challenge, 
                participantIds: challenge.participantIds.includes(userId)
                  ? challenge.participantIds
                  : [...challenge.participantIds, userId]
              }
            : challenge
        )
      })),
      
      leaveChallenge: (challengeId, userId) => set((state) => ({
        challenges: state.challenges.map(challenge => 
          challenge.id === challengeId
            ? { 
                ...challenge, 
                participantIds: challenge.participantIds.filter(id => id !== userId)
              }
            : challenge
        )
      })),
      
      getActiveChallenges: () => {
        const now = new Date();
        return get().challenges.filter(
          challenge => challenge.startDate <= now && challenge.endDate >= now
        );
      },
      
      getChallengesByUser: (userId) => {
        return get().challenges.filter(
          challenge => challenge.participantIds.includes(userId) || challenge.creatorId === userId
        );
      }
    }),
    {
      name: 'challenge-store'
    }
  )
);