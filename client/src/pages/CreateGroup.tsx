import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Image, X } from "lucide-react";

export default function CreateGroup() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
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
  };

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Hier würde die Gruppe in einer echten App erstellt werden
    toast({
      title: "Gruppe erstellt!",
      description: "Deine Gruppe wurde erfolgreich erstellt.",
    });
  };

  return (
    <div className="container py-6 px-4 sm:px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neue Gruppe erstellen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gruppendetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Gruppenname</Label>
            <Input
              placeholder="Gib deiner Gruppe einen Namen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea
              placeholder="Beschreibe deine Gruppe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Gruppenbild</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Gruppenbild"
                  className="w-full h-[200px] object-cover rounded-lg"
                />
                <Button
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
                  id="group-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label htmlFor="group-image">
                  <Button variant="outline" className="w-full cursor-pointer" asChild>
                    <div className="flex items-center justify-center gap-2">
                      <Image className="h-4 w-4" />
                      Gruppenbild hochladen
                    </div>
                  </Button>
                </label>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Gruppe erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
