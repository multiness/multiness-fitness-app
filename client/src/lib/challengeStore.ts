import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkoutType = 'emom' | 'amrap' | 'custom' | 'running';

export type Challenge = {
  id: number;
  title: string;
  description: string;
  workoutType: WorkoutType;
  workoutDetails: any;
  image?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  participantIds: number[];
  creatorId: number;
  startDate: string;
  endDate: string;
  prize?: string;
};

type ChallengeStore = {
  challenges: Record<number, Challenge>;
  joinedChallenges: number[];
  createChallenge: (challenge: Omit<Challenge, 'id'>) => number;
  joinChallenge: (challengeId: number) => void;
  leaveChallenge: (challengeId: number) => void;
  isChallengeParticipant: (challengeId: number) => boolean;
  updateChallenge: (challengeId: number, data: Partial<Challenge>) => void;
};

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: {},
      joinedChallenges: [],

      createChallenge: (challengeData) => {
        const id = Date.now();
        const challenge = { ...challengeData, id };

        set((state) => ({
          challenges: {
            ...state.challenges,
            [id]: challenge
          },
          joinedChallenges: [...state.joinedChallenges, id]
        }));

        return id;
      },

      joinChallenge: (challengeId) => 
        set((state) => ({
          joinedChallenges: [...state.joinedChallenges, challengeId]
        })),

      leaveChallenge: (challengeId) =>
        set((state) => ({
          joinedChallenges: state.joinedChallenges.filter(id => id !== challengeId)
        })),

      isChallengeParticipant: (challengeId) =>
        get().joinedChallenges.includes(challengeId),

      updateChallenge: (challengeId, data) => {
        set((state) => ({
          challenges: {
            ...state.challenges,
            [challengeId]: {
              ...state.challenges[challengeId],
              ...data
            }
          }
        }));
      }
    }),
    {
      name: 'challenge-storage',
      version: 1,
    }
  )
);