import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, Dumbbell, Trophy, Gift } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockWorkoutTemplates } from "../data/mockData";
import WorkoutGenerator from "@/components/WorkoutGenerator";

type WorkoutType = "emom" | "amrap" | "hit" | "running" | "custom";

export default function CreateChallenge() {
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [exercises, setExercises] = useState<string[]>([""]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const addExercise = () => {
    setExercises([...exercises, ""]);
  };

  const loadTemplate = (templateId: string) => {
    const template = mockWorkoutTemplates.find(t => t.id === parseInt(templateId));
    if (template) {
      setWorkoutType(template.workoutType as WorkoutType);
      // Weitere Template-Details laden...
    }
  };

  const handleWorkoutSelect = (template: any) => {
    setWorkoutType(template.workoutType as WorkoutType);
    // Weitere Template-Details laden
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

      {/* ODER */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Oder</span>
        </div>
      </div>

      {/* Template-Auswahl */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fertiges Workout-Template verwenden</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={loadTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle ein Template" />
            </SelectTrigger>
            <SelectContent>
              {mockWorkoutTemplates.map(template => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Workout-Typ Auswahl */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout-Typ auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            onValueChange={(value) => setWorkoutType(value as WorkoutType)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="emom" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">EMOM</div>
                <p className="text-sm text-muted-foreground">
                  Every Minute On the Minute
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="amrap" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">AMRAP</div>
                <p className="text-sm text-muted-foreground">
                  As Many Rounds As Possible
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="hit" className="mt-1" />
              <div>
                <Dumbbell className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">HIT Training</div>
                <p className="text-sm text-muted-foreground">
                  Hochintensives Intervalltraining
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="running" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">Lauf-Workout</div>
                <p className="text-sm text-muted-foreground">
                  Zeit- oder distanzbasierte Läufe
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="custom" className="mt-1" />
              <div>
                <Trophy className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">Eigenes Workout</div>
                <p className="text-sm text-muted-foreground">
                  Erstelle dein eigenes Workout
                </p>
              </div>
            </Label>
          </RadioGroup>
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

      {/* Workout Details basierend auf dem Typ */}
      {workoutType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutType === "emom" && (
              <>
                <div>
                  <Label>Zeit pro Runde (in Sekunden)</Label>
                  <Input type="number" placeholder="60" />
                </div>
                <div>
                  <Label>Anzahl der Runden</Label>
                  <Input type="number" placeholder="10" />
                </div>
              </>
            )}

            {workoutType === "amrap" && (
              <div>
                <Label>Gesamtzeit (in Minuten)</Label>
                <Input type="number" placeholder="20" />
              </div>
            )}

            {workoutType === "hit" && (
              <>
                <div>
                  <Label>Anzahl der Intervalle</Label>
                  <Input type="number" placeholder="8" />
                </div>
                <div>
                  <Label>Arbeitszeit (in Sekunden)</Label>
                  <Input type="number" placeholder="40" />
                </div>
                <div>
                  <Label>Pausenzeit (in Sekunden)</Label>
                  <Input type="number" placeholder="20" />
                </div>
              </>
            )}

            {workoutType === "running" && (
              <>
                <div>
                  <Label>Art des Laufs</Label>
                  <RadioGroup defaultValue="distance">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="distance" id="distance" />
                      <Label htmlFor="distance">Distanz (km)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="time" id="time" />
                      <Label htmlFor="time">Zeit (Minuten)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Zielwert</Label>
                  <Input type="number" placeholder="5" />
                </div>
              </>
            )}

            {/* Übungen für alle Typen außer Running */}
            {workoutType !== "running" && (
              <div className="space-y-4">
                <Label>Übungen</Label>
                {exercises.map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Input placeholder={`Übung ${index + 1}`} />
                    <Textarea placeholder="Beschreibung der Übung (optional)" />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addExercise}>
                  Übung hinzufügen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      <div className="flex justify-end gap-4">
        <Button variant="outline">Als Template speichern</Button>
        <Button>Challenge erstellen</Button>
      </div>
    </div>
  );
}