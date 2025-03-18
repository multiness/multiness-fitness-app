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
  };
  tips?: string[];
  isParticipating?: boolean;
  onSubmitResult?: (result: { name: string; value: string | number; unit?: string }) => void;
  currentResult?: { value: string | number; unit?: string };
}

export const ExerciseDetails = ({
  name,
  description,
  instruction,
  icon,
  requirements,
  tips,
  isParticipating,
  onSubmitResult,
  currentResult
}: ExerciseDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultValue, setResultValue] = useState(currentResult?.value?.toString() || "");

  const handleSubmitResult = () => {
    if (onSubmitResult && resultValue) {
      onSubmitResult({
        name,
        value: resultValue,
        unit: getUnitForExercise(name)
      });
      setShowResultDialog(false);
      setResultValue("");
    }
  };

  const getUnitForExercise = (exerciseName: string) => {
    const lowerName = exerciseName.toLowerCase();
    if (lowerName.includes('lauf') && lowerName.includes('mile')) return 'Meilen';
    if (lowerName.includes('lauf') && lowerName.includes('meter')) return 'Meter';
    if (lowerName.includes('zeit') || lowerName.includes('time')) return 'Zeit';
    if (lowerName.includes('gewicht') || lowerName.includes('weight')) return 'kg';
    if (lowerName.includes('distanz') || lowerName.includes('distance')) return 'km';
    if (lowerName.includes('sprint')) return 'Sekunden';
    return 'Wiederholungen';
  };

  const getInputType = (exerciseName: string) => {
    const lowerName = exerciseName.toLowerCase();
    if (lowerName.includes('zeit') || lowerName.includes('time') || 
        lowerName.includes('sprint') || lowerName.includes('lauf')) {
      return 'time';
    }
    return 'number';
  };

  const getPlaceholder = (exerciseName: string) => {
    const unit = getUnitForExercise(exerciseName);
    switch (unit) {
      case 'Zeit': return 'MM:SS';
      case 'Sekunden': return 'Sekunden';
      case 'Meilen': return 'Meilen';
      case 'Meter': return 'Meter';
      case 'km': return 'Kilometer';
      case 'kg': return 'Kilogramm';
      default: return 'Anzahl eingeben';
    }
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
                  onClick={() => setShowResultDialog(true)}
                  className="w-full sm:w-auto"
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
            <DialogTitle>Ergebnis für {name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Dein Ergebnis</Label>
              <Input
                type={getInputType(name)}
                placeholder={getPlaceholder(name)}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Einheit: {getUnitForExercise(name)}
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