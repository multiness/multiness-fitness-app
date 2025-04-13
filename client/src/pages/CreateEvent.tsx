import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/contexts/EventContext";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const eventSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  date: z.string().min(1, "Datum ist erforderlich"),
  time: z.string().min(1, "Uhrzeit ist erforderlich"),
  location: z.string().min(1, "Ort ist erforderlich"),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurringDays: z.array(z.number()).optional(),
  image: z.string().optional(),
  isHighlight: z.boolean().default(false),
  type: z.enum(["event", "course"], {
    required_error: "Bitte wähle einen Typ aus",
  }),
  maxParticipants: z.number().min(1, "Mindestens 1 Teilnehmer").optional(),
  unlimitedParticipants: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  requiresRegistration: z.boolean().default(true),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addEvent } = useEvents();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      isRecurring: false,
      recurringType: "weekly",
      isHighlight: false,
      type: "event",
      maxParticipants: 10,
      location: "",
      unlimitedParticipants: false,
      isPublic: false,
      requiresRegistration: true,
    },
  });

  const isRecurring = form.watch("isRecurring");
  const unlimitedParticipants = form.watch("unlimitedParticipants");

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
    const combinedDate = new Date(data.date);
    const [hours, minutes] = data.time.split(':');
    combinedDate.setHours(parseInt(hours), parseInt(minutes));

    const newEvent = {
      ...data,
      date: combinedDate,
      creatorId: 1, // Aktueller Benutzer (Admin)
      currentParticipants: 0,
      isActive: true,
      isArchived: false,
      maxParticipants: data.unlimitedParticipants ? 0 : (data.maxParticipants || 10),
    };

    addEvent(newEvent);

    toast({
      title: "Event erstellt!",
      description: `Das Event "${data.title}" wurde erfolgreich ${data.isRecurring ? 'als wiederkehrendes Event ' : ''}erstellt.`,
    });

    setLocation("/events/manager");
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
              <Label>Event-Typ</Label>
              <RadioGroup
                defaultValue={form.getValues("type")}
                onValueChange={(value) => form.setValue("type", value as "event" | "course")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="event" id="event" />
                  <Label htmlFor="event">Event</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course" id="course" />
                  <Label htmlFor="course">Kurs</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                placeholder="Wo findet das Event statt?"
                {...form.register("location")}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  icon={<CalendarDays className="h-4 w-4" />}
                  {...form.register("date")}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Uhrzeit</Label>
                <Input
                  id="time"
                  type="time"
                  icon={<Clock className="h-4 w-4" />}
                  {...form.register("time")}
                />
                {form.formState.errors.time && (
                  <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Unbegrenzte Teilnehmer</Label>
                  <div className="text-sm text-muted-foreground">
                    Aktiviere diese Option, wenn es keine Teilnehmerbegrenzung geben soll
                  </div>
                </div>
                <Switch
                  checked={unlimitedParticipants}
                  onCheckedChange={(checked) => {
                    form.setValue("unlimitedParticipants", checked);
                    if (checked) {
                      form.setValue("maxParticipants", undefined);
                    }
                  }}
                />
              </div>

              {!unlimitedParticipants && (
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Maximale Teilnehmerzahl</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    {...form.register("maxParticipants", { valueAsNumber: true })}
                  />
                  {form.formState.errors.maxParticipants && (
                    <p className="text-sm text-destructive">{form.formState.errors.maxParticipants.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Als Highlight markieren</Label>
              <div className="space-y-0.5">
                <div className="text-sm text-muted-foreground">
                  Highlight-Events werden prominent auf der Events-Seite angezeigt
                </div>
              </div>
              <Switch
                checked={form.watch("isHighlight")}
                onCheckedChange={(checked) => form.setValue("isHighlight", checked)}
              />
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

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Öffentliches Event</Label>
                  <div className="text-sm text-muted-foreground">
                    Aktiviere diese Option, wenn das Event auch für Nicht-Mitglieder sichtbar sein soll
                  </div>
                </div>
                <Switch
                  checked={form.watch("isPublic")}
                  onCheckedChange={(checked) => form.setValue("isPublic", checked)}
                />
              </div>

              {form.watch("isPublic") && (
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Anmeldung erforderlich</Label>
                    <div className="text-sm text-muted-foreground">
                      Müssen sich externe Teilnehmer für das Event registrieren?
                    </div>
                  </div>
                  <Switch
                    checked={form.watch("requiresRegistration")}
                    onCheckedChange={(checked) => form.setValue("requiresRegistration", checked)}
                  />
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