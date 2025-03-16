import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, X } from "lucide-react";
import { useLocation } from "wouter";
import { useUsers } from "../contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function CreatePost() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const { currentUser } = useUsers();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

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
      setIsSubmitting(true);

      const postData = {
        userId: currentUser.id,
        content: content.trim(),
        images: mediaPreview ? [mediaPreview] : []
      };

      const response = await apiRequest("POST", "/api/posts", postData);

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Sofort den Cache invalidieren
      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });

      toast({
        title: "Beitrag erstellt!",
        description: "Dein Beitrag wurde erfolgreich veröffentlicht.",
      });

      setLocation("/");
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Fehler",
        description: "Dein Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <Card>
        <CardHeader>
          <CardTitle>Erstelle deinen Beitrag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Was möchtest du teilen?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />

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
                  type="button"
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
                  <Button variant="outline" className="cursor-pointer" type="button" asChild>
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
                  <Button variant="outline" className="cursor-pointer" type="button" asChild>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video hinzufügen
                    </div>
                  </Button>
                </label>
              </div>
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird veröffentlicht...' : 'Beitrag veröffentlichen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}