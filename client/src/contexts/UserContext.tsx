import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockUsers } from "../data/mockData";

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

const STORAGE_KEY = 'fitness-app-user';

export function UserProvider({ children }: { children: ReactNode }) {
  // Versuche zuerst, den gespeicherten Benutzer aus dem localStorage zu laden
  const loadInitialUser = () => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Aktualisiere den entsprechenden Mock-User mit den gespeicherten Daten
      const updatedMockUsers = mockUsers.map(user =>
        user.id === parsedUser.id ? { ...user, ...parsedUser } : user
      );
      return { savedUser: parsedUser, updatedUsers: updatedMockUsers };
    }
    return { savedUser: mockUsers[0], updatedUsers: mockUsers };
  };

  const { savedUser, updatedUsers } = loadInitialUser();
  const [users, setUsers] = useState(updatedUsers);
  const [currentUser, setCurrentUser] = useState(savedUser);

  const updateCurrentUser = (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);

    // Aktualisiere auch den Benutzer in der users-Liste
    setUsers(prevUsers => prevUsers.map(user =>
      user.id === currentUser.id ? updatedUser : user
    ));

    // Speichere die Änderungen im localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  };

  const toggleVerification = (userId: number) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    ));
  };

  // Speichere Änderungen am currentUser automatisch
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      // Aktualisiere die users-Liste wenn sich currentUser ändert
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === currentUser.id ? currentUser : user
      ));
    }
  }, [currentUser]);

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