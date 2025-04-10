import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/userTypes";

interface UserContextType {
  users: User[];
  currentUser: User | null;
  updateCurrentUser: (userData: Partial<User>) => void;
  toggleVerification: (userId: number) => void;
  getAllUsers: () => User[];
  createUser: (userData: Partial<User>) => User;
  getUsersFromStorage: () => User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Konstanten für localStorage Keys - für einheitliche Verwendung in der gesamten App
export const STORAGE_KEY = 'fitness-app-user';
export const USERS_STORAGE_KEY = 'fitness-app-users';

// Standard-Benutzer, falls keine vorhanden sind
const DEFAULT_USER: User = {
  id: 1,
  username: "fitness_coach",
  name: "Coach Mo",
  bio: "Certified Fitness Trainer & Nutrition Expert 🏋️‍♀️",
  avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&auto=format",
  isAdmin: true,
  isVerified: true,
  isTeamMember: true,
  teamRole: "head_trainer",
};

export function UserProvider({ children }: { children: ReactNode }) {
  // Hilfsfunktion zum Laden der Benutzer aus der API und als Fallback aus localStorage
  const getUsersFromStorage = async (): Promise<User[]> => {
    try {
      // Versuche, Benutzer von der API zu laden
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        // Speichere die geladenen Benutzer im localStorage
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log("Benutzer erfolgreich von API geladen:", users);
        return Array.isArray(users) ? users : [DEFAULT_USER];
      } else {
        throw new Error('Benutzer konnten nicht von der API geladen werden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer von API, versuche localStorage:', error);
      
      // Fallback: Versuche, Benutzer aus dem localStorage zu laden
      try {
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          return Array.isArray(parsedUsers) ? parsedUsers : [DEFAULT_USER];
        }
      } catch (localError) {
        console.error('Fehler beim Laden der Benutzer aus localStorage:', localError);
      }
    }
    // Default-Benutzer zurückgeben, wenn keine Benutzer gefunden wurden
    return [DEFAULT_USER];
  };

  // Hilfsfunktion zum Laden des aktuellen Benutzers - nur als Fallback
  const loadCurrentUser = (): User => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Fehler beim Laden des aktuellen Benutzers:', error);
    }
    
    // Default-Benutzer zurückgeben
    return DEFAULT_USER;
  };

  // Zustand initialisieren
  const [users, setUsers] = useState<User[]>([DEFAULT_USER]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Benutzer von der API beim ersten Rendern
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const loadedUsers = await getUsersFromStorage();
        setUsers(loadedUsers);
        
        // Setze den aktuellen Benutzer auf den ersten Benutzer oder DEFAULT_USER
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Prüfe, ob der Benutzer in der geladenen Liste existiert
          const foundUser = loadedUsers.find((u: User) => u.id === parsedUser.id);
          if (foundUser) {
            setCurrentUser(foundUser);
          } else {
            setCurrentUser(loadedUsers[0] || DEFAULT_USER);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedUsers[0] || DEFAULT_USER));
          }
        } else {
          setCurrentUser(loadedUsers[0] || DEFAULT_USER);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedUsers[0] || DEFAULT_USER));
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Benutzer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Benutzer aktualisieren
  const updateCurrentUser = (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);

    // Benutzer in der Benutzerliste aktualisieren
    const updatedUsers = users.map((user: User) =>
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);

    // In localStorage speichern
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  // Verifikationsstatus umschalten
  const toggleVerification = (userId: number) => {
    const updatedUsers = users.map((user: User) =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    );
    setUsers(updatedUsers);
    
    // Aktuellen Benutzer aktualisieren, falls es sich um denselben handelt
    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = { ...currentUser, isVerified: !currentUser.isVerified };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
    }
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  // Neuen Benutzer erstellen
  const createUser = (userData: Partial<User>): User => {
    const newUserId = Math.max(0, ...users.map(u => u.id)) + 1;
    const newUser: User = {
      id: newUserId,
      username: userData.username || `user_${newUserId}`,
      name: userData.name || `User ${newUserId}`,
      bio: userData.bio || "",
      avatar: userData.avatar || "https://via.placeholder.com/150",
      isAdmin: userData.isAdmin || false,
      isVerified: userData.isVerified || false,
      isTeamMember: userData.isTeamMember || false,
      teamRole: userData.teamRole || null,
      ...userData
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return newUser;
  };

  // Änderungen im localStorage speichern
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ 
      users, 
      currentUser, 
      updateCurrentUser, 
      toggleVerification,
      getAllUsers: () => users,
      createUser,
      getUsersFromStorage
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook für Zugriff auf die Benutzerliste
export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
}

// Hook für Zugriff auf den aktuellen Benutzer
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return { user: context.currentUser };
}

// Hilfsfunktion für Komponenten, die den Hook nicht direkt nutzen können
export function getUsersFromStorage(): User[] {
  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      return Array.isArray(parsedUsers) ? parsedUsers : [DEFAULT_USER];
    }
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error);
  }
  return [DEFAULT_USER];
}