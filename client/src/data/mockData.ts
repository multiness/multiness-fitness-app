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
  {
    id: 2,
    username: "yogalover",
    name: "Emma Wilson",
    bio: "Finding peace through yoga 🧘‍♀️",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    isAdmin: false,
  },
  {
    id: 3,
    username: "strengthcoach",
    name: "Mike Johnson",
    bio: "Professional strength coach 💪",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    isAdmin: false,
  },
  {
    id: 4,
    username: "nutritionist",
    name: "Lisa Brown",
    bio: "Helping you eat better 🥗",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    isAdmin: false,
  }
];

export const mockPosts: Post[] = [
  {
    id: 1,
    userId: 1,
    content: "Just finished an amazing HIIT session! 💪 Remember: consistency is key to achieving your fitness goals. Who's joining me for tomorrow's workout?",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format",
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
  },
  {
    id: 2,
    userId: 2,
    content: "Morning yoga flow to start the day right 🧘‍♀️ Namaste everyone!",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 3,
    userId: 3,
    content: "New personal record on deadlifts today! 💪 Remember to always maintain proper form and listen to your body.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format",
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: 4,
    userId: 4,
    content: "Meal prep Sunday! Here's my go-to high-protein lunch: quinoa bowl with grilled chicken, avocado, and roasted veggies. 🥗",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format",
    createdAt: new Date(Date.now() - 10800000), // 3 hours ago
  },
  {
    id: 5,
    userId: 1,
    content: "Quick tip: Stay hydrated during your workouts! 💧 Aim for at least 2-3 liters of water daily.",
    createdAt: new Date(Date.now() - 14400000), // 4 hours ago
  },
  {
    id: 6,
    userId: 3,
    content: "Saturday morning motivation! Remember why you started. 🎯",
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  }
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
  {
    id: 2,
    title: "Summer Transformation",
    description: "12-week complete body transformation challenge",
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&auto=format",
    creatorId: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }
];

export const mockGroups: Group[] = [
  {
    id: 1,
    name: "Morning Yoga Squad",
    description: "Early birds catching the zen vibes",
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format",
    creatorId: 2,
  },
  {
    id: 2,
    name: "HIIT Warriors",
    description: "High Intensity Interval Training community",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format",
    creatorId: 1,
  },
  {
    id: 3,
    name: "Nutrition Support",
    description: "Share healthy recipes and nutrition tips",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    creatorId: 4,
  },
  {
    id: 4,
    name: "Strength Training",
    description: "For powerlifting and strength training enthusiasts",
    image: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&auto=format",
    creatorId: 3,
  }
];