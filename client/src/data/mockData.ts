import { User, Post, Challenge, Group } from "@shared/schema";

export const mockUsers: User[] = [
  {
    id: 1,
    username: "fitnessguru",
    name: "Sarah Smith",
    bio: "Certified trainer & nutrition expert",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    isAdmin: true,
  },
  // Add more mock users...
];

export const mockPosts: Post[] = [
  {
    id: 1,
    userId: 1,
    content: "Just finished an amazing HIIT session! 💪",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format",
    createdAt: new Date(),
  },
  // Add more mock posts...
];

export const mockChallenges: Challenge[] = [
  {
    id: 1,
    title: "30 Days Push-up Challenge",
    description: "Do 100 push-ups every day for 30 days",
    image: "https://images.unsplash.com/photo-1598971639058-999901d5a461?w=800&auto=format",
    creatorId: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  // Add more mock challenges...
];

export const mockGroups: Group[] = [
  {
    id: 1,
    name: "Morning Yoga Squad",
    description: "Early birds catching the zen vibes",
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format",
    creatorId: 1,
  },
  // Add more mock groups...
];
