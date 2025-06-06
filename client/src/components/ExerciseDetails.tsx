import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Timer, Check, Edit2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExerciseDetailsProps {
  name: string;
  description?: string;
  instruction?: string;
  icon?: React.ReactNode;
  requirements?: {
    male?: string;
    female?: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    targetType?: 'time' | 'distance';
  };
  tips?: string[];
  isParticipating?: boolean;
  onSubmitResult?: (result: {
    name: string;
    value: string | number;
    unit?: string;
    points?: number;
    achievementLevel?: string;
  }) => void;
  currentResult?: {
    value: string | number;
    unit?: string;
    points?: number;
    achievementLevel?: string;
  };
  workoutType?: string;
  totalRounds?: number;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({
  name,
  description,
  instruction,
  icon,
  requirements,
  tips,
  isParticipating,
  onSubmitResult,
  currentResult,
  workoutType,
  totalRounds
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultValue, setResultValue] = useState(currentResult?.value?.toString() || "");
  const [additionalValue, setAdditionalValue] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<'time' | 'distance'>(
    requirements?.targetType || 'distance'
  );
  
  // Debug-Infos
  console.log("ExerciseDetails props", {
    name,
    description,
    workoutType,
    isParticipating,
    requirements
  });

  const getUnitForExercise = (exerciseName: string, metric?: 'time' | 'distance') => {
    const lowerName = exerciseName.toLowerCase();

    if (lowerName.includes('lauf') || lowerName.includes('distance')) {
      return metric === 'time' ? 'min:ss' : 'km';
    }

    if (lowerName.includes('kreuzheben') || lowerName.includes('gewicht')) return 'kg';
    if (lowerName.includes('wurf')) return 'm';
    if (lowerName.includes('sprint')) return 'min:ss';
    if (lowerName.includes('meilen')) return 'min:ss';
    if (lowerName.includes('meter')) return 'm';
    if (lowerName.includes('pendel')) return 'Sekunden';
    if (lowerName.includes('plank')) return 'min:ss';
    if (lowerName.includes('situp') || lowerName.includes('pushup') || lowerName.includes('liegestütz')) return 'Wiederholungen';

    return 'Wiederholungen';
  };

  const calculatePoints = (value: string | number, exerciseName: string): { points: number, achievementLevel: string } => {
    const lowerName = exerciseName.toLowerCase();
    let numericValue: number;
    
    // Spezielle Behandlung für Zeitformate (mm:ss)
    if (typeof value === 'string' && (lowerName.includes('time') || value.includes(':') || 
        lowerName.includes('sprint') || lowerName.includes('lauf') || lowerName.includes('plank') || 
        lowerName.includes('meilen'))) {
      const parts = value.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        
        if (!isNaN(minutes) && !isNaN(seconds)) {
          numericValue = minutes * 60 + seconds;
          console.log(`Zeitwert konvertiert: ${value} zu ${numericValue} Sekunden`);
        } else {
          // Fallback, wenn das Format ungültig ist
          console.warn(`Ungültiges Zeitformat: ${value}, verwende direkten Wert`);
          numericValue = parseFloat(value) || 0;
        }
      } else {
        numericValue = parseFloat(value) || 0;
      }
    } else if (typeof value === 'string') {
      numericValue = parseFloat(value) || 0;
    } else {
      numericValue = value;
    }

    if (workoutType === 'emom' && totalRounds) {
      const completionPercentage = (numericValue / totalRounds) * 100;
      let achievementLevel = 'Bronze';
      if (completionPercentage >= 90) achievementLevel = 'Gold';
      else if (completionPercentage >= 75) achievementLevel = 'Silber';

      return {
        points: Math.min(Math.round(completionPercentage), 100),
        achievementLevel
      };
    }

    if (lowerName.includes('lauf') || lowerName.includes('sprint') || lowerName.includes('meilen')) {
      if (selectedMetric === 'time') {
        if (numericValue <= 180) return { points: 100, achievementLevel: 'Gold' };
        if (numericValue <= 240) return { points: 75, achievementLevel: 'Silber' };
        return { points: 50, achievementLevel: 'Bronze' };
      } else {
        if (numericValue >= 10) return { points: 100, achievementLevel: 'Gold' };
        if (numericValue >= 5) return { points: 75, achievementLevel: 'Silber' };
        return { points: 50, achievementLevel: 'Bronze' };
      }
    }

    if (lowerName.includes('liegestütz') || lowerName.includes('pushup')) {
      if (numericValue >= 40) return { points: 100, achievementLevel: 'Gold' };
      if (numericValue >= 30) return { points: 75, achievementLevel: 'Silber' };
      return { points: 50, achievementLevel: 'Bronze' };
    }

    if (lowerName.includes('situp')) {
      if (numericValue >= 50) return { points: 100, achievementLevel: 'Gold' };
      if (numericValue >= 35) return { points: 75, achievementLevel: 'Silber' };
      return { points: 50, achievementLevel: 'Bronze' };
    }

    if (lowerName.includes('kreuzheben')) {
      if (numericValue >= 140) return { points: 100, achievementLevel: 'Gold' };
      if (numericValue >= 100) return { points: 75, achievementLevel: 'Silber' };
      return { points: 50, achievementLevel: 'Bronze' };
    }

    const maxPoints = 100;
    const points = Math.min(Math.round((numericValue / 10) * 10), maxPoints);

    let achievementLevel = 'Bronze';
    if (points >= 90) achievementLevel = 'Gold';
    else if (points >= 75) achievementLevel = 'Silber';

    return { points, achievementLevel };
  };

  const handleSubmitResult = () => {
    if (onSubmitResult && resultValue) {
      const unit = getUnitForExercise(name, selectedMetric);
      let finalValue = resultValue;

      // Behandle verschiedene Workout-Typen
      if (workoutType === 'emom') {
        // Für EMOM, verfolge abgeschlossene Runden
        onSubmitResult({
          name: "Total Rounds",
          value: parseInt(resultValue),
          unit: "Runden",
          points: calculatePoints(parseInt(resultValue), "emom").points,
          achievementLevel: calculatePoints(parseInt(resultValue), "emom").achievementLevel
        });
      } else if (workoutType === 'amrap') {
        // Für AMRAP, erfasse die Anzahl der Wiederholungen
        onSubmitResult({
          name,
          value: parseInt(resultValue),
          unit: "Wiederholungen",
          points: calculatePoints(parseInt(resultValue), name).points,
          achievementLevel: calculatePoints(parseInt(resultValue), name).achievementLevel
        });
      } else if (workoutType === 'hiit') {
        // Für HIIT, erfasse erfolgreich absolvierte Intervalle
        onSubmitResult({
          name,
          value: parseInt(resultValue),
          unit: "Intervalle",
          points: calculatePoints(parseInt(resultValue), name).points,
          achievementLevel: calculatePoints(parseInt(resultValue), name).achievementLevel
        });
      } else if (workoutType === 'running') {
        // Für Lauf-Workouts, erfasse Zeit oder Distanz
        onSubmitResult({
          name,
          value: finalValue,
          unit: selectedMetric === 'time' ? 'min:ss' : 'km',
          points: calculatePoints(finalValue, name).points,
          achievementLevel: calculatePoints(finalValue, name).achievementLevel
        });
      } else if (workoutType === 'badge' || workoutType === 'fitness_test' || workoutType === 'custom') {
        // Für Fitness-Tests und benutzerdefinierte Workouts
        if (additionalValue && unit === 'kg') {
          finalValue = `${resultValue} x ${additionalValue}kg`;
        }

        const { points, achievementLevel } = calculatePoints(resultValue, name);

        onSubmitResult({
          name,
          value: finalValue,
          unit,
          points,
          achievementLevel
        });
      } else {
        // Fallback für andere oder nicht spezifizierte Workout-Typen
        if (additionalValue && unit === 'kg') {
          finalValue = `${resultValue} x ${additionalValue}kg`;
        }

        const { points, achievementLevel } = calculatePoints(resultValue, name);

        onSubmitResult({
          name,
          value: finalValue,
          unit,
          points,
          achievementLevel
        });
      }

      setShowResultDialog(false);
      setResultValue("");
      setAdditionalValue("");
    }
  };

  const getInputType = (exerciseName: string, metric?: 'time' | 'distance') => {
    const unit = getUnitForExercise(exerciseName, metric);
    switch (unit) {
      case 'min:ss':
        return 'time';
      case 'kg':
      case 'm':
      case 'Sekunden':
      case 'km':
        return 'number';
      default:
        return 'number';
    }
  };

  const getPlaceholder = (exerciseName: string, metric?: 'time' | 'distance') => {
    const unit = getUnitForExercise(exerciseName, metric);
    switch (unit) {
      case 'min:ss': return 'MM:SS';
      case 'kg': return 'Gewicht in kg';
      case 'm': return 'Meter';
      case 'km': return 'Kilometer';
      case 'Sekunden': return 'Sekunden';
      case 'Wiederholungen': return 'Anzahl';
      default: return 'Wert eingeben';
    }
  };

  const needsAdditionalInput = (exerciseName: string) => {
    const lowerName = exerciseName.toLowerCase();
    return lowerName.includes('kreuzheben') || lowerName.includes('gewicht');
  };

  const isRunningExercise = (exerciseName: string) => {
    const lowerName = exerciseName.toLowerCase();
    return lowerName.includes('lauf') || lowerName.includes('meilen') || lowerName.includes('distance');
  };

  return (
    <>
      <div className="w-full bg-muted/50 rounded-lg transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4">
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-between p-4 hover:no-underline text-left h-auto w-full"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
              <span className="font-medium truncate">{name}</span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
            )}
          </Button>

          {isParticipating && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentResult ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="flex gap-2 items-center whitespace-nowrap">
                    <Check className="h-3 w-3" />
                    {currentResult.value} {currentResult.unit}
                  </Badge>
                  {currentResult.achievementLevel && (
                    <Badge variant={
                      currentResult.achievementLevel === 'Gold' ? 'default' :
                        currentResult.achievementLevel === 'Silber' ? 'secondary' :
                          'outline'
                    }>
                      {currentResult.achievementLevel}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResultDialog(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowResultDialog(true)}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Ergebnis eintragen
                </Button>
              )}
            </div>
          )}
        </div>

        <Collapsible open={isOpen}>
          <CollapsibleContent className="px-4 pb-4 space-y-3">
            {description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Beschreibung</h4>
                <p className="text-sm text-muted-foreground break-words">{description}</p>
              </div>
            )}
            {instruction && (
              <div>
                <h4 className="text-sm font-medium mb-1">Ausführung</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{instruction}</p>
              </div>
            )}
            {requirements && (
              <div>
                <h4 className="text-sm font-medium mb-1">Anforderungen</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {requirements.male && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Männer: </span>
                      <span className="break-words">{requirements.male}</span>
                    </div>
                  )}
                  {requirements.female && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Frauen: </span>
                      <span className="break-words">{requirements.female}</span>
                    </div>
                  )}
                  {requirements.reps && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Wiederholungen: </span>
                      <span>{requirements.reps}x</span>
                    </div>
                  )}
                  {requirements.weight && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gewicht: </span>
                      <span>{requirements.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {tips && tips.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tipps</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="break-words">
                      <span className="ml-[-1.25rem]">•</span>
                      <span className="ml-2">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {workoutType === 'emom'
                ? `Geschaffte Runden (von ${totalRounds})`
                : `Ergebnis für ${name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {isRunningExercise(name) && !workoutType && (
              <div>
                <Label>Messmethode</Label>
                <Select value={selectedMetric} onValueChange={(value: 'time' | 'distance') => setSelectedMetric(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle die Messmethode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Zeit</SelectItem>
                    <SelectItem value="distance">Distanz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>
                {workoutType === 'emom'
                  ? 'Anzahl geschaffter Runden'
                  : needsAdditionalInput(name)
                    ? 'Wiederholungen'
                    : 'Dein Ergebnis'}
              </Label>
              <Input
                type={
                  getUnitForExercise(name, selectedMetric) === 'min:ss' 
                  ? 'text' 
                  : 'number'
                }
                placeholder={workoutType === 'emom' ? `Max: ${totalRounds}` : getPlaceholder(name, selectedMetric)}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                max={workoutType === 'emom' ? totalRounds : undefined}
                pattern={getUnitForExercise(name, selectedMetric) === 'min:ss' ? '[0-9]:[0-5][0-9]' : undefined}
              />
              {needsAdditionalInput(name) && !workoutType && (
                <div className="mt-4">
                  <Label>Gewicht</Label>
                  <Input
                    type="number"
                    placeholder="Gewicht in kg"
                    value={additionalValue}
                    onChange={(e) => setAdditionalValue(e.target.value)}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {workoutType === 'emom'
                  ? `Maximale Rundenzahl: ${totalRounds}`
                  : `Einheit: ${getUnitForExercise(name, selectedMetric)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitResult} className="flex-1">
                Speichern
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResultDialog(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};