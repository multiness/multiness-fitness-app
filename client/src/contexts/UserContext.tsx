import { createContext, useContext, useState, ReactNode } from "react";
import { mockUsers } from "../data/mockData";

type User = {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  isAdmin: boolean;
  isVerified: boolean;
};

interface UserContextType {
  users: User[];
  toggleVerification: (userId: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState(mockUsers);

  const toggleVerification = (userId: number) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, isVerified: !user.isVerified }
        : user
    ));
  };

  return (
    <UserContext.Provider value={{ users, toggleVerification }}>
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
