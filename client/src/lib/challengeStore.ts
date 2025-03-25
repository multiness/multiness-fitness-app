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
  activeChallenges: Challenge[];
  allChallenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (challenge: Challenge) => void;
  removeChallenge: (id: number) => void;
}

export const useChallenges = create<ChallengeStore>()(
  persist(
    (set) => ({
      activeChallenges: [],
      allChallenges: [],

      setChallenges: (challenges) => set((state) => ({
        allChallenges: challenges,
        activeChallenges: challenges.filter(
          challenge => new Date() <= new Date(challenge.endDate)
        )
      })),

      addChallenge: (challenge) => set((state) => ({
        allChallenges: [...state.allChallenges, challenge],
        activeChallenges: new Date() <= new Date(challenge.endDate)
          ? [...state.activeChallenges, challenge]
          : state.activeChallenges
      })),

      updateChallenge: (updatedChallenge) => set((state) => ({
        allChallenges: state.allChallenges.map(challenge =>
          challenge.id === updatedChallenge.id ? updatedChallenge : challenge
        ),
        activeChallenges: state.activeChallenges.map(challenge =>
          challenge.id === updatedChallenge.id ? updatedChallenge : challenge
        ).filter(challenge => new Date() <= new Date(challenge.endDate))
      })),

      removeChallenge: (id) => set((state) => ({
        allChallenges: state.allChallenges.filter(c => c.id !== id),
        activeChallenges: state.activeChallenges.filter(c => c.id !== id)
      }))
    }),
    {
      name: 'challenges-storage',
      version: 1,
    }
  )
);