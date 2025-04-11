export type User = {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  bannerImage?: string | null;
  coverImage?: string | null;
  email?: string | null;
  phone?: string | null;
  preferences?: any;
  metrics?: any;
  lastActive?: string | null;
  isAdmin: boolean;
  isVerified: boolean | null;
  isTeamMember: boolean | null;
  teamRole: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export interface UserContextType {
  users: User[];
  currentUser: User | null;
  updateCurrentUser: (userData: Partial<User>) => void;
  toggleVerification: (userId: number) => void;
  toggleTeamMember: (userId: number) => void;
  toggleAdmin: (userId: number) => void;
  updateTeamRole: (userId: number, teamRole: string) => void;
  getAllUsers: () => User[];
  createUser: (userData: Partial<User>) => User;
  getUsersFromStorage: () => User[];
}

export type NotificationUser = {
  id: number;
  username: string;
  name: string;
};