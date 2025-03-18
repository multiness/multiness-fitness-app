import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Timer } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

export const ExerciseDetails = ({
  name,
  description,
  instruction,
  icon,
  requirements,
  tips,
  isParticipating,
  onSubmitResult
}: ExerciseDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultValue, setResultValue] = useState("");

  const handleSubmitResult = () => {
    if (onSubmitResult && resultValue) {
      onSubmitResult({
        name,
        value: resultValue,
        unit: name.toLowerCase().includes('zeit') ? 'Zeit' : 'Wiederholungen'
      });
      setShowResultDialog(false);
      setResultValue("");
    }
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full bg-muted/50 rounded-lg transition-all"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:no-underline text-left"
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
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 space-y-3">
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
          {isParticipating && onSubmitResult && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowResultDialog(true)}
              >
                <Timer className="h-4 w-4 mr-2" />
                Ergebnis eintragen
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ergebnis für {name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Dein Ergebnis</Label>
              <Input
                type={name.toLowerCase().includes('zeit') ? 'time' : 'number'}
                placeholder={name.toLowerCase().includes('zeit') ? 'MM:SS' : 'Anzahl eingeben'}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
              />
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