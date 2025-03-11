import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Globe,
  Lock,
  Moon,
  UserCog,
  Dumbbell,
  Languages,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeProvider";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    challenges: true,
    messages: true,
    groupUpdates: true,
    workoutReminders: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showWorkouts: true,
    showGroups: true,
  });

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      {/* Allgemeine Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Allgemeine Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sprache</Label>
            <Select defaultValue="de">
              <SelectTrigger>
                <SelectValue placeholder="Wähle deine Sprache" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <div className="text-sm text-muted-foreground">
                Dunkles Erscheinungsbild aktivieren
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Benachrichtigungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Challenge Updates</Label>
              <div className="text-sm text-muted-foreground">
                Updates zu deinen aktiven Challenges
              </div>
            </div>
            <Switch
              checked={notifications.challenges}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, challenges: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Nachrichten</Label>
              <div className="text-sm text-muted-foreground">
                Private Nachrichten und Mentions
              </div>
            </div>
            <Switch
              checked={notifications.messages}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, messages: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gruppen Updates</Label>
              <div className="text-sm text-muted-foreground">
                Aktivitäten in deinen Gruppen
              </div>
            </div>
            <Switch
              checked={notifications.groupUpdates}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, groupUpdates: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Workout Erinnerungen</Label>
              <div className="text-sm text-muted-foreground">
                Erinnerungen an geplante Workouts
              </div>
            </div>
            <Switch
              checked={notifications.workoutReminders}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, workoutReminders: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privatsphäre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privatsphäre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Öffentliches Profil</Label>
              <div className="text-sm text-muted-foreground">
                Dein Profil ist für alle sichtbar
              </div>
            </div>
            <Switch
              checked={privacy.publicProfile}
              onCheckedChange={(checked) =>
                setPrivacy({ ...privacy, publicProfile: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Workouts anzeigen</Label>
              <div className="text-sm text-muted-foreground">
                Deine Workouts sind für andere sichtbar
              </div>
            </div>
            <Switch
              checked={privacy.showWorkouts}
              onCheckedChange={(checked) =>
                setPrivacy({ ...privacy, showWorkouts: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gruppen anzeigen</Label>
              <div className="text-sm text-muted-foreground">
                Deine Gruppenmitgliedschaften sind sichtbar
              </div>
            </div>
            <Switch
              checked={privacy.showGroups}
              onCheckedChange={(checked) =>
                setPrivacy({ ...privacy, showGroups: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Workout Präferenzen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Workout Präferenzen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Standard Workout-Typ</Label>
            <Select defaultValue="emom">
              <SelectTrigger>
                <SelectValue placeholder="Wähle deinen bevorzugten Workout-Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emom">EMOM</SelectItem>
                <SelectItem value="amrap">AMRAP</SelectItem>
                <SelectItem value="hit">HIT</SelectItem>
                <SelectItem value="running">Laufen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bevorzugte Workout-Dauer</Label>
            <Select defaultValue="30">
              <SelectTrigger>
                <SelectValue placeholder="Wähle deine bevorzugte Dauer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Minuten</SelectItem>
                <SelectItem value="30">30 Minuten</SelectItem>
                <SelectItem value="45">45 Minuten</SelectItem>
                <SelectItem value="60">60 Minuten</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Einstellungen speichern</Button>
      </div>
    </div>
  );
}