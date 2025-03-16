import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, X } from "lucide-react";
import { usePostStore, type DailyGoal } from "../lib/postStore";
import { useLocation } from "wouter";
import { useUsers } from "../contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";

export default function CreatePost() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const { currentUser } = useUsers();
  const postStore = usePostStore();
  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melde dich an, um einen Beitrag zu erstellen.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Leerer Beitrag",
        description: "Bitte füge Text hinzu.",
        variant: "destructive",
      });
      return;
    }

    try {
      // API-Aufruf zum Erstellen des Posts
      const response = await apiRequest("POST", "/api/posts", {
        userId: currentUser.id,
        content: content.trim(),
        images: mediaPreview ? [mediaPreview] : []
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const newPost = await response.json();
      console.log("Created post:", newPost);

      // Post zum Store hinzufügen
      postStore.initializePost(newPost);

      toast({
        title: "Beitrag erstellt!",
        description: "Dein Beitrag wurde erfolgreich veröffentlicht.",
      });

      // Zur Startseite navigieren
      setLocation("/");
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Fehler",
        description: "Dein Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
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