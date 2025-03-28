import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "lucide-react";

const groupGoalSchema = z.object({
  title: z.string().min(2, "Titel muss mindestens 2 Zeichen lang sein"),
  description: z.string().optional(),
  targetDate: z.string(),
  targetValue: z.number().min(0.1, "Zielwert muss größer als 0 sein"),
  unit: z.string().min(1, "Bitte geben Sie eine Einheit an"),
});

type GroupGoalFormData = z.infer<typeof groupGoalSchema>;

interface AddGroupGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GroupGoalFormData) => void;
}

export default function AddGroupGoalModal({ open, onOpenChange, onSave }: AddGroupGoalModalProps) {
  const form = useForm<GroupGoalFormData>({
    resolver: zodResolver(groupGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetDate: new Date().toISOString().split('T')[0],
      targetValue: 0,
      unit: "",
    },
  });

  const onSubmit = (data: GroupGoalFormData) => {
    onSave(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gruppenziel hinzufügen</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="z.B. Gemeinsam Laufen" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Beschreibe das Gruppenziel..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zielwert</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        placeholder="z.B. 100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einheit</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="z.B. km" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zieldatum</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}