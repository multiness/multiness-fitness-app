import { Progress } from "@/components/ui/progress";
import { DailyGoal } from "../lib/postStore";
import { Droplet, Footprints, Route, Target, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { usePostStore } from "../lib/postStore";
import { useUsers } from "../contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "../data/mockData";
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface DailyGoalDisplayProps {
  goal: DailyGoal;
  userId: number;
  variant?: "compact" | "full" | "profile";
  onProgressUpdate?: (progress: number) => void;
}

export default function DailyGoalDisplay({
  goal,
  userId,
  variant = "full",
  onProgressUpdate
}: DailyGoalDisplayProps) {
  console.log('DailyGoalDisplay rendering with:', { goal, userId, variant });
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState("");
  const progress = (goal.progress / goal.target) * 100;
  const postStore = usePostStore();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const participants = postStore.getGoalParticipants(userId);
  const isOwner = currentUser?.id === userId;

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

  const getTimeLeft = (createdAt: Date | string) => {
    try {
      const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
      if (isNaN(createdAtDate.getTime())) return null;

      const now = new Date();
      const endTime = new Date(createdAtDate);
      endTime.setHours(endTime.getHours() + 24);

      if (now > endTime) return null;

      return formatDistanceToNow(endTime, { locale: de });
    } catch (error) {
      console.error('Error calculating time left:', error);
      return null;
    }
  };

  const timeLeft = getTimeLeft(goal.createdAt);

  // Profilseiten-Variante
  if (variant === "profile") {
    return (
      <div className="space-y-2 py-4 border-t border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Aktuelles Tagesziel: {goalTypes[goal.type]}</h3>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => setShowProgressInput(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Fortschritt eintragen
            </Button>
          )}
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {goal.progress} von {goal.target} {goal.unit}
          </span>
          {participants.length > 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participants.length} {participants.length === 1 ? "Teilnehmer" : "Teilnehmer"}
            </span>
          )}
        </div>

        {showProgressInput && (
          <form onSubmit={handleProgressUpdate} className="flex gap-2 mt-2">
            <Input
              type="number"
              placeholder={`Neuer Fortschritt in ${goal.unit}`}
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Speichern</Button>
          </form>
        )}
      </div>
    );
  }

  // Kompakte Variante für Posts
  if (variant === "compact") {
    return (
      <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{goalTypes[goal.type]}</span>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary/80"
              onClick={() => setShowProgressInput(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Fortschritt
            </Button>
          )}
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span>
            {goal.progress} von {goal.target} {goal.unit}
            {goal.completed && " ✓"}
          </span>
          <div className="flex items-center gap-2">
            {timeLeft && (
              <span className="text-muted-foreground">
                Noch {timeLeft}
              </span>
            )}
            {participants.length > 0 && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {participants.length}
              </span>
            )}
          </div>
        </div>

        {showProgressInput && (
          <form onSubmit={handleProgressUpdate} className="flex gap-2">
            <Input
              type="number"
              placeholder={`Neuer Fortschritt in ${goal.unit}`}
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" className="h-8">
              OK
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Vollständige Variante
  return (
    <div className="space-y-4 p-4 bg-primary/5 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{goalTypes[goal.type]}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
              onClick={() => setShowProgressInput(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Fortschritt eintragen
            </Button>
          )}
          {currentUser && currentUser.id !== userId && (
            <Button
              variant={participants.includes(currentUser.id) ? "secondary" : "outline"}
              size="sm"
              onClick={handleJoinGoal}
              className={participants.includes(currentUser.id) ? "bg-primary/10" : ""}
            >
              {participants.includes(currentUser.id) ? "Mache ich auch" : "Mitmachen"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm">
          {goal.progress} von {goal.target} {goal.unit}
          {goal.completed && (
            <span className="ml-2 text-primary">✓ Geschafft!</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {timeLeft && (
            <span className="text-sm text-muted-foreground">
              Noch {timeLeft}
            </span>
          )}
          {participants.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} {participants.length === 1 ? "Teilnehmer" : "Teilnehmer"}</span>
            </div>
          )}
        </div>
      </div>

      {showProgressInput && (
        <form onSubmit={handleProgressUpdate} className="flex gap-2">
          <Input
            type="number"
            placeholder={`Neuer Fortschritt in ${goal.unit}`}
            value={progressInput}
            onChange={(e) => setProgressInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            Speichern
          </Button>
        </form>
      )}

      {participants.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground mb-2">Machen auch mit:</p>
          <div className="flex flex-wrap gap-2">
            {participants.map(participantId => {
              const participant = mockUsers.find(u => u.id === participantId);
              return (
                <span key={participantId} className="text-sm bg-primary/10 px-2 py-1 rounded-full">
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