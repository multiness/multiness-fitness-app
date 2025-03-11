import { User, Post, Challenge, Group } from "@shared/schema";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  image: string;
  type: "event" | "course";
  trainer: number; // userId des Trainers
  location: string;
}

interface WorkoutGoal {
  id: string;
  name: string;
  description: string;
}

export const workoutGoals: WorkoutGoal[] = [
  {
    id: "strength",
    name: "Kraftaufbau",
    description: "Fokus auf Muskelaufbau und Kraftsteigerung"
  },
  {
    id: "endurance",
    name: "Ausdauer",
    description: "Verbesserung der Kondition und Ausdauer"
  },
  {
    id: "hiit",
    name: "HIIT & Kondition",
    description: "Intensive Intervalle für maximale Fettverbrennung"
  },
  {
    id: "flexibility",
    name: "Beweglichkeit",
    description: "Verbesserung der Mobilität und Flexibilität"
  }
];

export const mockUsers: User[] = [
  {
    id: 1,
    username: "fitness_coach",
    name: "Sarah Schmidt",
    bio: "Zertifizierte Fitness Trainerin & Ernährungsberaterin 🏋️‍♀️",
    avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&auto=format",
    isAdmin: true,
  },
  {
    id: 2,
    username: "yoga_master",
    name: "Emma Wagner",
    bio: "Yoga Instruktorin • Mindfulness Coach • Ganzheitliche Gesundheit 🧘‍♀️",
    avatar: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&auto=format",
    isAdmin: false,
  },
  {
    id: 3,
    username: "strength_pro",
    name: "Mike Müller",
    bio: "Kraftsport Coach • Personal Trainer • Wettkampfvorbereitung 💪",
    avatar: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&auto=format",
    isAdmin: false,
  },
  {
    id: 4,
    username: "nutrition_expert",
    name: "Lisa Becker",
    bio: "Ernährungswissenschaftlerin • Gesunde Rezepte • Lifestyle Coach 🥗",
    avatar: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&auto=format",
    isAdmin: false,
  },
  {
    id: 5,
    username: "running_coach",
    name: "Thomas Weber",
    bio: "Marathonläufer • Laufgruppen Coach • Outdoor Enthusiast 🏃‍♂️",
    avatar: "https://images.unsplash.com/photo-1583468982468-4827785076ab?w=400&auto=format",
    isAdmin: false,
  }
];

export const mockPosts: Post[] = [
  {
    id: 1,
    userId: 1,
    content: "Intensives HIIT-Training heute! 💪 Denkt dran: Konsistenz ist der Schlüssel zum Erfolg. Wer ist morgen beim Workout dabei?",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format",
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
  },
  {
    id: 2,
    userId: 2,
    content: "Morgen-Yoga Flow für einen energiegeladenen Start in den Tag 🧘‍♀️ Namaste!",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 3,
    userId: 3,
    content: "Neuer Personal Record beim Kreuzheben! 💪 Wichtig: Immer auf die richtige Form achten.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format",
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: 4,
    userId: 4,
    content: "Meal Prep Sonntag! Meine Lieblings-Protein Bowl: Quinoa, Hähnchen, Avocado und geröstetes Gemüse. 🥗",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format",
    createdAt: new Date(Date.now() - 10800000), // 3 hours ago
  },
  {
    id: 5,
    userId: 1,
    content: "Quick Tipp: Bleibt hydriert während des Trainings! 💧 Ziel: 2-3 Liter Wasser täglich.",
    image: "https://images.unsplash.com/photo-1511405946472-a37e3b5ccd47?w=800&auto=format",
    createdAt: new Date(Date.now() - 14400000), // 4 hours ago
  },
  {
    id: 6,
    userId: 5,
    content: "Toller Morgenlauf durch Heidelberg! 🌅 Die perfekte Route entlang des Neckars.",
    image: "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=800&auto=format",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: 7,
    userId: 2,
    content: "Heute im Workshop: Stress-Abbau durch Meditation und sanfte Bewegungen 🧘‍♀️ #Achtsamkeit",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format",
    createdAt: new Date(Date.now() - 90000000), // 25 hours ago
  },
  {
    id: 8,
    userId: 4,
    content: "Gesunder Snack Alert! 🍎 Selbstgemachte Energiebällchen mit Datteln, Nüssen und Kakao. Perfekt für zwischendurch!",
    image: "https://images.unsplash.com/photo-1604423043492-41503678e31e?w=800&auto=format",
    createdAt: new Date(Date.now() - 95000000), // 26 hours ago
  },
  {
    id: 9,
    userId: 3,
    content: "Mobility Training ist der Schlüssel zu besserer Performance 💯 Hier sind meine Top 3 Übungen für mehr Beweglichkeit!",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
    createdAt: new Date(Date.now() - 100000000), // 28 hours ago
  },
  {
    id: 10,
    userId: 5,
    content: "Perfektes Wetter für einen Trail Run im Odenwald 🌲 Natur pur!",
    image: "https://images.unsplash.com/photo-1551698618-1dafe1857bd8?w=800&auto=format",
    createdAt: new Date(Date.now() - 150000000), // 41 hours ago
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: 1,
    title: "30 Tage Liegestütz-Challenge",
    description: "Täglich 100 Liegestütze für 30 Tage - Steigere deine Kraft!",
    image: "https://images.unsplash.com/photo-1598971639058-999901d5a461?w=800&auto=format",
    creatorId: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    prize: "Protein Mega Pack",
    prizeDescription: "Ein Monatsvorrat Premium Protein Shake (2.5kg) + Shaker + Supplement Guide",
    prizeImage: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format",
  },
  {
    id: 2,
    title: "Sommer Transformation",
    description: "12-Wochen komplette Körpertransformation Challenge",
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&auto=format",
    creatorId: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    prize: "Jahres-Fitness-Paket",
    prizeDescription: "1 Jahr Premium Mitgliedschaft + 5 Personal Training Sessions + Ernährungsplan",
    prizeImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format",
  },
  {
    id: 3,
    title: "Morgenyoga Challenge",
    description: "21 Tage Morgenroutine für mehr Energie und Flexibilität",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format",
    creatorId: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    prize: "Yoga Starter Kit",
    prizeDescription: "Premium Yogamatte + Yoga Block Set + 3 Online Kurse",
    prizeImage: "https://images.unsplash.com/photo-1552286450-4a669f880062?w=800&auto=format",
  },
  {
    id: 4,
    title: "10k Lauf Vorbereitung",
    description: "8-Wochen Trainingsplan für deinen ersten 10k Lauf",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format",
    creatorId: 5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
    prize: "Runner's Dream Pack",
    prizeDescription: "Premium Laufschuhe + Sport Smartwatch + Laufbekleidung Set",
    prizeImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format",
  },
  {
    id: 5,
    title: "Clean Eating Challenge",
    description: "4 Wochen gesunde Ernährung - Rezepte und Meal Prep Tipps",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    creatorId: 4,
    startDate: new Date(),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    prize: "Healthy Kitchen Set",
    prizeDescription: "Hochleistungsmixer + Meal Prep Container Set + Bio-Kochbuch",
    prizeImage: "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=800&auto=format",
  }
];

export const mockGroups: Group[] = [
  {
    id: 1,
    name: "Low Carb Lifestyle",
    description: "Gesunde Ernährung mit reduziertem Kohlenhydratanteil 🥑",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    creatorId: 4,
  },
  {
    id: 2,
    name: "Laufgruppe Heidelberg",
    description: "Gemeinsames Laufen entlang des Neckars und Philosophenweg 🏃‍♂️",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format",
    creatorId: 5,
  },
  {
    id: 3,
    name: "After Training Treff",
    description: "Socializing nach dem Workout - Protein Shakes & gute Gespräche 🥤",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format",
    creatorId: 1,
  },
  {
    id: 4,
    name: "Community Talk",
    description: "Austausch über Fitness, Gesundheit und Lifestyle 💭",
    image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&auto=format",
    creatorId: 2,
  },
  {
    id: 5,
    name: "Fitness Education Hub",
    description: "Workshops, Seminare und Weiterbildung im Fitnessbereich 📚",
    image: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&auto=format",
    creatorId: 3,
  },
  {
    id: 6,
    name: "HIIT Warriors",
    description: "High Intensity Interval Training Community 🔥",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format",
    creatorId: 1,
  },
  {
    id: 7,
    name: "Yoga & Meditation",
    description: "Innere Ruhe und Flexibilität durch Yoga 🧘‍♀️",
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format",
    creatorId: 2,
  },
  {
    id: 8,
    name: "Ernährungsberatung",
    description: "Tipps und Tricks für eine ausgewogene Ernährung 🥗",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    creatorId: 4,
  }
];

export const mockEvents: Event[] = [
  {
    id: 1,
    title: "HIIT Masterclass",
    description: "Intensives Gruppen-Workout mit Intervalltraining",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 Tagen
    image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format",
    type: "course",
    trainer: 1,
    location: "Fitness Studio Zentrum"
  },
  {
    id: 2,
    title: "Yoga im Park",
    description: "Outdoor Yoga Session für alle Level",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format",
    type: "event",
    trainer: 2,
    location: "Stadtpark"
  },
  {
    id: 3,
    title: "Ernährungsworkshop",
    description: "Gesunde Ernährung im Alltag",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    type: "course",
    trainer: 4,
    location: "Community Center"
  },
  {
    id: 4,
    title: "Lauf-Technik Seminar",
    description: "Optimiere deinen Laufstil",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format",
    type: "course",
    trainer: 5,
    location: "Sportzentrum"
  },
  {
    id: 5,
    title: "Kraft & Mobility Workshop",
    description: "Grundlagen der Beweglichkeit und Krafttraining",
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
    type: "course",
    trainer: 3,
    location: "Fitness Studio Nord"
  }
];

export const mockWorkoutTemplates = [
  {
    id: 1,
    name: "HIIT Klassiker",
    description: "20-20-20 Intervalle mit Grundübungen",
    creatorId: 1,
    workoutType: "hit",
    duration: 20, // Minuten
    difficulty: "mittel",
    goal: "hiit",
    workoutDetails: {
      intervals: 8,
      workTime: 20,
      restTime: 20,
      exercises: [
        { name: "Burpees", description: "Vollständige Bewegung mit Pushup" },
        { name: "Mountain Climbers", description: "Schnelles Tempo" },
        { name: "Jump Squats", description: "Explosiv nach oben" }
      ]
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    name: "EMOM Kraft",
    description: "Kraftbasiertes EMOM für Fortgeschrittene",
    creatorId: 3,
    workoutType: "emom",
    duration: 30,
    difficulty: "fortgeschritten",
    goal: "strength",
    workoutDetails: {
      timePerRound: 60,
      rounds: 10,
      exercises: [
        { name: "Kettlebell Swings", reps: 15, description: "24kg / 16kg" },
        { name: "Push-ups", reps: 10, description: "Volle ROM" },
        { name: "Box Jumps", reps: 12, description: "60cm Box" }
      ]
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    name: "10k Vorbereitung",
    description: "Basis-Template für 10k Lauftraining",
    creatorId: 5,
    workoutType: "running",
    duration: 60,
    difficulty: "mittel",
    goal: "endurance",
    workoutDetails: {
      type: "distance",
      target: 10,
      description: "10km Lauf mit Intervallen: 1km warm up, 8km steady state, 1km cool down"
    },
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
  },
  {
    id: 4,
    name: "Mobility Flow",
    description: "Dynamische Beweglichkeitsübungen",
    creatorId: 2,
    workoutType: "custom",
    duration: 45,
    difficulty: "anfänger",
    goal: "flexibility",
    workoutDetails: {
      description: "Ganzheitliches Mobility Training",
      exercises: [
        { name: "Deep Squat Hold", time: 60, description: "Mit aktiver Haltung" },
        { name: "World's Greatest Stretch", time: 45, description: "Pro Seite" },
        { name: "Downward to Upward Dog Flow", time: 30, description: "Fließende Bewegungen" }
      ]
    },
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  }
];