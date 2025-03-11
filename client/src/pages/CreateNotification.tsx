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
import { Bell, Clock } from "lucide-react";

export default function CreateNotification() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");

  const handleSubmit = () => {
    if (!title || !message) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Hier würde in einer echten App die Notification erstellt werden
    toast({
      title: "Push Notification erstellt!",
      description: schedule 
        ? "Die Push Notification wird zum geplanten Zeitpunkt versendet."
        : "Die Push Notification wurde erfolgreich versendet.",
    });
    setLocation("/admin");
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Push Notification erstellen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notification Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input
              placeholder="Titel der Notification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nachricht</Label>
            <Textarea
              placeholder="Nachricht der Notification"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
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
                onCheckedChange={setSchedule}
              />
            </div>

            {schedule && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Uhrzeit</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Zielgruppe</Label>
            <RadioGroup defaultValue={targetGroup} onValueChange={setTargetGroup}>
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
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            <Bell className="h-4 w-4 mr-2" />
            {schedule ? "Notification planen" : "Notification senden"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
