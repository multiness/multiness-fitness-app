import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Clock, Image as ImageIcon, X } from "lucide-react";

// Validierungsschema für das Formular
const eventSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  date: z.string().min(1, "Datum ist erforderlich"),
  time: z.string().min(1, "Uhrzeit ist erforderlich"),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["daily", "weekly", "monthly"]).optional(),
  image: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      isRecurring: false,
      recurringType: "weekly",
    },
  });

  const isRecurring = form.watch("isRecurring");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          form.setValue("image", reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Nicht unterstütztes Format",
          description: "Bitte lade nur Bilder hoch.",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("image", undefined);
  };

  const onSubmit = (data: EventFormData) => {
    // Hier würde in einer echten App das Event erstellt werden
    console.log("Event Data:", data);

    toast({
      title: "Event erstellt!",
      description: `Das Event "${data.title}" wurde erfolgreich ${data.isRecurring ? 'als wiederkehrendes Event ' : ''}erstellt.`,
    });
    setLocation("/admin");
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Event erstellen</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Titel</Label>
              <Input
                id="title"
                placeholder="Name des Events"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Beschreibe das Event"
                className="min-h-[100px]"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    {...form.register("date")}
                  />
                </div>
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Uhrzeit</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    className="pl-10"
                    {...form.register("time")}
                  />
                </div>
                {form.formState.errors.time && (
                  <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wiederkehrendes Event</Label>
                  <div className="text-sm text-muted-foreground">
                    Aktiviere diese Option für regelmäßige Events
                  </div>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={(checked) => form.setValue("isRecurring", checked)}
                />
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <Label>Wiederholungsintervall</Label>
                  <Select
                    value={form.watch("recurringType")}
                    onValueChange={(value) => form.setValue("recurringType", value as "daily" | "weekly" | "monthly")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle ein Intervall" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Event Bild</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Event Preview"
                    className="w-full h-[200px] object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="event-image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="event-image">
                    <Button variant="outline" className="w-full cursor-pointer" type="button" asChild>
                      <div className="flex items-center justify-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Event Bild hochladen
                      </div>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Event erstellen
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}