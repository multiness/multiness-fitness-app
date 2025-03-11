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

type WorkoutType = "emom" | "amrap" | "hit" | "running" | "custom";

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
    setChallengeDescription(template.description);
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

    // Hier würde in einer echten App die Challenge erstellt werden
    toast({
      title: "Challenge erstellt!",
      description: "Deine Challenge wurde erfolgreich erstellt.",
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
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
            />
          </div>
          <div>
            <Label>Zeitraum</Label>
            <div className="grid grid-cols-2 gap-4">
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