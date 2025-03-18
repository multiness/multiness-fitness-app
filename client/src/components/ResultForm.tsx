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
    // Hier kommt später die Punkteberechnung basierend auf den Anforderungen
    return 100;
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
