import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Trophy, Timer, Users, Calendar, Crown } from "lucide-react";
import { format } from "date-fns";
import { mockChallenges } from "../data/mockData";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { useUsers } from "../contexts/UserContext";
import { Badge } from "@/components/ui/badge";

export default function ChallengeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { users, currentUser } = useUsers();
  const challenge = mockChallenges.find(c => c.id === parseInt(id || ""));
  const creator = users.find(u => u.id === challenge?.creatorId);

  const [isParticipating, setIsParticipating] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [result, setResult] = useState("");

  if (!challenge || !creator) return <div>Challenge nicht gefunden</div>;

  const currentDate = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isActive = currentDate >= startDate && currentDate <= endDate;
  const isEnded = currentDate > endDate;

  // Aktualisierte Teilnehmerliste mit echten Benutzerdaten
  const participants = challenge.participantIds
    ?.map(participantId => {
      const user = users.find(u => u.id === participantId);
      return user ? {
        ...user,
        points: Math.floor(Math.random() * 1000), // Simulierte Punkte
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.points || 0) - (a?.points || 0)) || [];

  const winners = participants.slice(0, 3);

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
                {format(startDate, "dd. MMMM", { locale: de })} - {format(endDate, "dd. MMMM yyyy", { locale: de })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Info */}
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

      {/* Gewinner Anzeige für beendete Challenges */}
      {isEnded && (
        <Card className="mb-6 border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Challenge Gewinner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {winners.map((winner, index) => (
                <div key={winner.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {index === 0 && <Crown className="absolute -top-2 -left-2 h-5 w-5 text-yellow-400" />}
                      <UserAvatar
                        userId={winner.id}
                        size="md"
                        clickable={true}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{winner.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {index === 0 ? "🥇 Erster Platz" : index === 1 ? "🥈 Zweiter Platz" : "🥉 Dritter Platz"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{winner.points}</p>
                    <p className="text-sm text-muted-foreground">Punkte</p>
                  </div>
                </div>
              ))}
              {winners.length > 0 && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Gewonnener Preis</p>
                      <p className="text-lg font-bold">{challenge.prize}</p>
                      <p className="text-sm text-muted-foreground">{challenge.prizeDescription}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teilnehmer Status & Ergebnisse für aktive Teilnehmer */}
      {isParticipating && !isEnded && (
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

      {/* Rangliste */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Teilnehmer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.slice(0, 5).map((participant, index) => (
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
            <div className="text-center pt-2 text-sm text-muted-foreground">
              Insgesamt {participants.length} aktive Teilnehmer in dieser Challenge
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent>
          {challenge.workoutDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Workout Typ: {challenge.workoutType.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {challenge.workoutDetails.timePerRound} Sekunden pro Runde
                </p>
                <p className="text-sm text-muted-foreground">
                  {challenge.workoutDetails.rounds} Runden
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Übungen:</h4>
                <ul className="space-y-2">
                  {challenge.workoutDetails.exercises.map((exercise, index) => (
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

      {/* Preis Details */}
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
      {!isEnded ? (
        !isParticipating ? (
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
        )
      ) : null}
    </div>
  );
}