import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, X } from "lucide-react";
import { usePostStore, type DailyGoal } from "../lib/postStore";
import { useLocation } from "wouter";
import { useUsers } from "../contexts/UserContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CreatePost() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const { currentUser } = useUsers();
  const postStore = usePostStore();
  const [, setLocation] = useLocation();

  // Tagesziel-States
  const [includeDailyGoal, setIncludeDailyGoal] = useState(false);
  const [goalType, setGoalType] = useState<'water' | 'steps' | 'distance' | 'custom'>('water');
  const [goalTarget, setGoalTarget] = useState("");
  const [customGoalName, setCustomGoalName] = useState("");
  const [customGoalUnit, setCustomGoalUnit] = useState("");

  const goalUnits = {
    water: 'Liter',
    steps: 'Schritte',
    distance: 'Kilometer',
    custom: ''
  };

  const handleSubmit = () => {
    if (!currentUser) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melde dich an, um einen Beitrag zu erstellen.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim() && !mediaPreview && !includeDailyGoal) {
      toast({
        title: "Leerer Beitrag",
        description: "Bitte füge Text, Medien oder ein Tagesziel hinzu.",
        variant: "destructive",
      });
      return;
    }

    if (includeDailyGoal && (!goalType || !goalTarget || (goalType === 'custom' && (!customGoalName || !customGoalUnit)))) {
      toast({
        title: "Unvollständiges Tagesziel",
        description: "Bitte gib einen Typ und Zielwert an.",
        variant: "destructive",
      });
      return;
    }

    // Check for existing active goal
    if (includeDailyGoal && postStore.hasActiveGoal(currentUser.id)) {
      const confirmReplace = window.confirm(
        "Du hast bereits ein aktives Tagesziel. Möchtest du es durch dieses neue Ziel ersetzen?"
      );
      if (!confirmReplace) {
        return;
      }
    }

    // Create post based on type
    if (includeDailyGoal) {
      // Create daily goal post
      const dailyGoal: DailyGoal = {
        type: goalType,
        target: Number(goalTarget),
        unit: goalType === 'custom' ? customGoalUnit : goalUnits[goalType],
        progress: 0,
        completed: false,
        customName: goalType === 'custom' ? customGoalName : undefined,
        createdAt: new Date()
      };

      // Only create a post with goal, don't create a separate regular post
      postStore.createPostWithGoal(
        currentUser.id,
        content.trim() || `Neues Tagesziel: ${goalType === 'custom' ? customGoalName : goalType}`,
        dailyGoal
      );
    } else {
      // Create regular post with potential media
      postStore.createPost(
        currentUser.id,
        content.trim(),
        mediaPreview
      );
    }

    toast({
      title: "Beitrag erstellt!",
      description: "Dein Beitrag wurde erfolgreich veröffentlicht.",
    });

    // Navigate to home page
    setLocation("/");
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (isImage || isVideo) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
          setMediaType(isImage ? "image" : "video");
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Nicht unterstütztes Format",
          description: "Bitte lade nur Bilder oder Videos hoch.",
          variant: "destructive",
        });
      }
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
  };

  return (
    <div className="container py-6 px-4 sm:px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neuer Beitrag</h1>

      <Card>
        <CardHeader>
          <CardTitle>Erstelle deinen Beitrag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Was möchtest du teilen?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />

          {/* Tagesziel Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="daily-goal"
              checked={includeDailyGoal}
              onCheckedChange={setIncludeDailyGoal}
            />
            <Label htmlFor="daily-goal">Tagesziel hinzufügen</Label>
          </div>

          {/* Tagesziel Einstellungen */}
          {includeDailyGoal && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Art des Ziels</Label>
                <Select value={goalType} onValueChange={(value: 'water' | 'steps' | 'distance' | 'custom') => setGoalType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle ein Ziel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Wasser trinken</SelectItem>
                    <SelectItem value="steps">Schritte gehen</SelectItem>
                    <SelectItem value="distance">Strecke laufen</SelectItem>
                    <SelectItem value="custom">Eigenes Ziel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zielwert ({goalType === 'custom' ? customGoalUnit : goalUnits[goalType]})</Label>
                <Input
                  type="number"
                  placeholder={`Zielwert in ${goalType === 'custom' ? customGoalUnit : goalUnits[goalType]}`}
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                />
              </div>

              {goalType === 'custom' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name des Ziels</Label>
                    <Input
                      placeholder="z.B. Liegestütze"
                      value={customGoalName}
                      onChange={(e) => setCustomGoalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Einheit</Label>
                    <Input
                      placeholder="z.B. Wiederholungen"
                      value={customGoalUnit}
                      onChange={(e) => setCustomGoalUnit(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              {mediaType === "image" && (
                <img src={mediaPreview} alt="Preview" className="max-h-[300px] rounded-lg" />
              )}
              {mediaType === "video" && (
                <video src={mediaPreview} controls className="max-h-[300px] rounded-lg" />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-4">
            <div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
              <label htmlFor="image-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Bild hinzufügen
                  </div>
                </Button>
              </label>
            </div>
            <div>
              <input
                type="file"
                id="video-upload"
                accept="video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
              <label htmlFor="video-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video hinzufügen
                  </div>
                </Button>
              </label>
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Beitrag veröffentlichen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}