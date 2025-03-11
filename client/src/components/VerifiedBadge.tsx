import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <div className={cn("bg-background rounded-full p-0.5", className)}>
      <BadgeCheck className="h-4 w-4 text-white fill-sky-400" />
    </div>
  );
}