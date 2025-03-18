import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Trophy, Timer, Users, Calendar, Crown, MessageCircle, Dumbbell, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { mockChallenges } from "../data/mockData";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { useUsers } from "../contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkoutExercise {
  name: string;
  reps: number;
  weight?: number;
  description?: string;
}

interface WorkoutDetails {
  type: string;
  timePerRound: number;
  rounds: number;
  exercises: WorkoutExercise[];
}

interface Participant {
  id: number;
  username: string;
  points: number;
  lastUpdate?: Date;
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { users, currentUser } = useUsers();
  const challenge = mockChallenges.find(c => c.id === parseInt(id || ""));
  const creator = users.find(u => u.id === challenge?.creatorId);

  const [isParticipating, setIsParticipating] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [result, setResult] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (challenge) {
      const mockParticipants: Participant[] = users
        .slice(0, Math.floor(Math.random() * 8) + 3)
        .map(user => ({
          id: user.id,
          username: user.username,
          points: Math.floor(Math.random() * 1000),
          lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }));
      setParticipants(mockParticipants.sort((a, b) => b.points - a.points));
    }
  }, [challenge]);

  if (!challenge || !creator) return <div>Challenge nicht gefunden</div>;

  const currentDate = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isActive = currentDate >= startDate && currentDate <= endDate;
  const isEnded = currentDate > endDate;

  const handleJoinChallenge = () => {
    if (isEnded) {
      toast({
        title: "Challenge beendet",
        description: "Diese Challenge ist bereits abgeschlossen.",
        variant: "destructive",
      });
      return;
    }

    setIsParticipating(true);
    setParticipants(prev => [
      ...prev,
      {
        id: currentUser?.id || 0,
        username: currentUser?.username || "",
        points: 0,
        lastUpdate: new Date()
      }
    ]);

    toast({
      title: "Erfolgreich beigetreten!",
      description: "Du nimmst jetzt an der Challenge teil.",
    });
  };

  const handleSubmitResult = () => {
    if (!result) {
      toast({
        title: "Fehler",
        description: "Bitte gib ein Ergebnis ein.",
        variant: "destructive",
      });
      return;
    }

    const points = Number(result);
    if (isNaN(points) || points < 0) {
      toast({
        title: "Fehler",
        description: "Bitte gib eine gültige Zahl ein.",
        variant: "destructive",
      });
      return;
    }

    setParticipants(prev => prev.map(p =>
      p.id === (currentUser?.id || 0)
        ? { ...p, points: points, lastUpdate: new Date() }
        : p
    ).sort((a, b) => b.points - a.points));

    toast({
      title: "Ergebnis gespeichert!",
      description: "Dein Ergebnis wurde erfolgreich eingetragen.",
    });
    setShowResultForm(false);
    setResult("");
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
        {challenge.image ? (
          <img
            src={challenge.image}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Trophy className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant={isActive ? "default" : "secondary"} className="mb-2">
            {isActive ? "Aktiv" : "Beendet"}
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">{challenge.title}</h1>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(startDate, "dd. MMMM", { locale: de })} - {format(endDate, "dd. MMMM yyyy", { locale: de })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <UserAvatar
            userId={creator.id}
            size="md"
            clickable={true}
          />
          <div>
            <div className="font-semibold">{creator.name}</div>
            <div className="text-sm text-muted-foreground">@{creator.username}</div>
          </div>
          <Button variant="secondary" className="ml-auto" onClick={() => console.log('Send message to creator')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Nachricht
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Über diese Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{challenge.description}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Teilnehmer ({participants.length})
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowParticipants(true)}>
              Alle anzeigen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 8).map((participant) => (
              <UserAvatar
                key={participant.id}
                userId={participant.id}
                size="sm"
                clickable={true}
              />
            ))}
            {participants.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                +{participants.length - 8}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Rangliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {index === 0 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-yellow-400" />}
                    {index === 1 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-gray-400" />}
                    {index === 2 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-amber-700" />}
                    <UserAvatar
                      userId={participant.id}
                      size="sm"
                      clickable={true}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{participant.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : `${index + 1}. `}
                      Platz
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{participant.points}</p>
                  <p className="text-sm text-muted-foreground">Punkte</p>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => setShowLeaderboard(true)}>
                Vollständige Rangliste anzeigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {challenge.workoutType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Workout Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-3 bg-background rounded-lg">
                    <Dumbbell className="h-5 w-5 text-primary mb-2" />
                    <span className="text-sm font-medium">Typ</span>
                    <span className="text-sm text-muted-foreground">
                      {challenge.workoutType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-background rounded-lg">
                    <Clock className="h-5 w-5 text-primary mb-2" />
                    <span className="text-sm font-medium">Zeit/Runde</span>
                    <span className="text-sm text-muted-foreground">
                      {challenge.workoutDetails?.timePerRound || 0} Sek
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-background rounded-lg">
                    <RefreshCw className="h-5 w-5 text-primary mb-2" />
                    <span className="text-sm font-medium">Runden</span>
                    <span className="text-sm text-muted-foreground">
                      {challenge.workoutDetails?.rounds || 0}
                    </span>
                  </div>
                </div>
              </div>

              {challenge.workoutDetails?.exercises && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Übungen</h3>
                  <div className="space-y-3">
                    {challenge.workoutDetails.exercises.map((exercise: WorkoutExercise, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{exercise.name}</h4>
                          {exercise.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {exercise.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">Wiederholungen</span>
                            <p className="font-medium">{exercise.reps}x</p>
                          </div>
                          {exercise.weight && (
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">Gewicht</span>
                              <p className="font-medium">{exercise.weight}kg</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isParticipating && !showResultForm && (
                <div className="pt-4">
                  <Button 
                    onClick={() => setShowResultForm(true)}
                    className="w-full"
                  >
                    Ergebnis eintragen
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle>Gewinn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {challenge.prizeImage && (
              <img
                src={challenge.prizeImage}
                alt={challenge.prize}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg mb-1">{challenge.prize}</h3>
              <p className="text-muted-foreground">{challenge.prizeDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isEnded && (
        <div className="flex gap-3">
          {!isParticipating ? (
            <Button className="flex-1" size="lg" onClick={handleJoinChallenge}>
              An Challenge teilnehmen
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                size="lg"
                variant={showResultForm ? "secondary" : "default"}
                onClick={() => setShowResultForm(!showResultForm)}
              >
                {showResultForm ? "Abbrechen" : "Ergebnis eintragen"}
              </Button>
              {showResultForm && (
                <Dialog open={showResultForm} onOpenChange={setShowResultForm}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ergebnis eintragen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Dein Ergebnis</label>
                        <Input
                          type="number"
                          placeholder="Punkte eingeben"
                          value={result}
                          onChange={(e) => setResult(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Gib deine erreichten Punkte ein. Bei AMRAP die Anzahl der Runden, bei For Time die Zeit in Sekunden.
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSubmitResult} className="flex-1">
                          Speichern
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowResultForm(false)}
                          className="flex-1"
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vollständige Rangliste</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {index === 0 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-yellow-400" />}
                      {index === 1 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-gray-400" />}
                      {index === 2 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-amber-700" />}
                      <UserAvatar
                        userId={participant.id}
                        size="sm"
                        clickable={true}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{participant.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Zuletzt aktualisiert: {format(participant.lastUpdate || new Date(), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{participant.points}</p>
                    <p className="text-sm text-muted-foreground">Punkte</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alle Teilnehmer</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      userId={participant.id}
                      size="sm"
                      clickable={true}
                    />
                    <div>
                      <p className="font-medium">{participant.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Dabei seit: {format(participant.lastUpdate || new Date(), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}