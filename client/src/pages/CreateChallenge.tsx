import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";
import WorkoutGenerator from "@/components/WorkoutGenerator";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { mockChallenges } from "../data/mockData";

export default function CreateChallenge() {
  const { toast } = useToast();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [prize, setPrize] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");

  const handleWorkoutSelect = (template: any) => {
    setSelectedWorkout(template);
    setChallengeTitle(`${template.name} Challenge`);

    // Erstelle eine detaillierte Beschreibung mit Workout-Details
    const workoutDescription = `
${template.description}

Workout Details:
Typ: ${template.workoutType.toUpperCase()}
Dauer: ${template.duration} Minuten
Schwierigkeit: ${template.difficulty}

Übungen:
${template.workoutDetails.exercises.map((exercise: any) => 
  `- ${exercise.name}: ${exercise.reps || exercise.time}${exercise.reps ? ' Wiederholungen' : ' Sekunden'}
   ${exercise.description ? `  ${exercise.description}` : ''}
   ${exercise.weight ? `  Gewicht: ${exercise.weight}kg` : ''}`
).join('\n')}

Durchführung:
${template.workoutType === 'amrap' ? 
  `So viele Runden wie möglich in ${template.duration} Minuten.` :
  template.workoutType === 'emom' ?
  `Alle ${template.workoutDetails.timePerRound} Sekunden eine neue Runde für ${template.workoutDetails.rounds} Runden.` :
  `${template.workoutDetails.rounds} Runden, ${template.workoutDetails.timePerRound} Sekunden pro Runde.`}
`.trim();

    setChallengeDescription(workoutDescription);
  };

  const handleCreateChallenge = () => {
    if (!selectedWorkout) {
      toast({
        title: "Kein Workout ausgewählt",
        description: "Bitte generiere zuerst ein Workout für deine Challenge.",
        variant: "destructive",
      });
      return;
    }

    if (!challengeTitle || !challengeDescription || !prize || !prizeDescription) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const newChallenge = {
      id: mockChallenges.length + 1,
      title: challengeTitle,
      description: challengeDescription,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prize,
      prizeDescription,
      workoutType: selectedWorkout.workoutType,
      workoutDetails: selectedWorkout.workoutDetails,
      creatorId: 1, // In einer echten App würde dies der eingeloggte User sein
      image: null,
      prizeImage: null
    };

    // Füge die neue Challenge zu den mockChallenges hinzu
    mockChallenges.push(newChallenge);

    console.log("Neue Challenge:", newChallenge);

    toast({
      title: "Challenge erstellt!",
      description: "Deine Challenge wurde erfolgreich erstellt.",
    });

    // Zurücksetzen der Formularfelder
    setSelectedWorkout(null);
    setChallengeTitle("");
    setChallengeDescription("");
    setPrize("");
    setPrizeDescription("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  };

  return (
    <div className="container py-6 px-4 sm:px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neue Challenge erstellen</h1>

      {/* Workout Generator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutGenerator onSelectWorkout={handleWorkoutSelect} />
        </CardContent>
      </Card>

      {/* Challenge Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input 
              placeholder="Gib einen Titel für deine Challenge ein"
              value={challengeTitle}
              onChange={(e) => setChallengeTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea 
              placeholder="Beschreibe deine Challenge"
              value={challengeDescription}
              onChange={(e) => setChallengeDescription(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <div>
            <Label>Zeitraum</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preis-Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gewinn Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Gewinn-Titel</Label>
            <Input 
              placeholder="z.B. Premium Protein Paket"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>
          <div>
            <Label>Gewinn-Beschreibung</Label>
            <Textarea 
              placeholder="Beschreibe den Gewinn im Detail"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Gewinn-Bild</Label>
            <div className="mt-2">
              <Button variant="outline">Bild hochladen</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleCreateChallenge}>
        Challenge erstellen
      </Button>
    </div>
  );
}