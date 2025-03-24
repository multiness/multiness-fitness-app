import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockUsers } from "../data/mockData";
import { storage, STORAGE_KEYS } from "../lib/storage";

type User = {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  bannerImage?: string | null;
  isAdmin: boolean;
  isVerified: boolean | null;
  isTeamMember: boolean | null;
  teamRole: string | null;
};

interface UserContextType {
  users: User[];
  currentUser: User | null;
  updateCurrentUser: (userData: Partial<User>) => void;
  toggleVerification: (userId: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Lade Benutzerdaten aus dem Storage oder verwende mockUsers als Fallback
  const [users, setUsers] = useState(() => 
    storage.getItem(STORAGE_KEYS.USERS, mockUsers)
  );

  const [currentUser, setCurrentUser] = useState(() => 
    storage.getItem(STORAGE_KEYS.USER, users[0])
  );

  const updateCurrentUser = (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);

    // Update user in users list
    const updatedUsers = users.map(user =>
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);

    // Save to storage
    storage.setItem(STORAGE_KEYS.USER, updatedUser);
    storage.setItem(STORAGE_KEYS.USERS, updatedUsers);
  };

  const toggleVerification = (userId: number) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    );
    setUsers(updatedUsers);
    storage.setItem(STORAGE_KEYS.USERS, updatedUsers);
  };

  // Storage Event Listener
  useEffect(() => {
    const cleanup = storage.addStorageListener((event: StorageEvent | CustomEvent) => {
      if ('key' in event) { // StorageEvent
        if (event.key === STORAGE_KEYS.USER) {
          const updatedUser = JSON.parse(event.newValue || '');
          setCurrentUser(updatedUser);
        } else if (event.key === STORAGE_KEYS.USERS) {
          const updatedUsers = JSON.parse(event.newValue || '[]');
          setUsers(updatedUsers);
        }
      } else { // CustomEvent
        const { key, value } = (event as CustomEvent).detail;
        if (key === STORAGE_KEYS.USER) {
          setCurrentUser(value);
        } else if (key === STORAGE_KEYS.USERS) {
          setUsers(value);
        }
      }
    });

    return cleanup;
  }, []);

  return (
    <UserContext.Provider value={{ users, currentUser, updateCurrentUser, toggleVerification }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return { user: context.currentUser };
}