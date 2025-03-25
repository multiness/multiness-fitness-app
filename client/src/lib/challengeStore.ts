import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockChallenges } from '../data/mockData';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  prize: string | null;
  prizeDescription: string | null;
  workoutType: string;
  workoutDetails: any;
  creatorId: number;
  image: string | null;
  prizeImage: string | null;
}

interface ChallengeStore {
  challenges: Record<number, Challenge>;
  addChallenge: (challenge: Challenge) => void;
  getChallenge: (id: number) => Challenge | undefined;
  getAllChallenges: () => Challenge[];
  updateChallenge: (id: number, challenge: Partial<Challenge>) => void;
  deleteChallenge: (id: number) => void;
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: mockChallenges.reduce((acc, challenge) => {
        acc[challenge.id] = {
          ...challenge,
          startDate: new Date(challenge.startDate),
          endDate: new Date(challenge.endDate)
        };
        return acc;
      }, {} as Record<number, Challenge>),

      addChallenge: (challenge) =>
        set((state) => ({
          challenges: {
            ...state.challenges,
            [challenge.id]: challenge
          }
        })),

      getChallenge: (id) => get().challenges[id],

      getAllChallenges: () => Object.values(get().challenges),

      updateChallenge: (id, updatedChallenge) =>
        set((state) => ({
          challenges: {
            ...state.challenges,
            [id]: {
              ...state.challenges[id],
              ...updatedChallenge
            }
          }
        })),

      deleteChallenge: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.challenges;
          return { challenges: rest };
        })
    }),
    {
      name: 'challenge-storage',
      skipHydration: false
    }
  )
);
