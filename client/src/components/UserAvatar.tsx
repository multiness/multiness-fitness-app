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
}

export function UserAvatar({
  userId,
  avatar,
  username,
  size = "md",
  className,
  showActiveGoal = true
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
        hasActiveGoal ? "ring-4 ring-blue-500/50" : "ring-4 ring-background",
        className
      )}
    >
      <AvatarImage src={avatar || undefined} />
      <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
