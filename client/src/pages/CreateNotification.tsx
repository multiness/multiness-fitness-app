import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Check } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validierungsschema für das Formular
const notificationSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
  schedule: z.boolean().default(false),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  targetGroup: z.enum(["all", "active", "premium"]),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function CreateNotification() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      schedule: false,
      targetGroup: "all",
    },
  });

  const schedule = form.watch("schedule");

  const onSubmit = (data: NotificationFormData) => {
    // Validiere Zeitplan-Felder wenn aktiviert
    if (data.schedule && (!data.scheduleDate || !data.scheduleTime)) {
      toast({
        title: "Fehlende Zeitangaben",
        description: "Bitte fülle Datum und Uhrzeit aus.",
        variant: "destructive",
      });
      return;
    }

    // Importiere notifyAdminMessage erst hier, um zirkuläre Abhängigkeiten zu vermeiden
    import('../lib/notificationStore').then(({ notifyAdminMessage }) => {
      // Erstelle die Admin-Notification mit den Formulardaten
      notifyAdminMessage(data.message);

      toast({
        title: "Push Notification erstellt!",
        description: data.schedule 
          ? "Die Push Notification wird zum geplanten Zeitpunkt versendet."
          : "Die Push Notification wurde erfolgreich versendet.",
        action: (
          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        ),
      });
      setLocation("/admin");
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Push Notification erstellen</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Notification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="Titel der Notification"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea
                id="message"
                placeholder="Nachricht der Notification"
                {...form.register("message")}
                className="min-h-[100px]"
              />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zeitlich planen</Label>
                  <div className="text-sm text-muted-foreground">
                    Plane den Versand für einen späteren Zeitpunkt
                  </div>
                </div>
                <Switch
                  checked={schedule}
                  onCheckedChange={(checked) => form.setValue("schedule", checked)}
                />
              </div>

              {schedule && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Datum</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      {...form.register("scheduleDate")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Uhrzeit</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="scheduleTime"
                        type="time"
                        {...form.register("scheduleTime")}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Zielgruppe</Label>
              <RadioGroup 
                defaultValue={form.getValues("targetGroup")} 
                onValueChange={(value) => form.setValue("targetGroup", value as "all" | "active" | "premium")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Alle Nutzer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Nur aktive Nutzer (letzte 30 Tage)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <Label htmlFor="premium">Nur Premium Nutzer</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.targetGroup && (
                <p className="text-sm text-destructive">{form.formState.errors.targetGroup.message}</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Label className="mb-2">Vorschau</Label>
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Bell className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {form.watch("title") || "Notification Titel"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {form.watch("message") || "Notification Nachricht"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              {schedule ? "Notification planen" : "Notification senden"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}