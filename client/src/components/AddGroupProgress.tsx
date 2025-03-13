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
  onSave: (progress: number) => void;
  currentProgress: number;
  goalTitle: string;
}

export default function AddGroupProgress({
  open,
  onOpenChange,
  onSave,
  currentProgress,
  goalTitle,
}: AddGroupProgressProps) {
  const [progress, setProgress] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(progress);
    onOpenChange(false);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fortschritt hinzufügen</DialogTitle>
          <DialogDescription>
            Füge deinen Beitrag zum Gruppenziel "{goalTitle}" hinzu.
            Aktueller Fortschritt: {currentProgress}%
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              placeholder="Fortschritt in %"
            />
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
