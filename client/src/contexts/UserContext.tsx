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
    try {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        // Validate that the parsed data has the expected structure
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0 && 
            parsedUsers[0].hasOwnProperty('id') && 
            parsedUsers[0].hasOwnProperty('username')) {
          return parsedUsers;
        }
      }
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
    }
    return mockUsers;
  };

  // Load current user from localStorage
  const loadCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the parsed data has the expected structure
        if (parsedUser && parsedUser.hasOwnProperty('id') && 
            parsedUser.hasOwnProperty('username')) {
          return parsedUser;
        }
      }
    } catch (error) {
      console.error('Error loading current user from localStorage:', error);
    }
    // If no saved user or invalid data, use the first user from loaded users
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { user: updatedUser }
      }));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  };

  const toggleVerification = (userId: number) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    );
    setUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error saving users data to localStorage:', error);
    }
  };

  // Add listener for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const updatedUser = JSON.parse(event.newValue || '');
        setCurrentUser(updatedUser);
      } else if (event.key === USERS_STORAGE_KEY) {
        const updatedUsers = JSON.parse(event.newValue || '[]');
        setUsers(updatedUsers);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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