import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "../lib/postStore";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useUsers, getUsersFromStorage } from "../contexts/UserContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { useState, useEffect } from "react";
import ImageModal from "./ImageModal";

interface UserAvatarProps {
  userId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showActiveGoal?: boolean;
  isGroup?: boolean;
  clickable?: boolean;
  hideVerifiedBadge?: boolean;
  enableImageModal?: boolean;
  disableLink?: boolean;
}

export function UserAvatar({
  userId,
  size = "md",
  className,
  showActiveGoal = true,
  isGroup = false,
  clickable = true,
  hideVerifiedBadge = false,
  enableImageModal = false,
  disableLink = false
}: UserAvatarProps) {
  const postStore = usePostStore();
  const { users: contextUsers } = useUsers();
  
  // Implementiere eine robuste User-Suche-Logik
  const [user, setUser] = useState(() => {
    // Versuche zuerst den Benutzer aus dem Context zu holen
    const contextUser = contextUsers.find(u => u.id === userId);
    if (contextUser) return contextUser;
    
    // Andernfalls versuche direkt aus dem localStorage zu laden
    const storageUsers = getUsersFromStorage();
    return storageUsers.find(u => u.id === userId);
  });

  // Aktualisiere den Benutzer, wenn sich der Context ändert
  useEffect(() => {
    const updatedUser = contextUsers.find(u => u.id === userId);
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, [contextUsers, userId]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fallback-Benutzer, wenn kein Benutzer gefunden wurde
  if (!user) {
    console.warn(`Benutzer mit ID ${userId} nicht gefunden`);
    return null;
  }

  const hasActiveGoal = showActiveGoal && postStore.getDailyGoal(userId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  };

  const containerClasses = cn(
    "rounded-full p-[2px]",
    isGroup
      ? "bg-gradient-to-r from-green-500 to-green-400"
      : hasActiveGoal
        ? "bg-gradient-to-r from-blue-400 to-blue-300"
        : "p-0",
    sizeClasses[size],
    enableImageModal && "cursor-zoom-in hover:opacity-90 transition-opacity",
    !enableImageModal && clickable && "cursor-pointer hover:opacity-90 transition-opacity"
  );

  const avatarClasses = cn(
    "h-full w-full",
    "ring-0",
    className
  );

  const handleClick = (e: React.MouseEvent) => {
    if (enableImageModal) {
      e.preventDefault();
      e.stopPropagation();
      setIsModalOpen(true);
    }
  };

  const AvatarComponent = (
    <div className="relative inline-block">
      <div className={containerClasses} onClick={handleClick}>
        <Avatar className={avatarClasses}>
          <AvatarImage src={user.avatar || undefined} alt={user.username} className="object-cover rounded-full" />
          <AvatarFallback className="rounded-full">{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      </div>
      {!hideVerifiedBadge && user.isVerified && (
        <div className="absolute -bottom-1 -right-1">
          <VerifiedBadge size={size === "lg" ? "default" : "sm" as "sm" | "default"} />
        </div>
      )}
      {enableImageModal && (
        <ImageModal
          src={user.avatar || "/placeholder-avatar.png"}
          alt={user.username}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );

  // Verwende Link nur wenn explizit erlaubt und clickable
  if (clickable && !isGroup && !enableImageModal && !disableLink) {
    return (
      <Link href={`/profile/${userId}`}>
        {AvatarComponent}
      </Link>
    );
  }

  return AvatarComponent;
}

export default UserAvatar;