import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gift, Trophy, Users, Calendar, Crown, MessageCircle,
  Dumbbell, Waves, Bike, Timer, Award, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { badgeTests } from "../data/mockData";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { useUsers } from "../contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { ExerciseDetails } from "@/components/ExerciseDetails";
import { useChallengeStore } from "../lib/challengeStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Participant {
  id: number;
  username: string;
  points: number;
  lastUpdate?: Date;
}

interface ExerciseResult {
  name: string;
  value: string | number;
  unit?: string;
  points?: number;
  achievementLevel?: string;
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { users, currentUser } = useUsers();
  const { challenges } = useChallengeStore();

  // Initialize all states at the beginning
  const [isParticipating, setIsParticipating] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [exerciseResults, setExerciseResults] = useState<Record<string, ExerciseResult>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Get challenge from challenges state
  const challengeId = Number(id);
  const challenge = challenges[challengeId];
  const creator = challenge ? users.find(u => u.id === challenge.creatorId) : undefined;

  // Early return if no challenge
  if (!challenge) {
    return <div className="container p-4 text-center">
      <div className="text-lg font-semibold">Challenge wird geladen oder existiert nicht</div>
    </div>;
  }
  
  // Default creator if not found
  const creatorInfo = creator || {
    id: 1,
    username: "unbekannt",
    name: "Unbekannter Ersteller"
  };

  // Calculate dates and states
  const currentDate = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isActive = currentDate >= startDate && currentDate <= endDate;
  const isEnded = currentDate > endDate;

  // Get badge details if applicable
  const isBadgeType = challenge.type && ['badge', 'fitness_test'].includes(challenge.type);
  const badgeDetails = isBadgeType
    ? badgeTests.find(test => test.name === challenge.title.replace(' Challenge', '').replace(' Test', '').trim())
    : null;
  
  // Debug-Infos
  console.log("Challenge info:", {
    challengeType: challenge.type,
    challengeTitle: challenge.title,
    badgeDetails: badgeDetails,
    isParticipating
  });

  useEffect(() => {
    if (challenge) {
      // Lade die tatsächlichen Teilnehmer vom Server
      const fetchParticipants = async () => {
        try {
          setLoading(true);
          console.log(`Lade Teilnehmer für Challenge ${challenge.id}...`);
          const response = await fetch(`/api/challenges/${challenge.id}/participants`);
          
          if (!response.ok) {
            throw new Error(`Fehler beim Laden der Teilnehmer: ${response.status}`);
          }
          
          const participantData = await response.json();
          console.log(`${participantData.length} Teilnehmer für Challenge ${challenge.id} geladen:`, participantData);
          
          // Wandle die Teilnehmerdaten in das Participant-Format um
          const formattedParticipants: Participant[] = participantData.map((p: any) => {
            const matchingUser = users.find(u => u.id === p.userId);
            return {
              id: p.userId,
              username: matchingUser?.username || `Benutzer ${p.userId}`,
              points: p.points || 0,
              lastUpdate: p.updatedAt ? new Date(p.updatedAt) : new Date(),
              achievementLevel: p.achievementLevel
            };
          });
          
          setParticipants(formattedParticipants);
          
          // Prüfen, ob der aktuelle Benutzer bereits teilnimmt
          const isCurrentUserParticipating = participantData.some((p: any) => p.userId === currentUser?.id);
          setIsParticipating(isCurrentUserParticipating);
          
          console.log("Teilnahme Status:", isCurrentUserParticipating ? "Nimmt teil" : "Nimmt nicht teil");
        } catch (error) {
          console.error("Fehler beim Laden der Challenge-Teilnehmer:", error);
          toast({
            title: "Fehler",
            description: "Die Teilnehmer konnten nicht geladen werden.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchParticipants();
    }
  }, [challenge, users, currentUser?.id, toast]);

  const calculateTotalPoints = () => {
    const results = Object.values(exerciseResults);
    if (results.length === 0) return { total: 0, level: null };

    const total = results.reduce((sum, result) => sum + (result.points || 0), 0);
    const average = total / results.length;

    let level = null;
    if (average >= 90) level = 'Gold';
    else if (average >= 75) level = 'Silber';
    else if (average >= 50) level = 'Bronze';

    return { total, level };
  };

  const handleSubmitExerciseResult = async (result: ExerciseResult) => {
    if (!currentUser?.id) {
      toast({
        title: "Nicht angemeldet",
        description: "Du musst angemeldet sein, um Ergebnisse zu speichern.",
        variant: "destructive",
      });
      return;
    }
    
    // Lokales State-Update
    setExerciseResults(prev => ({
      ...prev,
      [result.name]: result
    }));

    const { total, level } = calculateTotalPoints();
    
    try {
      // Ergebnisse an den Server senden
      console.log(`Sende Übungsergebnis für Challenge ${challenge.id}, User ${currentUser.id}:`, result);
      
      const participantData = {
        result: { ...exerciseResults, [result.name]: result },
        points: total,
        achievementLevel: level
      };
      
      // Server-Update
      await fetch(`/api/challenges/${challenge.id}/participants/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(participantData)
      });
      
      // Update local store
      await fetch(`/api/challenges/sync`, { method: 'POST' });
      
      // UI aktualisieren
      setParticipants(prev => prev.map(p =>
        p.id === currentUser.id
          ? { ...p, points: total, lastUpdate: new Date(), achievementLevel: level }
          : p
      ).sort((a, b) => b.points - a.points));
      
      toast({
        title: "Ergebnis gespeichert!",
        description: `${result.name}: ${result.value} ${result.unit} (${result.achievementLevel})`,
      });
    } catch (error) {
      console.error("Fehler beim Speichern des Ergebnisses:", error);
      toast({
        title: "Fehler",
        description: "Dein Ergebnis konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleJoinChallenge = async () => {
    if (isEnded) {
      toast({
        title: "Challenge beendet",
        description: "Diese Challenge ist bereits abgeschlossen.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser?.id) {
      toast({
        title: "Nicht angemeldet",
        description: "Du musst angemeldet sein, um an einer Challenge teilzunehmen.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      // API-Aufruf, um der Challenge beizutreten
      console.log(`Sende Anfrage zum Beitreten zu Challenge ${challenge.id}...`);
      
      const response = await fetch(`/api/challenges/${challenge.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server antwortete mit ${response.status}: ${errorText}`);
      }
      
      const newParticipant = await response.json();
      console.log("Erfolgreicher Beitritt zur Challenge:", newParticipant);
      
      // UI aktualisieren
      setIsParticipating(true);
      
      // Teilnehmerliste aktualisieren
      if (!participants.some(p => p.id === currentUser.id)) {
        setParticipants(prev => [
          ...prev,
          {
            id: currentUser.id || 0,
            username: currentUser.username || "",
            points: 0,
            lastUpdate: new Date()
          }
        ]);
      }
      
      // Store aktualisieren
      try {
        await fetch(`/api/challenges/sync`, { method: 'POST' });
        console.log("Challenge-Store aktualisiert");
      } catch (storeError) {
        console.error("Fehler beim Aktualisieren des Challenge-Stores:", storeError);
      }
      
      toast({
        title: "Erfolgreich beigetreten!",
        description: "Du nimmst jetzt an der Challenge teil.",
      });
    } catch (error) {
      console.error("Fehler beim Beitreten zur Challenge:", error);
      toast({
        title: "Fehler",
        description: "Es gab ein Problem beim Beitreten zur Challenge. Bitte versuche es später erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getExerciseIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('schwimm')) return <Waves className="h-5 w-5 text-primary" />;
    if (lowerName.includes('lauf') || lowerName.includes('sprint')) return <ChevronRight className="h-5 w-5 text-primary" />;
    if (lowerName.includes('rad') || lowerName.includes('bike')) return <Bike className="h-5 w-5 text-primary" />;
    if (lowerName.includes('zeit') || lowerName.includes('time')) return <Timer className="h-5 w-5 text-primary" />;
    return <Dumbbell className="h-5 w-5 text-primary" />;
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
            userId={creatorInfo.id}
            size="md"
            clickable={true}
          />
          <div>
            <div className="font-semibold">{creatorInfo.name}</div>
            <div className="text-sm text-muted-foreground">@{creatorInfo.username}</div>
          </div>
          <Button variant="secondary" className="ml-auto">
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
          <p className="text-muted-foreground whitespace-pre-line">{challenge.description}</p>
        </CardContent>
      </Card>

      {/* Challenge Type Specific Details */}
      {isBadgeType && badgeDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Test Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{badgeDetails.description}</p>
            {isParticipating && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">Dein Fortschritt</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gesamtpunktzahl</span>
                      <span className="font-medium">{calculateTotalPoints().total} Punkte</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((calculateTotalPoints().total / (Object.keys(exerciseResults).length * 100)) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  {calculateTotalPoints().level && (
                    <Badge variant={
                      calculateTotalPoints().level === 'Gold' ? 'default' :
                        calculateTotalPoints().level === 'Silber' ? 'secondary' :
                          'outline'
                    }>
                      {calculateTotalPoints().level}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {badgeDetails.requirements.map((req, index) => (
                <ExerciseDetails
                  key={index}
                  name={req.name}
                  description={req.requirement}
                  requirements={req.gender_specific}
                  icon={getExerciseIcon(req.name)}
                  isParticipating={isParticipating}
                  onSubmitResult={handleSubmitExerciseResult}
                  currentResult={exerciseResults[req.name]}
                  workoutType="badge"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Details */}
      {challenge.workoutDetails?.exercises && (
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
                      {challenge.type.toUpperCase()}
                    </span>
                  </div>
                  {challenge.workoutDetails?.timePerRound && (
                    <div className="flex flex-col items-center p-3 bg-background rounded-lg">
                      <Timer className="h-5 w-5 text-primary mb-2" />
                      <span className="text-sm font-medium">Zeit/Runde</span>
                      <span className="text-sm text-muted-foreground">
                        {challenge.workoutDetails.timePerRound} Sek
                      </span>
                    </div>
                  )}
                  {challenge.workoutDetails?.rounds && (
                    <div className="flex flex-col items-center p-3 bg-background rounded-lg">
                      <ChevronRight className="h-5 w-5 text-primary mb-2" />
                      <span className="text-sm font-medium">Runden</span>
                      <span className="text-sm text-muted-foreground">
                        {challenge.workoutDetails.rounds}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Übungen</h3>
                <div className="space-y-3">
                  {challenge.workoutDetails.exercises.map((exercise: any, index: number) => (
                    <ExerciseDetails
                      key={index}
                      name={exercise.name}
                      description={exercise.description}
                      instruction={exercise.instruction}
                      tips={exercise.tips}
                      icon={getExerciseIcon(exercise.name)}
                      requirements={{
                        reps: exercise.reps,
                        weight: exercise.weight,
                        time: exercise.time,
                        distance: exercise.distance,
                        targetType: exercise.targetType
                      }}
                      isParticipating={isParticipating}
                      onSubmitResult={handleSubmitExerciseResult}
                      currentResult={exerciseResults[exercise.name]}
                      workoutType={challenge.type}
                      totalRounds={challenge.workoutDetails.rounds}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gewinnkarte wird nur angezeigt, wenn es einen Preis gibt */}

      {!isEnded && (
        <div className="flex flex-col sm:flex-row gap-3">
          {!isParticipating ? (
            <Button className="flex-1" size="lg" onClick={handleJoinChallenge}>
              An Challenge teilnehmen
            </Button>
          ) : null}
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