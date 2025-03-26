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
const USERS_STORAGE_KEY = 'fitness-app-users';

export function UserProvider({ children }: { children: ReactNode }) {
  // Load users data from localStorage or use mockUsers as fallback
  const loadInitialUsers = () => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      return JSON.parse(savedUsers);
    }
    return mockUsers;
  };

  // Load current user from localStorage
  const loadCurrentUser = () => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    // If no saved user, use the first user from loaded users
    const initialUsers = loadInitialUsers();
    return initialUsers[0];
  };

  const [users, setUsers] = useState(loadInitialUsers());
  const [currentUser, setCurrentUser] = useState(loadCurrentUser());

  const updateCurrentUser = (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);

    // Update user in users list
    const updatedUsers = users.map(user =>
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  const toggleVerification = (userId: number) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    );
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  // Persist changes to localStorage whenever users or currentUser changes
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
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