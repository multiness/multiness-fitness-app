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
}

export function UserAvatar({
  userId,
  size = "md",
  className,
  showActiveGoal = true,
  isGroup = false,
  clickable = true,
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

  const containerClasses = cn(
    "rounded-full p-[2px]",
    isGroup
      ? "bg-gradient-to-r from-green-500 to-green-400"
      : hasActiveGoal
        ? "bg-gradient-to-r from-blue-400 to-blue-300"
        : "p-0",
    sizeClasses[size],
    clickable && "cursor-pointer hover:opacity-90 transition-opacity"
  );

  const avatarClasses = cn(
    "h-full w-full",
    "ring-0",
    className
  );

  const AvatarComponent = (
    <div className={containerClasses}>
      <Avatar className={avatarClasses}>
        <AvatarImage src={user.avatar || undefined} alt={user.username} className="object-cover rounded-full" />
        <AvatarFallback className="rounded-full">{user.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  );

  if (clickable && !isGroup) {
    return (
      <Link href={`/profile/${userId}`}>
        <div className="flex items-center">
          {AvatarComponent}
          <UsernameWithVerification userId={userId} />
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center">
      {AvatarComponent}
      <UsernameWithVerification userId={userId} />
    </div>
  );
}

export default UserAvatar;

interface UsernameWithVerificationProps {
  userId: number;
}

export const UsernameWithVerification: React.FC<UsernameWithVerificationProps> = ({ userId }) => {
  const { users } = useUsers();
  const user = users.find(u => u.id === userId);

  if (!user) return null;

  return (
    <div className="ml-2 flex items-center gap-1">
      <span className="truncate">{user.username}</span>
      {user.isVerified && (
        <VerifiedBadge className="h-4 w-4 text-primary" />
      )}
    </div>
  );
};