import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "./UserAvatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers } from "../contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { Shield, ImagePlus, X } from "lucide-react";

const MAX_IMAGE_SIZE = 200;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const ratio = width / height;
        if (width > height) {
          width = Math.min(width, MAX_IMAGE_SIZE);
          height = Math.round(width / ratio);
        } else {
          height = Math.min(height, MAX_IMAGE_SIZE);
          width = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedImage = canvas.toDataURL('image/webp', 0.4);
        const base64Length = compressedImage.length - (compressedImage.indexOf(',') + 1);
        const size = (base64Length * 3) / 4;

        if (size > MAX_FILE_SIZE) {
          reject(new Error("Das Bild ist zu groß. Bitte versuche es mit einem kleineren Bild."));
          return;
        }

        resolve(compressedImage);
      };
      img.onerror = () => reject(new Error("Fehler beim Laden des Bildes"));
    };
    reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
  });
};

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string;
    image?: string;
    participantIds: number[];
    adminIds: number[];
    creatorId: number;
  };
  onSave: (groupId: number, updatedData: {
    name: string;
    description: string;
    image?: string;
    adminIds: number[];
  }) => void;
}

export default function EditGroupDialog({
  open,
  onOpenChange,
  group,
  onSave,
}: EditGroupDialogProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [image, setImage] = useState(group.image);
  const [adminIds, setAdminIds] = useState<number[]>(group.adminIds || []);
  const { toast } = useToast();
  const { users } = useUsers();

  useEffect(() => {
    setName(group.name);
    setDescription(group.description);
    setImage(group.image);
    setAdminIds(group.adminIds || []);
  }, [group]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setImage(compressedImage);
      } catch (error) {
        toast({
          title: "Fehler beim Bildupload",
          description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Gruppennamen ein.",
        variant: "destructive",
      });
      return;
    }

    onSave(group.id, {
      name: name.trim(),
      description: description.trim(),
      image,
      adminIds,
    });

    toast({
      title: "Gruppe aktualisiert",
      description: "Die Änderungen wurden erfolgreich gespeichert.",
    });

    onOpenChange(false);
  };

  const toggleAdmin = (userId: number) => {
    if (userId === group.creatorId) {
      toast({
        title: "Nicht möglich",
        description: "Der Ersteller der Gruppe kann nicht entfernt werden.",
        variant: "destructive",
      });
      return;
    }

    setAdminIds(current =>
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gruppe bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeite die Details deiner Gruppe. Admins können die Gruppe verwalten und Mitglieder moderieren.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Group Image Section */}
          <div className="space-y-2">
            <Label>Gruppenbild</Label>
            <div className="relative">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Gruppenbild"
                    className="w-full h-[200px] object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setImage(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="group-image"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="group-image">
                    <Button variant="outline" className="w-full cursor-pointer" asChild>
                      <div className="flex items-center justify-center gap-2">
                        <ImagePlus className="h-4 w-4" />
                        Gruppenbild hochladen
                      </div>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Gruppenname</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gruppenname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe deine Gruppe..."
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Mitglieder & Admins
            </Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {group.participantIds.map(userId => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;

                  const isCreator = userId === group.creatorId;
                  const isAdmin = adminIds.includes(userId);

                  return (
                    <div key={userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          userId={user.id}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.username}
                            {isCreator && (
                              <Badge variant="default" className="ml-2">
                                Ersteller
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`admin-${userId}`} className="text-sm">
                          Admin
                        </Label>
                        <Switch
                          id={`admin-${userId}`}
                          checked={isCreator || isAdmin}
                          onCheckedChange={() => toggleAdmin(userId)}
                          disabled={isCreator}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}