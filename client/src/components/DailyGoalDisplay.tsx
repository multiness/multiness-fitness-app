import { Progress } from "@/components/ui/progress";
import { DailyGoal } from "../lib/postStore";
import { Droplet, Footprints, Route, Target, Users, Plus, Trophy, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { usePostStore } from "../lib/postStore";
import { useUsers } from "../contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "../data/mockData";
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    // Überprüfe, dass der neue Fortschritt das Ziel nicht überschreitet
    const totalProgress = goal.progress + newProgress;
    if (totalProgress > goal.target) {
      toast({
        title: "Ungültiger Wert",
        description: `Der Gesamtfortschritt kann nicht größer als ${goal.target} ${goal.unit} sein.`,
        variant: "destructive"
      });
      return;
    }

    // Aktualisiere den Fortschritt
    postStore.updateDailyGoalProgress(userId, totalProgress);
    onProgressUpdate?.(totalProgress);
    setProgressInput("");
    setShowProgressInput(false);

    if (totalProgress >= goal.target) {
      toast({
        title: "🎉 Glückwunsch!",
        description: "Du hast dein Tagesziel erreicht!",
      });
    } else {
      toast({
        title: "Fortschritt aktualisiert",
        description: `Noch ${goal.target - totalProgress} ${goal.unit} bis zum Ziel!`,
      });
    }
  };

  const handleDeleteGoal = () => {
    if (!currentUser) return;

    const confirmDelete = window.confirm("Möchtest du dieses Tagesziel wirklich löschen?");
    if (confirmDelete) {
      postStore.deleteDailyGoal(userId);
      toast({
        title: "Tagesziel gelöscht",
        description: "Dein Tagesziel wurde erfolgreich gelöscht.",
      });
    }
  };

  const timeLeft = formatDistanceToNow(new Date(goal.createdAt).getTime() + 24 * 60 * 60 * 1000, { locale: de });

  // Profilseiten-Variante
  if (variant === "profile") {
    return (
      <div className="space-y-2 py-4 border-t border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Aktuelles Tagesziel: {goalTypes[goal.type]}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                  onClick={() => setShowProgressInput(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Fortschritt eintragen
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-500" onClick={handleDeleteGoal}>
                      Tagesziel löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className={`h-full transition-all duration-500 ease-in-out ${
              goal.completed
                ? 'bg-yellow-500' // Gelbgold wenn komplett
                : 'bg-blue-500'   // Blau während des Fortschritts
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {goal.progress} von {goal.target} {goal.unit}
            </span>
            {goal.completed && (
              <span className="text-yellow-500 flex items-center gap-1">
                <Trophy className="h-4 w-4" /> Ziel erreicht!
              </span>
            )}
          </div>
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
              placeholder={`Fortschritt in ${goal.unit}`}
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Hinzufügen</Button>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                onClick={() => setShowProgressInput(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Fortschritt
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-500" onClick={handleDeleteGoal}>
                    Tagesziel löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className={`h-full transition-all duration-500 ease-in-out ${
              goal.completed
                ? 'bg-yellow-500' // Gelbgold wenn komplett
                : 'bg-blue-500'   // Blau während des Fortschritts
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>
              {goal.progress} von {goal.target} {goal.unit}
            </span>
            {goal.completed && (
              <span className="text-yellow-500 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
              </span>
            )}
          </div>
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
            <>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80"
                onClick={() => setShowProgressInput(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Fortschritt eintragen
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-500" onClick={handleDeleteGoal}>
                    Tagesziel löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
          className={`h-full transition-all duration-500 ease-in-out ${
            goal.completed
              ? 'bg-yellow-500' // Gelbgold wenn komplett
              : 'bg-blue-500'   // Blau während des Fortschritts
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm">
          {goal.progress} von {goal.target} {goal.unit}
          {goal.completed && (
            <span className="ml-2 text-yellow-500 flex items-center gap-1 inline-flex">
              <Trophy className="h-4 w-4" /> Geschafft!
            </span>
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