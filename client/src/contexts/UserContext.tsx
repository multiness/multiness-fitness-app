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

  // Benutzer aktualisieren und zum Server senden
  const updateCurrentUser = async (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);

    // Benutzer in der Benutzerliste aktualisieren
    const updatedUsers = users.map((user: User) =>
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);

    // Zum Server senden
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        console.log("Profiländerungen wurden erfolgreich auf dem Server gespeichert");
      } else {
        console.error("Fehler beim Speichern der Profiländerungen auf dem Server:", await response.text());
      }
    } catch (error) {
      console.error("Fehler bei der Kommunikation mit dem Server:", error);
    }

    // In localStorage speichern
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  // Verifikationsstatus umschalten und zum Server senden
  const toggleVerification = async (userId: number) => {
    // Suche den betroffenen Benutzer
    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) return;
    
    const isVerified = !userToUpdate.isVerified;
    
    // In lokaler Liste aktualisieren
    const updatedUsers = users.map((user: User) =>
      user.id === userId
        ? { ...user, isVerified }
        : user
    );
    setUsers(updatedUsers);
    
    // Aktuellen Benutzer aktualisieren, falls es sich um denselben handelt
    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = { ...currentUser, isVerified };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
    }
    
    // Zum Server senden
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified }),
      });
      
      if (response.ok) {
        console.log(`Verifikationsstatus des Benutzers ${userId} wurde erfolgreich aktualisiert`);
      } else {
        console.error(`Fehler beim Aktualisieren des Verifikationsstatus für Benutzer ${userId}:`, await response.text());
      }
    } catch (error) {
      console.error("Fehler bei der Kommunikation mit dem Server:", error);
    }
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  // Neuen Benutzer erstellen und zum Server senden
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

    // Zum Server senden (async, aber für Interface-Kompatibilität synchron)
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Fehler beim Erstellen des Benutzers: ${response.status}`);
      }
    })
    .then(savedUser => {
      console.log("Neuer Benutzer wurde erfolgreich erstellt:", savedUser);
      
      // Verwenden der vom Server zurückgegebenen Daten (inkl. korrekter ID)
      const updatedUsers = [...users, savedUser];
      setUsers(updatedUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    })
    .catch(error => {
      console.error("Fehler bei der Kommunikation mit dem Server:", error);
    });

    // Lokale Fallback-Lösung, falls Server-Kommunikation fehlschlägt
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

  // Synchronisierung mit der API alle 30 Sekunden
  useEffect(() => {
    const syncUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const apiUsers = await response.json();
          console.log("API-Benutzer synchronisiert:", apiUsers);
          
          // Aktuellen Benutzer in der neuen Liste finden
          const currentId = currentUser?.id;
          const currentInList = apiUsers.find((u: User) => u.id === currentId);
          
          // Setze die neuen Benutzer
          setUsers(apiUsers);
          
          // Aktualisiere den aktuellen Benutzer, wenn er in der neuen Liste gefunden wurde
          if (currentInList) {
            setCurrentUser(currentInList);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentInList));
          } else if (apiUsers.length > 0) {
            // Fallback: Ersten Benutzer verwenden
            setCurrentUser(apiUsers[0]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUsers[0]));
          }
          
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(apiUsers));
        }
      } catch (error) {
        console.error("Fehler bei der Benutzersynchronisierung:", error);
      }
    };
    
    // Erste Synchronisierung
    syncUsers();
    
    // Synchronisierung alle 30 Sekunden
    const intervalId = setInterval(syncUsers, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      users, 
      currentUser, 
      updateCurrentUser, 
      toggleVerification,
      getAllUsers: () => users,
      createUser,
      getUsersFromStorage: () => users // Gib die aktuelle Benutzerliste zurück, nicht mehr async
    }}>
      {isLoading ? <div>Lade Benutzerdaten...</div> : children}
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

// Hilfsfunktion zum synchronen Laden der API-Benutzer (nur für andere Komponenten)
export function loadAPIUsers() {
  fetch('/api/users')
    .then(response => response.json())
    .then(users => {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      console.log("Benutzer von API aktualisiert:", users);
      return users;
    })
    .catch(error => {
      console.error("Fehler beim Aktualisieren der Benutzer von der API:", error);
    });
}