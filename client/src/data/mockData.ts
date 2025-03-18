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
  currentParticipants?: number;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringType?: "daily" | "weekly" | "monthly";
  isArchived?: boolean;
  isActive?: boolean;
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
    isVerified: true,
    isTeamMember: true,
    teamRole: "head_trainer",
  },
  {
    id: 2,
    username: "yoga_master",
    name: "Emma Wagner",
    bio: "Yoga Instruktorin • Mindfulness Coach • Ganzheitliche Gesundheit 🧘‍♀️",
    avatar: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&auto=format",
    isAdmin: false,
    isVerified: true,
    isTeamMember: true,
    teamRole: "wellness_expert",
  },
  {
    id: 3,
    username: "strength_pro",
    name: "Mike Müller",
    bio: "Kraftsport Coach • Personal Trainer • Wettkampfvorbereitung 💪",
    avatar: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&auto=format",
    isAdmin: false,
    isVerified: false,
    isTeamMember: false,
    teamRole: null,
  },
  {
    id: 4,
    username: "nutrition_expert",
    name: "Lisa Becker",
    bio: "Ernährungswissenschaftlerin • Gesunde Rezepte • Lifestyle Coach 🥗",
    avatar: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&auto=format",
    isAdmin: false,
    isVerified: false,
    isTeamMember: false,
    teamRole: null,
  },
  {
    id: 5,
    username: "running_coach",
    name: "Thomas Weber",
    bio: "Marathonläufer • Laufgruppen Coach • Outdoor Enthusiast 🏃‍♂️",
    avatar: "https://images.unsplash.com/photo-1583468982468-4827785076ab?w=400&auto=format",
    isAdmin: false,
    isVerified: false,
    isTeamMember: false,
    teamRole: null,
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
  },
  {
    id: 6,
    title: "Winter HIIT Challenge 2024",
    description: "Intensive HIIT-Workouts für maximale Fettverbrennung",
    image: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&auto=format",
    creatorId: 1,
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    prize: "Premium Fitness Set",
    prizeDescription: "Komplettes Home-Workout-Set mit Kettlebells, Resistance Bands und digitaler Trainingsplan",
    prizeImage: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&auto=format",
    workoutType: "hiit",
    workoutDetails: {
      intervals: 8,
      workTime: 40,
      restTime: 20,
      exercises: [
        { name: "Burpees", description: "Explosiv mit Push-up" },
        { name: "Mountain Climbers", description: "Schnelles Tempo" },
        { name: "Jump Squats", description: "Maximale Höhe" }
      ]
    }
  },
  {
    id: 7,
    title: "Mobility Master Challenge",
    description: "30 Tage Beweglichkeit und Flexibilität",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&auto=format",
    creatorId: 2,
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-12-15'),
    prize: "Wellness Paket Deluxe",
    prizeDescription: "Premium Yoga-Set, Massage Gutschein und 3 Monate Online Yoga Mitgliedschaft",
    prizeImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format",
    workoutType: "mobility",
    workoutDetails: {
      timePerRound: 60,
      rounds: 5,
      exercises: [
        { name: "Deep Squat Hold", reps: 60, description: "Aktive Haltung" },
        { name: "Hip Opener Flow", reps: 45, description: "Dynamische Bewegungen" },
        { name: "Shoulder Mobility", reps: 30, description: "Kontrollierte Ausführung" }
      ]
    }
  },
  {
    id: 8,
    title: "Herbst-Marathon Vorbereitung",
    description: "8-Wochen Lauftraining für Fortgeschrittene",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format",
    creatorId: 5,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-10-31'),
    prize: "Pro Runner Bundle",
    prizeDescription: "High-End Laufschuhe, GPS-Smartwatch und professionelle Laufanalyse",
    prizeImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format",
    workoutType: "running",
    workoutDetails: {
      type: "intervals",
      timePerRound: 300,
      rounds: 6,
      exercises: [
        { name: "Progressive Tempo Run", reps: 1, description: "5km mit steigender Intensität" },
        { name: "Hill Sprints", reps: 8, description: "30 Sekunden Sprint, 60 Sekunden Erholung" },
        { name: "Long Distance", reps: 1, description: "15km steady state" }
      ]
    }
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
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format",
    type: "course",
    trainer: 1,
    location: "Fitness Studio Zentrum",
    currentParticipants: 8,
    maxParticipants: 15,
    isRecurring: true,
    recurringType: "weekly",
    isArchived: false,
    isActive: true
  },
  {
    id: 2,
    title: "Yoga im Park",
    description: "Outdoor Yoga Session für alle Level",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format",
    type: "event",
    trainer: 2,
    location: "Stadtpark",
    currentParticipants: 12,
    maxParticipants: 20,
    isRecurring: false,
    isArchived: false,
    isActive: true
  },
  {
    id: 3,
    title: "Ernährungsworkshop",
    description: "Gesunde Ernährung im Alltag",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format",
    type: "course",
    trainer: 4,
    location: "Community Center",
    currentParticipants: 15,
    maxParticipants: 15,
    isRecurring: false,
    isArchived: true,
    isActive: false
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

// Füge Übungsdatenbank hinzu
export const exerciseDatabase = {
  exercises: {
    pushups: {
      name: "Liegestütze",
      description: "Eine grundlegende Übung für die Brust-, Schulter- und Armmuskulatur",
      instruction: "1. Stützposition einnehmen, Hände schulterbreit\n2. Körper gerade halten\n3. Ellbogen beugen, bis Brust fast den Boden berührt\n4. Kontrolliert hochdrücken",
      requirements: {
        male: "Komplette Liegestütze mit gerader Körperhaltung",
        female: "Modifizierte Liegestütze mit Knien möglich"
      },
      tips: [
        "Auf gerade Körperhaltung achten",
        "Gleichmäßiges Tempo",
        "Nicht durchhängen lassen"
      ]
    },
    situps: {
      name: "Sit-ups",
      description: "Klassische Übung für die Bauchmuskulatur",
      instruction: "1. Rückenlage, Beine angewinkelt\n2. Hände hinter dem Kopf\n3. Oberkörper aufrollen\n4. Kontrolliert absenken",
      tips: [
        "Nicht am Kopf ziehen",
        "Lendenwirbelsäule am Boden lassen",
        "Gleichmäßig atmen"
      ]
    },
    burpees: {
      name: "Burpees",
      description: "Intensive Ganzkörperübung für Kraft und Ausdauer",
      instruction: "1. Stand\n2. In Liegestützposition springen\n3. Liegestütz ausführen\n4. Füße nach vorne springen\n5. Hochspringen mit gestreckten Armen",
      tips: [
        "Tempo dem Fitnesslevel anpassen",
        "Auf saubere Ausführung achten",
        "Kontrollierte Landung beim Sprung"
      ]
    }
  },
  emom: [
    { name: "Burpees", reps: [8, 10, 12], description: "Vollständige Bewegung mit Pushup" },
    { name: "Kettlebell Swings", reps: [12, 15, 20], description: "Explosiv aus der Hüfte" },
    { name: "Box Jumps", reps: [10, 12, 15], description: "Stabile Landung" },
    { name: "Wall Balls", reps: [12, 15, 18], description: "Volle Hocke, explosive Streckung" },
    { name: "Mountain Climbers", reps: [20, 25, 30], description: "Schnelles Tempo" },
    { name: "Thrusters", reps: [8, 10, 12], description: "Front Squat to Push Press" }
  ],
  amrap: [
    { name: "Push-ups", reps: [10, 15, 20], description: "Volle Range of Motion" },
    { name: "Air Squats", reps: [15, 20, 25], description: "Hüfte unter Knie" },
    { name: "Russian Twists", reps: [20, 25, 30], description: "Kontrollierte Bewegung" },
    { name: "Pull-ups", reps: [5, 8, 10], description: "Kinn über Stange" },
    { name: "Lunges", reps: [12, 16, 20], description: "Pro Bein" },
    { name: "Sit-ups", reps: [15, 20, 25], description: "Vollständige Bewegung" }
  ],
  hit: [
    { name: "Jumping Jacks", description: "Explosiv und rhythmisch" },
    { name: "High Knees", description: "Knie auf Hüfthöhe" },
    { name: "Plank Hold", description: "Körper in einer Linie" },
    { name: "Mountain Climbers", description: "Schnelles Tempo" },
    { name: "Burpees", description: "Ohne Push-up für schnelles Tempo" },
    { name: "Jump Squats", description: "Explosiv nach oben" }
  ],
  running: [
    {
      name: "Intervall-Training",
      description: "1 min schnell, 1 min langsam",
      variations: {
        "15": { intervals: 7, warmup: "5min" },
        "30": { intervals: 15, warmup: "5min" },
        "45": { intervals: 20, warmup: "10min" }
      }
    },
    {
      name: "Tempowechsel-Lauf",
      description: "Wechsel zwischen mittlerem und schnellem Tempo",
      variations: {
        "15": { blocks: 3, duration: "4min" },
        "30": { blocks: 5, duration: "5min" },
        "45": { blocks: 7, duration: "5min" }
      }
    },
    {
      name: "Distanz-Challenge",
      description: "Gleichmäßiges Tempo über Distanz",
      variations: {
        "15": { distance: 2.5, pace: "mittel" },
        "30": { distance: 5, pace: "mittel" },
        "45": { distance: 7.5, pace: "mittel" }
      }
    }
  ]
};

interface Product {
  id: number;
  name: string;
  description: string;
  type: "supplement" | "training" | "coaching";
  price: number;
  image: string;
  creatorId: number;
  isActive: boolean;
  createdAt: Date;
  metadata: {
    type: "supplement" | "training" | "coaching";
    [key: string]: any;
  };
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Premium Protein Shake",
    description: "Hochwertiges Whey Protein für optimale Regeneration. Mit BCAAs und EAAs.",
    type: "supplement",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format",
    creatorId: 1,
    isActive: true,
    createdAt: new Date(),
    metadata: {
      type: "supplement",
      weight: 1000,
      servings: 33,
      nutritionFacts: {
        "Protein pro Portion": "30g",
        "Kohlenhydrate": "3g",
        "Fett": "1.5g",
      }
    }
  },
  {
    id: 2,
    name: "12-Wochen Transformations-Programm",
    description: "Individueller Trainingsplan, Ernährungsberatung und wöchentliche Check-ins.",
    type: "training",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&auto=format",
    creatorId: 1,
    isActive: true,
    createdAt: new Date(),
    metadata: {
      type: "training",
      duration: 12,
      sessions: 48,
      includes: [
        "Individueller Trainingsplan",
        "Ernährungsberatung",
        "Wöchentliche Check-ins",
        "Video-Anleitungen"
      ]
    }
  },
  {
    id: 3,
    name: "Personal Coaching Paket",
    description: "1-zu-1 Betreuung für maximalen Erfolg. Inkl. Videoanalyse und 24/7 Support.",
    type: "coaching",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format",
    creatorId: 2,
    isActive: true,
    createdAt: new Date(),
    metadata: {
      type:"coaching",
      duration: 3,
      callsPerMonth: 4,
      includes: [
        "Wöchentliche 1:1Calls",
        "Technik-Analyse",
        "24/7 WhatsApp Support",
        "Personalisierte Pläne"
      ]
    }
  }
];

export const badgeTests = [
  {
    id: "police",
    name: "Polizei Sporttest",
    description: "Offizieller sportmotorischer Test für den Polizeidienst",
    requirements: [
      {
        name: "Pendellauf",
        requirement: "Unter 32 Sekunden (4x10m)",
        gender_specific: {
          male: "Maximal 28 Sekunden",
          female: "Maximal 32 Sekunden"
        }
      },
      {
        name: "Liegestütze",
        requirement: "In 2 Minuten",
        gender_specific: {
          male: "20 Wiederholungen",
          female: "15 Wiederholungen"
        }
      },
      {
        name: "Sit-ups",
        requirement: "In 2 Minuten",
        gender_specific: {
          male: "25 Wiederholungen",
          female: "20 Wiederholungen"
        }
      },
      {
        name: "Cooper-Test",
        requirement: "12 Minuten Lauf",
        gender_specific: {
          male: "2800m",
          female: "2400m"
        }
      },
      {
        name: "100m Schwimmen",
        requirement: "Beliebiger Stil",
        gender_specific: {
          male: "1:40 Minuten",
          female: "1:45 Minuten"
        }
      }
    ]
  },
  {
    id: "military",
    name: "Bundeswehr Basis-Fitness-Test",
    description: "Standard Fitness-Test der Bundeswehr",
    requirements: [
      { name: "Pendellauf", requirement: "11x10m in maximal 60 Sekunden" },
      { name: "Liegestütze", requirement: "15 Wiederholungen in 2 Minuten" },
      { name: "Sit-ups", requirement: "25 Wiederholungen in 2 Minuten" },
      { name: "3000m Lauf", requirement: "Unter 15 Minuten" }
    ]
  },
  {
    id: "us_army",
    name: "US Army Fitness-Test (ACFT)",
    description: "Army Combat Fitness Test - Standardisierter Militär-Fitness-Test der US-Armee",
    requirements: [
      { name: "Kreuzheben (Deadlift)", requirement: "63-154 kg (140-340 lbs)" },
      { name: "Medizinballwurf rückwärts (Standing Power Throw)", requirement: "8,5 Meter (27.9 ft)" },
      { name: "Liegestütze mit Abheben (Hand Release Push-ups)", requirement: "30 Wiederholungen in 2 Minuten" },
      { name: "Sprint-Zug-Trage-Kombination (Sprint-Drag-Carry)", requirement: "Unter 3 Minuten" },
      { name: "Beinheben/Unterarmstütz (Leg Tuck/Plank)", requirement: "20 Wiederholungen oder 2:09 Minuten" },
      { name: "2-Meilen Lauf (2-Mile Run)", requirement: "3,2 km in unter 21 Minuten" }
    ]
  },
  {
    id: "cooper",
    name: "Cooper Test",
    description: "12-Minuten Ausdauertest nach Kenneth Cooper",
    requirements: [
      { 
        name: "12-Minuten Lauf",
        levels: [
          { level: "Sehr gut", requirement: "> 2800m" },
          { level: "Gut", requirement: "2400-2800m" },
          { level: "Durchschnitt", requirement: "2200-2399m" },
          { level: "Ausreichend", requirement: "1600-2199m" }
        ]
      }
    ]
  },
  {
    id: "marathon",
    name: "Marathon Challenge",
    description: "Volle Marathon-Distanz (42,195 km)",
    requirements: [
      { name: "Marathon", requirement: "42,195 km" },
      { 
        name: "Zeitlimits",
        levels: [
          { level: "Elite", requirement: "< 2:30:00" },
          { level: "Fortgeschritten (Advanced)", requirement: "< 3:00:00" },
          { level: "Mittelstufe (Intermediate)", requirement: "< 4:00:00" },
          { level: "Anfänger (Beginner)", requirement: "< 6:00:00" }
        ]
      }
    ]
  },
  {
    id: "half_marathon",
    name: "Halbmarathon Challenge",
    description: "Halbe Marathon-Distanz (21,0975 km)",
    requirements: [
      { name: "Halbmarathon", requirement: "21,0975 km" },
      { 
        name: "Zeitlimits",
        levels: [
          { level: "Elite", requirement: "< 1:15:00" },
          { level: "Fortgeschritten (Advanced)", requirement: "< 1:30:00" },
          { level: "Mittelstufe (Intermediate)", requirement: "< 2:00:00" },
          { level: "Anfänger (Beginner)", requirement: "< 3:00:00" }
        ]
      }
    ]
  },
  {
    id: "triathlon_sprint",
    name: "Sprint Triathlon",
    description: "Sprint-Distanz Triathlon",
    requirements: [
      { name: "Schwimmen", requirement: "750m" },
      { name: "Radfahren", requirement: "20km" },
      { name: "Laufen", requirement: "5km" },
      {
        name: "Gesamtzeit",
        levels: [
          { level: "Elite", requirement: "< 1:00:00" },
          { level: "Fortgeschritten (Advanced)", requirement: "< 1:15:00" },
          { level: "Mittelstufe (Intermediate)", requirement: "< 1:30:00" },
          { level: "Anfänger (Beginner)", requirement: "< 2:00:00" }
        ]
      }
    ]
  }
];