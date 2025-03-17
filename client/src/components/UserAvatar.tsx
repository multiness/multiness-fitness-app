import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "../lib/postStore";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useUsers } from "../contexts/UserContext";
import { VerifiedBadge } from "./VerifiedBadge";

interface UserAvatarProps {
  userId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showActiveGoal?: boolean;
  isGroup?: boolean;
  clickable?: boolean;
  hideVerifiedBadge?: boolean;
}

export function UserAvatar({
  userId,
  size = "md",
  className,
  showActiveGoal = true,
  isGroup = false,
  clickable = true,
  hideVerifiedBadge = false
}: UserAvatarProps) {
  const postStore = usePostStore();
  const { users } = useUsers();
  const user = users.find(u => u.id === userId);

  if (!user) return null;

  const hasActiveGoal = showActiveGoal && postStore.getDailyGoal(userId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  };

  // Create a container with the colored border
  const containerClasses = cn(
    "rounded-full p-[2px]", // Thin border padding
    isGroup
      ? "bg-gradient-to-r from-green-500 to-green-400"
      : hasActiveGoal
        ? "bg-gradient-to-r from-blue-400 to-blue-300"
        : "p-0", // No padding when no border needed
    sizeClasses[size],
    clickable && "cursor-pointer hover:opacity-90 transition-opacity"
  );

  // Avatar itself should fit perfectly inside the container
  const avatarClasses = cn(
    "h-full w-full", // Fill the container
    "ring-0", // Remove any ring/border from the avatar itself
    className
  );

  const AvatarComponent = (
    <div className="relative inline-block">
      <div className={containerClasses}>
        <Avatar className={avatarClasses}>
          <AvatarImage src={user.avatar || undefined} alt={user.username} className="object-cover rounded-full" />
          <AvatarFallback className="rounded-full">{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      {!hideVerifiedBadge && user.isVerified && (
        <div className="absolute -bottom-1 -right-1">
          <VerifiedBadge size={size === "lg" ? "default" : "sm"} />
        </div>
      )}
    </div>
  );

  if (clickable && !isGroup) {
    return (
      <Link href={`/profile/${userId}`}>
        {AvatarComponent}
      </Link>
    );
  }

  return AvatarComponent;
}

export default UserAvatar;