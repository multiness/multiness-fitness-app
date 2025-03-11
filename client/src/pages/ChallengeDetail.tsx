import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Trophy, Timer, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { mockChallenges, mockUsers } from "../data/mockData";
import { de } from "date-fns/locale";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutExercise {
  name: string;
  reps: number;
  description?: string;
}

interface WorkoutDetails {
  timePerRound: number;
  rounds: number;
  exercises: WorkoutExercise[];
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const challenge = mockChallenges.find(c => c.id === parseInt(id || ""));
  const creator = challenge ? mockUsers.find(u => u.id === challenge.creatorId) : null;
  const currentUser = mockUsers[0]; // Simuliert den eingeloggten User

  const [isParticipating, setIsParticipating] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [result, setResult] = useState("");

  if (!challenge || !creator) return <div>Challenge nicht gefunden</div>;

  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;
  const workoutDetails = challenge.workoutDetails as WorkoutDetails;

  const handleJoinChallenge = () => {
    setIsParticipating(true);
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

    toast({
      title: "Ergebnis gespeichert!",
      description: "Dein Ergebnis wurde erfolgreich eingetragen.",
    });
    setShowResultForm(false);
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      {/* Challenge Header */}
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
                {format(challenge.startDate, "dd. MMMM", { locale: de })} - {format(challenge.endDate, "dd. MMMM yyyy", { locale: de })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={creator.avatar || undefined} />
            <AvatarFallback>{creator.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{creator.name}</div>
            <div className="text-sm text-muted-foreground">@{creator.username}</div>
          </div>
          <Button variant="secondary" className="ml-auto">Folgen</Button>
        </CardContent>
      </Card>

      {/* Challenge Beschreibung */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Über diese Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{challenge.description}</p>
        </CardContent>
      </Card>

      {/* Teilnehmer Status & Ergebnisse */}
      {isParticipating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dein Fortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Aktuelle Platzierung</p>
                  <p className="text-2xl font-bold text-primary">4. Platz</p>
                </div>
                <div>
                  <p className="font-medium">Deine Punktzahl</p>
                  <p className="text-2xl font-bold">{result || "0"} Punkte</p>
                </div>
              </div>

              {showResultForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dein Ergebnis</label>
                    <Input
                      type="number"
                      placeholder="Gib deine Punktzahl ein"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitResult}>Ergebnis speichern</Button>
                    <Button variant="outline" onClick={() => setShowResultForm(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowResultForm(true)}>
                  Neues Ergebnis eintragen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent>
          {workoutDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Workout Typ: {challenge.workoutType.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {workoutDetails.timePerRound} Sekunden pro Runde
                </p>
                <p className="text-sm text-muted-foreground">
                  {workoutDetails.rounds} Runden
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Übungen:</h4>
                <ul className="space-y-2">
                  {workoutDetails.exercises.map((exercise, index) => (
                    <li key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {exercise.reps} Wiederholungen
                      </div>
                      {exercise.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {exercise.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gewinn Details */}
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

      {/* Teilnahme Button */}
      {!isParticipating ? (
        <Button className="w-full" size="lg" onClick={handleJoinChallenge}>
          An Challenge teilnehmen
        </Button>
      ) : (
        <Button 
          className="w-full" 
          size="lg" 
          variant="outline"
          onClick={() => setShowResultForm(true)}
        >
          Ergebnis eintragen
        </Button>
      )}
    </div>
  );
}