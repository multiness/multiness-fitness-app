import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ExerciseDetailsProps {
  name: string;
  description?: string;
  instruction?: string;
  icon?: React.ReactNode;
  requirements?: {
    male?: string;
    female?: string;
  };
  tips?: string[];
}

export const ExerciseDetails = ({
  name,
  description,
  instruction,
  icon,
  requirements,
  tips,
}: ExerciseDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full bg-muted/50 rounded-lg transition-all"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 hover:no-underline"
        >
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <span className="font-medium">{name}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0 space-y-3">
        {description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Beschreibung</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
        {instruction && (
          <div>
            <h4 className="text-sm font-medium mb-1">Ausführung</h4>
            <p className="text-sm text-muted-foreground">{instruction}</p>
          </div>
        )}
        {requirements && (
          <div>
            <h4 className="text-sm font-medium mb-1">Anforderungen</h4>
            <div className="grid grid-cols-2 gap-2">
              {requirements.male && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Männer: </span>
                  {requirements.male}
                </div>
              )}
              {requirements.female && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Frauen: </span>
                  {requirements.female}
                </div>
              )}
            </div>
          </div>
        )}
        {tips && tips.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Tipps</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
