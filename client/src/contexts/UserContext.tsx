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
  username: "maxmustermann",
  name: "Max Mustermann",
  bio: "Fitness-Enthusiast und Marathonläufer",
  avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  isAdmin: true,
  isVerified: true,
  isTeamMember: true,
  teamRole: "head_trainer",
  email: "max@example.com",
  createdAt: new Date().toISOString()
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([DEFAULT_USER]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hilfsfunktion zum Komprimieren von Bildern
  const compressImage = (dataUrl: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Skaliere das Bild herunter, wenn es zu groß ist
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Konnte Canvas-Kontext nicht erstellen'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Qualität auf 0.7 (70%) reduzieren
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      
      img.onerror = (err) => {
        reject(err);
      };
      
      img.src = dataUrl;
    });
  };

  // Initialisierung: Lade Benutzer IMMER vom Server, falls verfügbar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // IMMER zuerst vom Server laden (wichtig für Desktop/Mobile-Konsistenz)
        try {
          console.log("Lade Benutzerdaten vom Server bei Initialisierung...");
          const response = await fetch('/api/users');
          if (response.ok) {
            const apiUsers = await response.json();
            if (Array.isArray(apiUsers) && apiUsers.length > 0) {
              console.log("Benutzer vom Server geladen:", apiUsers);
              setUsers(apiUsers);
              
              // Aktualisiere lokalen Speicher mit Server-Daten
              localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(apiUsers));
              
              // Prüfe auf gespeicherten Current User ID
              const savedUser = localStorage.getItem(STORAGE_KEY);
              if (savedUser) {
                try {
                  const parsedUser = JSON.parse(savedUser);
                  // WICHTIG: Immer den aktuellen Benutzer aus der API-Liste nehmen
                  const foundUser = apiUsers.find((u: User) => u.id === parsedUser.id);
                  if (foundUser) {
                    console.log("Aktueller Benutzer von API aktualisiert:", foundUser);
                    setCurrentUser(foundUser);
                    // Aktualisiere den lokalen Speicher mit der aktualisierten Version
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
                  } else {
                    console.log("Benutzer nicht in API-Daten gefunden, verwende ersten Benutzer");
                    setCurrentUser(apiUsers[0]);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUsers[0]));
                  }
                } catch (parseError) {
                  console.warn("Fehler beim Parsen des gespeicherten Benutzers:", parseError);
                  setCurrentUser(apiUsers[0]);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUsers[0]));
                }
              } else {
                // Kein gespeicherter Benutzer, verwende den ersten aus der API
                console.log("Kein gespeicherter Benutzer, verwende ersten Benutzer aus API");
                setCurrentUser(apiUsers[0]);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUsers[0]));
              }
              
              setIsLoading(false);
              return;
            }
          } else {
            console.warn("API Antwort nicht OK:", response.status);
          }
        } catch (apiError) {
          console.warn("Fehler beim Laden der Benutzer von der API:", apiError);
        }
        
        // NUR wenn Server nicht verfügbar ist: Aus localStorage laden
        console.log("Server nicht verfügbar, lade aus localStorage...");
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const savedCurrentUser = localStorage.getItem(STORAGE_KEY);
        
        let loadedUsers = [DEFAULT_USER];
        if (savedUsers) {
          try {
            const parsedUsers = JSON.parse(savedUsers);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
              loadedUsers = parsedUsers;
            }
          } catch (e) {
            console.error('Fehler beim Parsen der gespeicherten Benutzer:', e);
          }
        }
        
        setUsers(loadedUsers);
        
        if (savedCurrentUser) {
          try {
            const parsedUser = JSON.parse(savedCurrentUser);
            const foundUser = loadedUsers.find(u => u.id === parsedUser.id);
            
            if (foundUser) {
              setCurrentUser(foundUser);
            } else {
              setCurrentUser(loadedUsers[0] || DEFAULT_USER);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedUsers[0] || DEFAULT_USER));
            }
          } catch (e) {
            console.error('Fehler beim Parsen des aktuellen Benutzers:', e);
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
    
    // Komprimierung für Avatar-Bilder, wenn sie groß sind
    if (userData.avatar && typeof userData.avatar === 'string' && userData.avatar.startsWith('data:image')) {
      try {
        // Reduziere die Bild-Qualität, wenn es ein Data-URL ist
        const compressedAvatar = await compressImage(userData.avatar, 800);
        updatedUser.avatar = compressedAvatar;
        userData = { ...userData, avatar: compressedAvatar };
      } catch (err) {
        console.warn("Fehler bei der Bildkomprimierung:", err);
      }
    }
    
    setCurrentUser(updatedUser);

    // Benutzer in der Benutzerliste aktualisieren
    const updatedUsers = users.map((user: User) =>
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);
    
    // In localStorage speichern, damit die Änderungen sofort sichtbar sind
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

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
        const savedUser = await response.json();
        console.log("Profiländerungen wurden erfolgreich auf dem Server gespeichert", savedUser);
        
        // Aktualisiere mit dem vom Server zurückgegebenen Benutzer
        setCurrentUser(savedUser);
        
        // Aktualisiere auch in der Benutzerliste
        const finalUpdatedUsers = users.map((user: User) =>
          user.id === currentUser.id ? savedUser : user
        );
        setUsers(finalUpdatedUsers);
        
        // Aktualisiere localStorage erneut mit den bestätigten Daten
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedUser));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUpdatedUsers));
      } else {
        console.error("Fehler beim Speichern der Profiländerungen auf dem Server:", await response.text());
      }
    } catch (error) {
      console.error("Fehler bei der Kommunikation mit dem Server:", error);
    }
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
      email: userData.email || `user${newUserId}@example.com`,
      createdAt: new Date().toISOString(),
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