import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockWorkoutTemplates, workoutGoals, exerciseDatabase } from "../data/mockData";

interface WorkoutGeneratorProps {
  onSelectWorkout: (template: any) => void;
}

export default function WorkoutGenerator({ onSelectWorkout }: WorkoutGeneratorProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [difficulty, setDifficulty] = useState<string>("mittel");
  const [workoutType, setWorkoutType] = useState<string>("emom");
  const [suggestedWorkout, setSuggestedWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([{ name: "", reps: "", sets: "", description: "" }]);

  const generateWorkout = () => {
    let generatedWorkout = {
      name: "",
      description: "",
      workoutType,
      duration: parseInt(duration),
      difficulty,
      goal: selectedGoal,
      workoutDetails: {}
    };

    const difficultyIndex = {
      "anfänger": 0,
      "mittel": 1,
      "fortgeschritten": 2
    }[difficulty];

    switch(workoutType) {
      case "emom":
        const emomExercises = shuffleArray(exerciseDatabase.emom)
          .slice(0, 3)
          .map(exercise => ({
            name: exercise.name,
            reps: exercise.reps[difficultyIndex],
            description: exercise.description
          }));

        generatedWorkout = {
          ...generatedWorkout,
          name: "EMOM Challenge",
          description: `${duration} Minuten EMOM Workout mit ${emomExercises.length} Übungen`,
          workoutDetails: {
            timePerRound: 60,
            rounds: parseInt(duration),
            exercises: emomExercises
          }
        };
        break;

      case "amrap":
        const amrapExercises = shuffleArray(exerciseDatabase.amrap)
          .slice(0, 4)
          .map(exercise => ({
            name: exercise.name,
            reps: exercise.reps[difficultyIndex],
            description: exercise.description
          }));

        generatedWorkout = {
          ...generatedWorkout,
          name: "AMRAP Challenge",
          description: `${duration} Minuten AMRAP mit ${amrapExercises.length} Übungen`,
          workoutDetails: {
            totalTime: parseInt(duration) * 60,
            exercises: amrapExercises
          }
        };
        break;

      case "hit":
        const hitExercises = shuffleArray(exerciseDatabase.hit)
          .slice(0, 6);

        const workTime = difficultyIndex === 0 ? 30 : difficultyIndex === 1 ? 40 : 45;
        const restTime = difficultyIndex === 0 ? 30 : difficultyIndex === 1 ? 20 : 15;
        const rounds = Math.floor((parseInt(duration) * 60) / (workTime + restTime));

        generatedWorkout = {
          ...generatedWorkout,
          name: "HIT Circuit",
          description: `${duration} Minuten Hochintensives Intervalltraining`,
          workoutDetails: {
            intervals: rounds,
            workTime,
            restTime,
            exercises: hitExercises
          }
        };
        break;

      case "running":
        const runningTemplate = shuffleArray(exerciseDatabase.running)[0];
        const variation = runningTemplate.variations[duration];

        generatedWorkout = {
          ...generatedWorkout,
          name: runningTemplate.name,
          description: `${duration} Minuten ${runningTemplate.description}`,
          workoutDetails: {
            type: "time",
            target: parseInt(duration),
            description: `Aufwärmen: ${variation.warmup}\n` +
                        `${runningTemplate.description}\n` +
                        (variation.intervals ? `${variation.intervals} Intervalle` :
                         variation.blocks ? `${variation.blocks} Blöcke je ${variation.duration}` :
                         `Zieldistanz: ${variation.distance}km`)
          }
        };
        break;
    }

    setSuggestedWorkout(generatedWorkout);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", reps: "", sets: "", description: "" }]);
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="space-y-4">
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

        {/* Workout-Typ */}
        <div className="space-y-2">
          <Label className="text-base">Workout-Typ</Label>
          <Select value={workoutType} onValueChange={setWorkoutType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wähle einen Workout-Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emom">EMOM (Every Minute On the Minute)</SelectItem>
              <SelectItem value="amrap">AMRAP (As Many Rounds As Possible)</SelectItem>
              <SelectItem value="hit">HIT (High Intensity Training)</SelectItem>
              <SelectItem value="running">Lauf-Workout</SelectItem>
              <SelectItem value="custom">Eigenes Workout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dauer-Auswahl */}
        <div className="space-y-2">
          <Label className="text-base">Gewünschte Trainingsdauer</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="radio" id="15min" name="duration" value="15" className="peer hidden" defaultChecked={duration === "15"} onChange={e => setDuration(e.target.value)} />
              <label htmlFor="15min" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                15 Minuten
              </label>
            </div>
            <div>
              <input type="radio" id="30min" name="duration" value="30" className="peer hidden" defaultChecked={duration === "30"} onChange={e => setDuration(e.target.value)} />
              <label htmlFor="30min" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                30 Minuten
              </label>
            </div>
            <div>
              <input type="radio" id="45min" name="duration" value="45" className="peer hidden" defaultChecked={duration === "45"} onChange={e => setDuration(e.target.value)} />
              <label htmlFor="45min" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                45 Minuten
              </label>
            </div>
          </div>
        </div>

        {/* Schwierigkeitsgrad */}
        <div className="space-y-2">
          <Label className="text-base">Schwierigkeitsgrad</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="radio" id="beginner" name="difficulty" value="anfänger" className="peer hidden" defaultChecked={difficulty === "anfänger"} onChange={e => setDifficulty(e.target.value)} />
              <label htmlFor="beginner" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                Anfänger
              </label>
            </div>
            <div>
              <input type="radio" id="intermediate" name="difficulty" value="mittel" className="peer hidden" defaultChecked={difficulty === "mittel"} onChange={e => setDifficulty(e.target.value)} />
              <label htmlFor="intermediate" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                Mittel
              </label>
            </div>
            <div>
              <input type="radio" id="advanced" name="difficulty" value="fortgeschritten" className="peer hidden" defaultChecked={difficulty === "fortgeschritten"} onChange={e => setDifficulty(e.target.value)} />
              <label htmlFor="advanced" className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:text-primary">
                Fortgeschritten
              </label>
            </div>
          </div>
        </div>

        {/* Workout-spezifische Details */}
        {workoutType === "emom" && (
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">EMOM Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sekunden pro Runde</Label>
                <Input type="number" placeholder="60" />
              </div>
              <div>
                <Label>Anzahl Runden</Label>
                <Input type="number" placeholder="10" />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Übungen</Label>
              {exercises.map((exercise, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Input
                    placeholder="Übungsname"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Wiederholungen"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, "reps", e.target.value)}
                    />
                    <Input
                      placeholder="Sätze"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, "sets", e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Beschreibung (optional)"
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, "description", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addExercise}>
                Übung hinzufügen
              </Button>
            </div>
          </div>
        )}

        {workoutType === "amrap" && (
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">AMRAP Details</h3>
            <div>
              <Label>Gesamtzeit (Minuten)</Label>
              <Input type="number" placeholder="20" />
            </div>
            <div className="space-y-4">
              <Label>Übungen</Label>
              {exercises.map((exercise, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Input
                    placeholder="Übungsname"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Wiederholungen"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, "reps", e.target.value)}
                  />
                  <Textarea
                    placeholder="Beschreibung (optional)"
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, "description", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addExercise}>
                Übung hinzufügen
              </Button>
            </div>
          </div>
        )}

        {workoutType === "hit" && (
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">HIT Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Intervalle</Label>
                <Input type="number" placeholder="8" />
              </div>
              <div>
                <Label>Arbeitszeit (Sek)</Label>
                <Input type="number" placeholder="40" />
              </div>
              <div>
                <Label>Pausenzeit (Sek)</Label>
                <Input type="number" placeholder="20" />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Übungen</Label>
              {exercises.map((exercise, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Input
                    placeholder="Übungsname"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                  />
                  <Textarea
                    placeholder="Beschreibung (optional)"
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, "description", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addExercise}>
                Übung hinzufügen
              </Button>
            </div>
          </div>
        )}

        {workoutType === "running" && (
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Lauf Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Art des Laufs</Label>
                <Select defaultValue="distance">
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle die Art" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distanz</SelectItem>
                    <SelectItem value="time">Zeit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zielwert</Label>
                <Input type="number" placeholder="5" />
              </div>
            </div>
            <div>
              <Label>Zusätzliche Details</Label>
              <Textarea placeholder="z.B. Intervalle, Tempowechsel, etc." />
            </div>
          </div>
        )}

        <Button onClick={generateWorkout} className="w-full">
          Workout generieren
        </Button>
      </div>

      {/* Vorgeschlagenes Workout */}
      {suggestedWorkout && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vorgeschlagenes Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{suggestedWorkout.name}</h3>
                <p className="text-muted-foreground">{suggestedWorkout.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 bg-muted rounded-md">🕒 {suggestedWorkout.duration} Min</span>
                <span className="px-2 py-1 bg-muted rounded-md">💪 {suggestedWorkout.difficulty}</span>
              </div>
              {/* Workout Details */}
              <div className="space-y-2">
                <h4 className="font-medium">Übungen:</h4>
                <ul className="space-y-2">
                  {suggestedWorkout.workoutDetails.exercises?.map((exercise: any, index: number) => (
                    <li key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{exercise.name}</div>
                      {exercise.reps && (
                        <div className="text-sm text-muted-foreground">
                          {exercise.reps} Wiederholungen
                        </div>
                      )}
                      {exercise.time && (
                        <div className="text-sm text-muted-foreground">
                          {exercise.time} Sekunden
                        </div>
                      )}
                      {exercise.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {exercise.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
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