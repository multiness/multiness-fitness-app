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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input type="radio" id="15min" name="duration" value="15" className="peer hidden" defaultChecked={duration === "15"} onChange={e => setDuration(e.target.value)} />
                <label htmlFor="15min" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  15 Minuten
                </label>
              </div>
              <div>
                <input type="radio" id="30min" name="duration" value="30" className="peer hidden" defaultChecked={duration === "30"} onChange={e => setDuration(e.target.value)} />
                <label htmlFor="30min" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  30 Minuten
                </label>
              </div>
              <div>
                <input type="radio" id="45min" name="duration" value="45" className="peer hidden" defaultChecked={duration === "45"} onChange={e => setDuration(e.target.value)} />
                <label htmlFor="45min" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  45 Minuten
                </label>
              </div>
            </div>
          </div>

          {/* Schwierigkeitsgrad */}
          <div className="space-y-2">
            <Label className="text-base">Schwierigkeitsgrad</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input type="radio" id="beginner" name="difficulty" value="anfänger" className="peer hidden" defaultChecked={difficulty === "anfänger"} onChange={e => setDifficulty(e.target.value)} />
                <label htmlFor="beginner" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  Anfänger
                </label>
              </div>
              <div>
                <input type="radio" id="intermediate" name="difficulty" value="mittel" className="peer hidden" defaultChecked={difficulty === "mittel"} onChange={e => setDifficulty(e.target.value)} />
                <label htmlFor="intermediate" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  Mittel
                </label>
              </div>
              <div>
                <input type="radio" id="advanced" name="difficulty" value="fortgeschritten" className="peer hidden" defaultChecked={difficulty === "fortgeschritten"} onChange={e => setDifficulty(e.target.value)} />
                <label htmlFor="advanced" className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                  Fortgeschritten
                </label>
              </div>
            </div>
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