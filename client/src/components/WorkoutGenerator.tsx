import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { mockWorkoutTemplates, workoutGoals } from "../data/mockData";

interface WorkoutGeneratorProps {
  onSelectWorkout: (template: any) => void;
}

export default function WorkoutGenerator({ onSelectWorkout }: WorkoutGeneratorProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [difficulty, setDifficulty] = useState<string>("mittel");
  const [suggestedWorkout, setSuggestedWorkout] = useState<any>(null);

  const generateWorkout = () => {
    // Filter Workouts basierend auf den Kriterien
    const matchingWorkouts = mockWorkoutTemplates.filter(workout => {
      return (
        workout.goal === selectedGoal &&
        workout.difficulty === difficulty &&
        Math.abs(workout.duration - parseInt(duration)) <= 15 // 15 Minuten Toleranz
      );
    });

    // Zufällig ein passendes Workout auswählen
    if (matchingWorkouts.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingWorkouts.length);
      setSuggestedWorkout(matchingWorkouts[randomIndex]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workout Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ziel-Auswahl */}
          <div>
            <Label>Dein Trainingsziel</Label>
            <Select onValueChange={setSelectedGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle dein Ziel" />
              </SelectTrigger>
              <SelectContent>
                {workoutGoals.map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dauer-Auswahl */}
          <div>
            <Label>Gewünschte Trainingsdauer</Label>
            <RadioGroup defaultValue="30" onValueChange={setDuration}>
              <div className="grid grid-cols-3 gap-4">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="15" className="mr-2" />
                  15 Minuten
                </Label>
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="30" className="mr-2" />
                  30 Minuten
                </Label>
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="45" className="mr-2" />
                  45 Minuten
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Schwierigkeitsgrad */}
          <div>
            <Label>Schwierigkeitsgrad</Label>
            <RadioGroup defaultValue="mittel" onValueChange={setDifficulty}>
              <div className="grid grid-cols-3 gap-4">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="anfänger" className="mr-2" />
                  Anfänger
                </Label>
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="mittel" className="mr-2" />
                  Mittel
                </Label>
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="fortgeschritten" className="mr-2" />
                  Fortgeschritten
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={generateWorkout} className="w-full">
            Workout generieren
          </Button>
        </CardContent>
      </Card>

      {/* Vorgeschlagenes Workout */}
      {suggestedWorkout && (
        <Card>
          <CardHeader>
            <CardTitle>Vorgeschlagenes Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{suggestedWorkout.name}</h3>
                <p className="text-muted-foreground">{suggestedWorkout.description}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span>🕒 {suggestedWorkout.duration} Min</span>
                <span>💪 {suggestedWorkout.difficulty}</span>
              </div>
              <Button 
                onClick={() => onSelectWorkout(suggestedWorkout)}
                className="w-full"
              >
                Dieses Workout verwenden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
