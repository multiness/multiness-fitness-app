import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <div className={cn("bg-background rounded-full p-0.5", className)}>
      <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />
    </div>
  );
}