import { Progress } from "@/components/ui/progress";
import { DailyGoal } from "../lib/postStore";
import { Droplet, Footprints, Route } from "lucide-react";

interface DailyGoalDisplayProps {
  goal: DailyGoal;
  variant?: "compact" | "full";
}

export default function DailyGoalDisplay({ goal, variant = "full" }: DailyGoalDisplayProps) {
  const progress = (goal.progress / goal.target) * 100;
  
  const goalIcons = {
    water: Droplet,
    steps: Footprints,
    distance: Route
  };

  const Icon = goalIcons[goal.type];
  const goalTypes = {
    water: "Wasser trinken",
    steps: "Schritte gehen",
    distance: "Strecke laufen"
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-muted-foreground whitespace-nowrap">
          {goal.progress}/{goal.target} {goal.unit}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Tagesziel: {goalTypes[goal.type]}</h3>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Fortschritt: {goal.progress} von {goal.target} {goal.unit}
        </span>
        <span className={goal.completed ? "text-green-500" : "text-muted-foreground"}>
          {goal.completed ? "✓ Erreicht" : `${Math.round(progress)}%`}
        </span>
      </div>
    </div>
  );
}
