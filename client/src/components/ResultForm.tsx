import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dumbbell, Timer, Award } from "lucide-react";

interface ResultFormProps {
  challenge: any;
  onSubmit: (results: any) => void;
  onCancel: () => void;
}

export function ResultForm({ challenge, onSubmit, onCancel }: ResultFormProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  const calculatePoints = () => {
    if (challenge.workoutType === 'badge') {
      return calculateBadgePoints();
    } else if (challenge.workoutType === 'amrap') {
      return calculateAmrapPoints();
    } else if (challenge.workoutType === 'custom' && challenge.workoutDetails.isCircuit) {
      return calculateCircuitPoints();
    } else if (challenge.workoutType === 'custom') {
      return calculateCustomWorkoutPoints();
    } else if (challenge.workoutType === 'time' || challenge.title.toLowerCase().includes('marathon')) {
      return calculateTimeBasedPoints();
    }
    return calculateDefaultPoints();
  };

  const calculateBadgePoints = () => {
    let totalPoints = 0;
    let completedExercises = 0;

    challenge.workoutDetails.exercises.forEach((exercise: any) => {
      const result = parseFloat(results[exercise.name]);
      if (!isNaN(result)) {
        const requirement = exercise.gender_specific[challenge.userGender || 'male'];
        const points = calculateExercisePoints(exercise.name, result, requirement);
        totalPoints += points;
        completedExercises++;
      }
    });

    if (completedExercises === 0) return 0;
    return Math.round(totalPoints / completedExercises);
  };

  const calculateExercisePoints = (exerciseName: string, result: number, requirement: string) => {
    const lowerName = exerciseName.toLowerCase();

    // Zeit-basierte Übungen (niedrigere Zeit = besser)
    if (lowerName.includes('lauf') || lowerName.includes('sprint') || lowerName.includes('pendel')) {
      const reqTime = parseTimeToSeconds(requirement);
      const resultTime = parseTimeToSeconds(result.toString());

      if (resultTime <= reqTime) return 100;
      if (resultTime <= reqTime * 1.1) return 90;
      if (resultTime <= reqTime * 1.2) return 75;
      if (resultTime <= reqTime * 1.3) return 60;
      return 50;
    }

    // Wiederholungs-basierte Übungen (höhere Anzahl = besser)
    if (lowerName.includes('liegestütz') || lowerName.includes('sit-up')) {
      const reqReps = parseInt(requirement);

      if (result >= reqReps * 1.2) return 100;
      if (result >= reqReps * 1.1) return 90;
      if (result >= reqReps) return 75;
      if (result >= reqReps * 0.8) return 60;
      return 50;
    }

    // Distanz-basierte Übungen
    if (lowerName.includes('weitsprung') || lowerName.includes('wurf')) {
      const reqDistance = parseFloat(requirement);

      if (result >= reqDistance * 1.1) return 100;
      if (result >= reqDistance) return 90;
      if (result >= reqDistance * 0.9) return 75;
      if (result >= reqDistance * 0.8) return 60;
      return 50;
    }

    return 50; // Standardwert für nicht spezifizierte Übungen
  };

  const calculateCircuitPoints = () => {
    const maxRounds = challenge.workoutDetails.rounds;
    const completedRounds = parseInt(results.rounds) || 0;
    const timeLimit = challenge.workoutDetails.timeLimit;
    const timeTaken = parseInt(results.time) || 0;

    // Basis-Punkte für geschaffte Runden (max. 80 Punkte)
    let points = (completedRounds / maxRounds) * 80;

    // Zeitbonus (max. 20 Punkte)
    if (timeLimit && timeTaken <= timeLimit) {
      const timeBonus = ((timeLimit - timeTaken) / timeLimit) * 20;
      points += timeBonus;
    }

    return Math.round(Math.min(points, 100));
  };

  const calculateCustomWorkoutPoints = () => {
    let totalPoints = 0;
    let completedExercises = 0;

    challenge.workoutDetails.exercises.forEach((exercise: any) => {
      if (results[exercise.name]) {
        const value = parseFloat(results[exercise.name]);
        if (!isNaN(value)) {
          const target = exercise.target || 0;
          let points = (value / target) * 100;
          points = Math.min(points, 100);
          totalPoints += points;
          completedExercises++;
        }
      }
    });

    return completedExercises > 0 ? Math.round(totalPoints / completedExercises) : 0;
  };

  const calculateTimeBasedPoints = () => {
    const timeTaken = parseTimeToSeconds(results.time);
    if (!timeTaken) return 0;

    // Zeit-Ziele basierend auf Challenge-Typ
    let targetTimes = {
      gold: 0,
      silver: 0,
      bronze: 0
    };

    if (challenge.title.toLowerCase().includes('marathon')) {
      targetTimes = {
        gold: 9000,    // 2:30:00
        silver: 10800,  // 3:00:00
        bronze: 14400   // 4:00:00
      };
    } else if (challenge.title.toLowerCase().includes('halbmarathon')) {
      targetTimes = {
        gold: 4500,    // 1:15:00
        silver: 5400,   // 1:30:00
        bronze: 6300    // 1:45:00
      };
    } else {
      // Standard Zeit-basierte Challenge
      targetTimes = {
        gold: challenge.workoutDetails.targetTime * 0.9,
        silver: challenge.workoutDetails.targetTime,
        bronze: challenge.workoutDetails.targetTime * 1.2
      };
    }

    if (timeTaken <= targetTimes.gold) return 100;
    if (timeTaken <= targetTimes.silver) return 85;
    if (timeTaken <= targetTimes.bronze) return 70;
    return 50;
  };

  const calculateAmrapPoints = () => {
    const rounds = parseInt(results.rounds) || 0;
    const timeLimit = challenge.workoutDetails.timeLimit || 20; // Standard 20 Minuten

    // Berechne erwartete Runden basierend auf der Schwierigkeit
    const expectedRounds = {
      easy: timeLimit / 2,    // Eine Runde alle 2 Minuten
      medium: timeLimit / 3,  // Eine Runde alle 3 Minuten
      hard: timeLimit / 4     // Eine Runde alle 4 Minuten
    };

    const difficulty = challenge.workoutDetails.difficulty || 'medium';
    const target = expectedRounds[difficulty];

    if (rounds >= target * 1.2) return 100;
    if (rounds >= target) return 85;
    if (rounds >= target * 0.8) return 70;
    return 50;
  };

  const calculateDefaultPoints = () => {
    // Standard-Punkteberechnung für andere Challenge-Typen
    return 100;
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;

    // Format: "MM:SS" oder "HH:MM:SS"
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parseInt(timeStr) || 0;
  };

  const handleSubmit = () => {
    // Validierung der Eingaben
    const requiredFields = challenge.workoutType === 'badge' 
      ? challenge.workoutDetails.exercises.map((e: any) => e.name)
      : ['result'];

    const missingFields = requiredFields.filter(field => !results[field]);
    if (missingFields.length > 0) {
      toast({
        title: "Fehlende Eingaben",
        description: "Bitte fülle alle erforderlichen Felder aus.",
        variant: "destructive",
      });
      return;
    }

    // Berechne Punktzahl und sende Ergebnis
    const points = calculatePoints();
    onSubmit({ ...results, points });
  };

  if (challenge.workoutType === 'amrap') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            AMRAP Ergebnis
          </CardTitle>
          <CardDescription>
            Gib die Anzahl der vollständigen Runden ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Anzahl Runden</Label>
            <Input
              type="number"
              placeholder="z.B. 10"
              value={results.rounds || ''}
              onChange={(e) => handleInputChange('rounds', e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">Speichern</Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenge.workoutType === 'badge') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Testergebnisse
          </CardTitle>
          <CardDescription>
            Trage deine Ergebnisse für jede Disziplin ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenge.workoutDetails.exercises.map((exercise: any, index: number) => (
            <div key={index}>
              <Label>{exercise.name}</Label>
              <div className="flex gap-2">
                <Input
                  type={exercise.type === 'time' ? 'time' : 'number'}
                  placeholder={exercise.type === 'time' ? 'MM:SS' : 'Wiederholungen/Distanz'}
                  value={results[exercise.name] || ''}
                  onChange={(e) => handleInputChange(exercise.name, e.target.value)}
                />
                <span className="text-sm text-muted-foreground self-center min-w-[60px]">
                  {exercise.unit || 'Wdh.'}
                </span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">Speichern</Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Für Zeit-basierte Challenges (Marathon, Triathlon etc.)
  if (challenge.workoutType === 'time' || challenge.title.toLowerCase().includes('marathon') || challenge.title.toLowerCase().includes('triathlon')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Zeitergebnis
          </CardTitle>
          <CardDescription>
            Gib deine Zeit im Format HH:MM:SS ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenge.workoutDetails.exercises.map((exercise: any, index: number) => (
            <div key={index}>
              <Label>{exercise.name}</Label>
              <Input
                type="text"
                placeholder="HH:MM:SS"
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                value={results[exercise.name] || ''}
                onChange={(e) => handleInputChange(exercise.name, e.target.value)}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">Speichern</Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard-Formular für andere Challenge-Typen
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ergebnis eintragen</CardTitle>
        <CardDescription>
          Gib dein Ergebnis für diese Challenge ein
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Dein Ergebnis</Label>
          <Input
            type="number"
            placeholder="Ergebnis eingeben"
            value={results.result || ''}
            onChange={(e) => handleInputChange('result', e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="flex-1">Speichern</Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">Abbrechen</Button>
        </div>
      </CardContent>
    </Card>
  );
}