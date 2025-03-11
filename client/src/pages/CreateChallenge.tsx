import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, Dumbbell, Trophy, Gift } from "lucide-react";
import WorkoutGenerator from "@/components/WorkoutGenerator";

type WorkoutType = "emom" | "amrap" | "hit" | "running" | "custom";

export default function CreateChallenge() {
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [exercises, setExercises] = useState<string[]>([""]);

  const addExercise = () => {
    setExercises([...exercises, ""]);
  };

  const handleWorkoutSelect = (template: any) => {
    setWorkoutType(template.workoutType as WorkoutType);
    // Dies würde in einer realen Anwendung alle relevanten Felder setzen
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
            <Input placeholder="Gib einen Titel für deine Challenge ein" />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea placeholder="Beschreibe deine Challenge" />
          </div>
          <div>
            <Label>Zeitraum</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" placeholder="Startdatum" />
              <Input type="date" placeholder="Enddatum" />
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
            <Input placeholder="z.B. Premium Protein Paket" />
          </div>
          <div>
            <Label>Gewinn-Beschreibung</Label>
            <Textarea placeholder="Beschreibe den Gewinn im Detail" />
          </div>
          <div>
            <Label>Gewinn-Bild</Label>
            <div className="mt-2">
              <Button variant="outline">Bild hochladen</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">Challenge erstellen</Button>
    </div>
  );
}