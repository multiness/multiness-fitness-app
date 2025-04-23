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
  isLocked?: boolean; // Gibt an, ob das Benutzerkonto gesperrt ist
  lockedReason?: string | null; // Grund für die Sperrung
  lockDate?: string | Date | null; // Zeitpunkt der Sperrung
  lastLogin?: string | Date | null; // Zeitpunkt der letzten Anmeldung
  emailVerificationToken?: string | null; // Token für E-Mail-Bestätigung
  emailVerificationExpires?: string | Date | null; // Ablaufzeit des Tokens
  passwordResetToken?: string | null; // Token für Passwort-Reset
  passwordResetExpires?: string | Date | null; // Ablaufzeit des Reset-Tokens
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
  toggleLock: (userId: number, reason?: string) => void; // Benutzer sperren/entsperren
  updateUser: (userId: number, userData: Partial<User>) => void; // Benutzerdaten aktualisieren
  resetPassword: (userId: number) => Promise<string | null>; // Passwort zurücksetzen und neues generieren
  deleteUser: (userId: number) => Promise<boolean>; // Benutzer löschen
  getUserById: (userId: number) => User | undefined; // Benutzer anhand ID abrufen
}

export type NotificationUser = {
  id: number;
  username: string;
  name: string;
};