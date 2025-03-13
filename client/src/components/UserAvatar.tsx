import { AvatarImage } from "@/components/ui/avatar";
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
    <AvatarImage
      src={avatar || undefined}
      alt={username}
      className={cn(
        sizeClasses[size],
        isGroup
          ? "border-2 border-green-500"
          : hasActiveGoal
            ? "border-2 border-blue-500"
            : "",
        "rounded-full",
        className
      )}
      fallback={username[0].toUpperCase()}
    />
  );
}