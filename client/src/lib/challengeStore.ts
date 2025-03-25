import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  image?: string;
  startDate: string;
  endDate: string;
  participants?: number;
  type: string;
  creatorId: number;
  participantIds?: number[];
  workoutDetails: {
    type: string;
    exercises: any[];
    timeLimit?: number;
    rounds?: number;
    isCircuit?: boolean;
    restBetweenSets?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

interface ChallengeStore {
  challenges: Record<number, Challenge>;
  activeChallenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (challenge: Challenge) => void;
  removeChallenge: (id: number) => void;
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set) => ({
      challenges: {},
      activeChallenges: [],

      setChallenges: (challenges) => set((state) => ({
        challenges: challenges.reduce((acc, challenge) => {
          acc[challenge.id] = challenge;
          return acc;
        }, {} as Record<number, Challenge>),
        activeChallenges: challenges.filter(
          challenge => new Date() <= new Date(challenge.endDate)
        )
      })),

      addChallenge: (challenge) => set((state) => {
        const newChallenges = { ...state.challenges, [challenge.id]: challenge };
        return {
          challenges: newChallenges,
          activeChallenges: Object.values(newChallenges).filter(c => 
            new Date() <= new Date(c.endDate)
          )
        };
      }),

      updateChallenge: (updatedChallenge) => set((state) => {
        const newChallenges = { 
          ...state.challenges, 
          [updatedChallenge.id]: updatedChallenge 
        };
        return {
          challenges: newChallenges,
          activeChallenges: Object.values(newChallenges).filter(c =>
            new Date() <= new Date(c.endDate)
          )
        };
      }),

      removeChallenge: (id) => set((state) => {
        const { [id]: removed, ...remainingChallenges } = state.challenges;
        return {
          challenges: remainingChallenges,
          activeChallenges: Object.values(remainingChallenges).filter(c =>
            new Date() <= new Date(c.endDate)
          )
        };
      })
    }),
    {
      name: 'challenge-storage',
      version: 1,
    }
  )
);