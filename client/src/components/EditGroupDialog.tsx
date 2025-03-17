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
import { mockUsers } from "../data/mockData";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

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

  useEffect(() => {
    setName(group.name);
    setDescription(group.description);
    setImage(group.image);
    setAdminIds(group.adminIds || []);
  }, [group]);

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
            <Label htmlFor="image">Bild-URL</Label>
            <Input
              id="image"
              value={image || ''}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
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
                  const user = mockUsers.find(u => u.id === userId);
                  if (!user) return null;

                  const isCreator = userId === group.creatorId;
                  const isAdmin = adminIds.includes(userId);

                  return (
                    <div key={userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          userId={user.id}
                          avatar={user.avatar}
                          username={user.username}
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