import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "../lib/postStore";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: number;
  avatar?: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showActiveGoal?: boolean;
  isGroup?: boolean;
}

export function UserAvatar({
  userId,
  avatar,
  username,
  size = "md",
  className,
  showActiveGoal = true,
  isGroup = false
}: UserAvatarProps) {
  const postStore = usePostStore();
  const hasActiveGoal = showActiveGoal && postStore.getDailyGoal(userId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  };

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        isGroup
          ? "ring-2 ring-green-500"
          : hasActiveGoal
            ? "ring-2 ring-blue-500"
            : "",
        className
      )}
    >
      <AvatarImage src={avatar || undefined} />
      <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}