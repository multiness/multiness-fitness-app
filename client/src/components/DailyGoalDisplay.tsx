import { Progress } from "@/components/ui/progress";
import { DailyGoal } from "../lib/postStore";
import { Droplet, Footprints, Route, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { usePostStore } from "../lib/postStore";
import { useUsers } from "../contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "../data/mockData";

interface DailyGoalDisplayProps {
  goal: DailyGoal;
  userId: number;
  variant?: "compact" | "full";
  onProgressUpdate?: (progress: number) => void;
}

export default function DailyGoalDisplay({ 
  goal, 
  userId, 
  variant = "full",
  onProgressUpdate 
}: DailyGoalDisplayProps) {
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState("");
  const progress = (goal.progress / goal.target) * 100;
  const postStore = usePostStore();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const participants = postStore.getGoalParticipants(userId);

  const goalIcons = {
    water: Droplet,
    steps: Footprints,
    distance: Route,
    custom: Target
  };

  const goalTypes = {
    water: "Wasser trinken",
    steps: "Schritte gehen",
    distance: "Strecke laufen",
    custom: goal.customName || "Eigenes Ziel"
  };

  const Icon = goalIcons[goal.type];

  const handleProgressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const newProgress = Number(progressInput);
    if (isNaN(newProgress) || newProgress < 0) return;

    if (newProgress > goal.target) {
      toast({
        title: "Ungültiger Wert",
        description: `Der Wert kann nicht größer als ${goal.target} ${goal.unit} sein.`,
        variant: "destructive"
      });
      return;
    }

    postStore.updateDailyGoalProgress(userId, newProgress);
    onProgressUpdate?.(newProgress);
    setProgressInput("");
    setShowProgressInput(false);

    if (newProgress >= goal.target) {
      toast({
        title: "🎉 Glückwunsch!",
        description: "Du hast dein Tagesziel erreicht!",
      });
    }
  };

  const handleJoinGoal = () => {
    if (!currentUser) return;

    if (participants.includes(currentUser.id)) {
      postStore.leaveDailyGoal(userId, currentUser.id);
      toast({
        title: "Nicht mehr dabei",
        description: "Du verfolgst dieses Ziel nicht mehr.",
      });
    } else {
      postStore.joinDailyGoal(userId, currentUser.id);
      toast({
        title: "Du machst mit!",
        description: "Du verfolgst jetzt auch dieses Ziel.",
      });
    }
  };

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium">{goalTypes[goal.type]}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-6 px-2"
            onClick={() => setShowProgressInput(true)}
          >
            {goal.progress}/{goal.target} {goal.unit}
          </Button>
        </div>
        {showProgressInput && (
          <form onSubmit={handleProgressUpdate} className="flex gap-2">
            <Input
              type="number"
              placeholder={`Neuer Fortschritt in ${goal.unit}`}
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              className="h-8"
            />
            <Button type="submit" size="sm" className="h-8">
              Speichern
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{goalTypes[goal.type]}</h3>
        </div>
        {currentUser && currentUser.id !== userId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleJoinGoal}
            className={participants.includes(currentUser.id) ? "bg-primary/10" : ""}
          >
            {participants.includes(currentUser.id) ? "Mache ich auch" : "Mitmachen"}
          </Button>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowProgressInput(true)}
          className="text-sm px-0"
        >
          {goal.progress} von {goal.target} {goal.unit}
          {goal.completed && " ✓"}
        </Button>
        {participants.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participants.length} {participants.length === 1 ? "Teilnehmer" : "Teilnehmer"}</span>
          </div>
        )}
      </div>

      {showProgressInput && (
        <form onSubmit={handleProgressUpdate} className="flex gap-2">
          <Input
            type="number"
            placeholder={`Neuer Fortschritt in ${goal.unit}`}
            value={progressInput}
            onChange={(e) => setProgressInput(e.target.value)}
          />
          <Button type="submit">
            Speichern
          </Button>
        </form>
      )}

      {participants.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">Machen auch mit:</p>
          <div className="flex flex-wrap gap-2">
            {participants.map(participantId => {
              const participant = mockUsers.find(u => u.id === participantId);
              return (
                <span key={participantId} className="text-sm bg-primary/5 px-2 py-1 rounded-full">
                  {participant?.username}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}