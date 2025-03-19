import { create } from 'zustand';
import { mockChallenges } from '../data/mockData';

interface Challenge {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  prize: string | null;
  prizeDescription: string | null;
  workoutType: string;
  workoutDetails: any;
  creatorId: number;
  image: string | null;
  prizeImage: string | null;
}

interface ChallengeStore {
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: number, challenge: Partial<Challenge>) => void;
  getChallenge: (id: number) => Challenge | undefined;
  initialize: () => void;
}

// Convert dates to strings when storing
const serializeChallenge = (challenge: any): Challenge => ({
  ...challenge,
  startDate: challenge.startDate instanceof Date ? challenge.startDate.toISOString() : challenge.startDate,
  endDate: challenge.endDate instanceof Date ? challenge.endDate.toISOString() : challenge.endDate,
});

// Load challenges from localStorage or use mockChallenges as initial data
const loadChallenges = (): Challenge[] => {
  const stored = localStorage.getItem('challenges');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if nothing is stored
  const serializedChallenges = mockChallenges.map(serializeChallenge);
  localStorage.setItem('challenges', JSON.stringify(serializedChallenges));
  return serializedChallenges;
};

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  challenges: [],

  initialize: () => {
    set({ challenges: loadChallenges() });
  },

  addChallenge: (challenge) => {
    set((state) => {
      const serializedChallenge = serializeChallenge(challenge);
      const newChallenges = [...state.challenges, serializedChallenge];
      localStorage.setItem('challenges', JSON.stringify(newChallenges));
      return { challenges: newChallenges };
    });
  },

  updateChallenge: (id, challenge) => {
    set((state) => {
      const newChallenges = state.challenges.map(c => 
        c.id === id ? { ...c, ...serializeChallenge(challenge) } : c
      );
      localStorage.setItem('challenges', JSON.stringify(newChallenges));
      return { challenges: newChallenges };
    });
  },

  getChallenge: (id) => {
    return get().challenges.find(c => c.id === id);
  }
}));

// Initialize the store when the file is imported
useChallengeStore.getState().initialize();