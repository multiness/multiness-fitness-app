import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddGroupProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: number) => void;
  currentProgress: number;
  goalTitle: string;
  targetValue: number;
  unit: string;
  currentValue: number;
}

export default function AddGroupProgress({
  open,
  onOpenChange,
  onSave,
  currentProgress,
  goalTitle,
  targetValue,
  unit,
  currentValue,
}: AddGroupProgressProps) {
  const [value, setValue] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value);
    onOpenChange(false);
    setValue(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fortschritt hinzufügen</DialogTitle>
          <DialogDescription>
            Füge deinen Beitrag zum Gruppenziel "{goalTitle}" hinzu.
            Aktueller Stand: {currentValue.toFixed(1)} von {targetValue} {unit} ({currentProgress}%)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min={0}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder={`Wert in ${unit}`}
              />
              <span className="flex items-center text-sm text-muted-foreground min-w-[3rem]">
                {unit}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">Hinzufügen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}