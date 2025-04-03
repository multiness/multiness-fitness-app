export type User = {
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

export interface UserContextType {
  users: User[];
  currentUser: User | null;
  updateCurrentUser: (userData: Partial<User>) => void;
  toggleVerification: (userId: number) => void;
  getAllUsers: () => User[];
}

export type NotificationUser = {
  id: number;
  username: string;
  name: string;
};