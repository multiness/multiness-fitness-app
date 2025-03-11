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
        <CardContent className="space-y-6">
          {/* Ziel-Auswahl */}
          <div className="space-y-2">
            <Label className="text-base">Dein Trainingsziel</Label>
            <Select onValueChange={setSelectedGoal}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wähle dein Ziel" />
              </SelectTrigger>
              <SelectContent>
                {workoutGoals.map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">{goal.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dauer-Auswahl */}
          <div className="space-y-2">
            <Label className="text-base">Gewünschte Trainingsdauer</Label>
            <RadioGroup defaultValue="30" onValueChange={setDuration} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RadioGroupItem value="15">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  15 Minuten
                </Label>
              </RadioGroupItem>
              <RadioGroupItem value="30">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  30 Minuten
                </Label>
              </RadioGroupItem>
              <RadioGroupItem value="45">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  45 Minuten
                </Label>
              </RadioGroupItem>
            </RadioGroup>
          </div>

          {/* Schwierigkeitsgrad */}
          <div className="space-y-2">
            <Label className="text-base">Schwierigkeitsgrad</Label>
            <RadioGroup defaultValue="mittel" onValueChange={setDifficulty} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RadioGroupItem value="anfänger">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  Anfänger
                </Label>
              </RadioGroupItem>
              <RadioGroupItem value="mittel">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  Mittel
                </Label>
              </RadioGroupItem>
              <RadioGroupItem value="fortgeschritten">
                <Label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  Fortgeschritten
                </Label>
              </RadioGroupItem>
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