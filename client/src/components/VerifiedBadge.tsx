import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "default";
}

export function VerifiedBadge({ className, size = "default" }: VerifiedBadgeProps) {
  // Größenklassen basierend auf der size-Property
  const sizeClasses = {
    sm: "p-0.5",
    default: "p-1"
  };
  
  // Icon-Größen basierend auf der size-Property
  const iconSizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4"
  };
  
  return (
    <div className={cn("bg-background rounded-full", sizeClasses[size], className)}>
      <BadgeCheck className={cn(iconSizeClasses[size], "text-white fill-sky-400")} />
    </div>
  );
}