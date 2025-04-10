import { Progress } from "@/components/ui/progress";
import { DailyGoal } from "../lib/postStore";
import { Droplet, Footprints, Route, Target, Users, Plus, Trophy, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { usePostStore } from "../lib/postStore";
import { useUsers } from "../contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar"; // Assuming this component exists


interface DailyGoalDisplayProps {
  goal: DailyGoal;
  userId: number;
  variant?: "compact" | "full" | "profile";
  onProgressUpdate?: (progress: number) => void;
}

export default function DailyGoalDisplay({
  goal: initialGoal,
  userId,
  variant = "full",
  onProgressUpdate
}: DailyGoalDisplayProps) {
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState("");
  const postStore = usePostStore();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const participants = postStore.getGoalParticipants(userId);
  const isOwner = currentUser?.id === userId;
  const isParticipating = currentUser ? participants.includes(currentUser.id) : false;

  // Hole das aktuelle Ziel aus dem Store statt die Props zu verwenden
  const currentGoal = postStore.getDailyGoal(userId) || initialGoal;
  const progress = (currentGoal.progress / currentGoal.target) * 100;

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
    custom: currentGoal.customName || "Eigenes Ziel"
  };

  const Icon = goalIcons[currentGoal.type];

  const handleProgressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const newProgress = Number(progressInput);
    if (isNaN(newProgress) || newProgress < 0) return;

    // Überprüfe, dass der neue Fortschritt das Ziel nicht überschreitet
    const totalProgress = currentGoal.progress + newProgress;
    if (totalProgress > currentGoal.target) {
      toast({
        title: "Ungültiger Wert",
        description: `Der Gesamtfortschritt kann nicht größer als ${currentGoal.target} ${currentGoal.unit} sein.`,
        variant: "destructive"
      });
      return;
    }

    // Aktualisiere den Fortschritt
    postStore.updateDailyGoalProgress(userId, newProgress);
    onProgressUpdate?.(newProgress);
    setProgressInput("");
    setShowProgressInput(false);

    if (totalProgress >= currentGoal.target) {
      toast({
        title: "🎉 Glückwunsch!",
        description: "Du hast dein Tagesziel erreicht!",
      });
    } else {
      toast({
        title: "Fortschritt aktualisiert",
        description: `Noch ${currentGoal.target - totalProgress} ${currentGoal.unit} bis zum Ziel!`,
      });
    }
  };

  const handleJoinGoal = () => {
    if (!currentUser) return;

    if (isParticipating) {
      postStore.leaveDailyGoal(userId, currentUser.id);
      toast({
        title: "Nicht mehr dabei",
        description: "Du verfolgst dieses Ziel nicht mehr.",
      });
    } else {
      // Erstelle ein neues Tagesziel für den Teilnehmer mit gleicher Einheit
      const newGoal: DailyGoal = {
        ...currentGoal,
        progress: 0,
        completed: false,
        createdAt: new Date()
      };

      // Erstelle einen Post und setze das Ziel
      const userDetail = fetch(`/api/users/${userId}`).then(res => res.json()).catch(() => ({username: "einem Benutzer"}));
      let username = "einem Benutzer";
      
      // Benutzername aus der API holen oder Standardwert verwenden
      userDetail.then((user) => {
        username = user.username || "einem Benutzer";
        // Erstelle einen Post und setze das Ziel
        postStore.createPostWithGoal(
          currentUser.id,
          `Ich mache bei @${username}'s Tagesziel mit: ${goalTypes[currentGoal.type]}`,
          newGoal
        );
      });

      // Füge den Teilnehmer zum Original-Ziel hinzu
      postStore.joinDailyGoal(userId, currentUser.id);

      toast({
        title: "Du machst mit!",
        description: "Das Tagesziel wurde zu deinem Profil hinzugefügt.",
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

  const timeLeft = formatDistanceToNow(new Date(currentGoal.createdAt).getTime() + 24 * 60 * 60 * 1000, { locale: de });

  // Profilseiten-Variante
  if (variant === "profile") {
    return (
      <div className="space-y-2 py-4 border-t border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Aktuelles Tagesziel: {goalTypes[currentGoal.type]}</h3>
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
              currentGoal.completed
                ? 'bg-yellow-500' // Gelbgold wenn komplett
                : 'bg-blue-500'   // Blau während des Fortschritts
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {currentGoal.progress} von {currentGoal.target} {currentGoal.unit}
            </span>
            {currentGoal.completed && (
              <span className="text-yellow-500 flex items-center gap-1">
                <Trophy className="h-4 w-4" /> Ziel erreicht!
              </span>
            )}
          </div>
          {participants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participantId) => (
                  <UserAvatar
                    key={participantId}
                    userId={participantId}
                    size="sm"
                    className="-ml-2 first:ml-0"
                  />
                ))}
                {participants.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium -ml-2">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              <span className="text-muted-foreground">
                {participants.length} {participants.length === 1 ? "Teilnehmer" : "Teilnehmer"}
              </span>
            </div>
          )}
        </div>

        {showProgressInput && (
          <form onSubmit={handleProgressUpdate} className="flex gap-2 mt-2">
            <Input
              type="number"
              placeholder={`Fortschritt in ${currentGoal.unit}`}
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
            <span className="font-medium text-sm">{goalTypes[currentGoal.type]}</span>
          </div>
          {isOwner ? (
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
          ) : (
            <Button
              variant={isParticipating ? "secondary" : "default"}
              size="sm"
              onClick={handleJoinGoal}
              className="h-7"
            >
              {isParticipating ? "Mache ich auch" : "Mitmachen"}
            </Button>
          )}
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className={`h-full transition-all duration-500 ease-in-out ${
              currentGoal.completed
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>
              {currentGoal.progress} von {currentGoal.target} {currentGoal.unit}
            </span>
            {currentGoal.completed && (
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
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {participants.slice(0, 3).map((participantId) => (
                    <UserAvatar
                      key={participantId}
                      userId={participantId}
                      size="sm"
                      className="-ml-1 first:ml-0"
                    />
                  ))}
                </div>
                {participants.length > 3 && (
                  <span className="text-muted-foreground">
                    +{participants.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showProgressInput && (
          <form onSubmit={handleProgressUpdate} className="flex gap-2">
            <Input
              type="number"
              placeholder={`Neuer Fortschritt in ${currentGoal.unit}`}
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
          <h3 className="font-medium">{goalTypes[currentGoal.type]}</h3>
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
              variant={isParticipating ? "secondary" : "outline"}
              size="sm"
              onClick={handleJoinGoal}
              className={isParticipating ? "bg-primary/10" : ""}
            >
              {isParticipating ? "Mache ich auch" : "Mitmachen"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-primary/10">
        <div
          className={`h-full transition-all duration-500 ease-in-out ${
            currentGoal.completed
              ? 'bg-yellow-500' // Gelbgold wenn komplett
              : 'bg-blue-500'   // Blau während des Fortschritts
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm">
          {currentGoal.progress} von {currentGoal.target} {currentGoal.unit}
          {currentGoal.completed && (
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
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participantId) => (
                  <UserAvatar
                    key={participantId}
                    userId={participantId}
                    size="sm"
                    className="-ml-2 first:ml-0"
                  />
                ))}
                {participants.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium -ml-2">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              <span>{participants.length} {participants.length === 1 ? "Teilnehmer" : "Teilnehmer"}</span>
            </div>
          )}
        </div>
      </div>

      {showProgressInput && (
        <form onSubmit={handleProgressUpdate} className="flex gap-2">
          <Input
            type="number"
            placeholder={`Neuer Fortschritt in ${currentGoal.unit}`}
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
            {participants.map(participantId => (
              <UserAvatar
                key={participantId}
                userId={participantId}
                size="sm"
                className="mr-1"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}