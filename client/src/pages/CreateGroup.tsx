import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Image, Lock, Globe, X, UserPlus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { useLocation } from "wouter";
import { useChatStore } from "../lib/chatService";

export default function CreateGroup() {
  const { toast } = useToast();
  const { currentUser } = useUsers();
  const groupStore = useGroupStore();
  const chatStore = useChatStore();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [invites, setInvites] = useState<string[]>([]);
  const [currentInvite, setCurrentInvite] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  const handleAddInvite = () => {
    if (currentInvite.trim() && !invites.includes(currentInvite.trim())) {
      setInvites([...invites, currentInvite.trim()]);
      setCurrentInvite("");
    }
  };

  const removeInvite = (invite: string) => {
    setInvites(invites.filter(i => i !== invite));
  };

  const handleSubmit = async () => {
    // Verhindere doppelte Einreichungen
    if (isSubmitting) {
      return;
    }

    // Setze den Einreichungsstatus auf true, um doppelte Einreichungen zu verhindern
    setIsSubmitting(true);

    if (!currentUser) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melde dich an, um eine Gruppe zu erstellen.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!name.trim() || !description.trim()) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Erstelle die neue Gruppe mit dem groupStore und warte auf die Rückgabe
      const groupId = await groupStore.addGroup({
        name: name.trim(),
        description: description.trim(),
        image: imagePreview || undefined,
        creatorId: currentUser.id,
        participantIds: [currentUser.id],
        adminIds: [currentUser.id], // Der Ersteller ist automatisch Admin
        createdAt: new Date(),
        isPrivate: privacy === "private"
      });

      // Initialisiere den Gruppen-Chat
      if (groupId) {
        try {
          // Chat initialisieren
          await chatStore.initializeGroupChat(groupId);
          
          console.log('Created group with ID:', groupId);
          console.log('Initialized group chat');

          // Erfolgsmeldung und Weiterleitung
          toast({
            title: "Gruppe erstellt!",
            description: "Deine Gruppe wurde erfolgreich erstellt.",
          });

          // Synchronisiere die Gruppen, um sicherzustellen, dass die neue Gruppe persistent ist
          await groupStore.syncWithServer();

          // Navigiere zur Gruppen-Übersicht
          setLocation("/groups");
        } catch (chatError) {
          console.error('Fehler beim Initialisieren des Gruppenchats:', chatError);
          // Trotzdem zur Gruppenübersicht navigieren, da die Gruppe erstellt wurde
          toast({
            title: "Gruppe erstellt, aber...",
            description: "Es gab ein Problem beim Einrichten des Chats. Du kannst die Gruppe trotzdem nutzen.",
          });
          
          // Synchronisiere die Gruppen, um sicherzustellen, dass die neue Gruppe persistent ist
          await groupStore.syncWithServer();
          
          // Navigiere zur Gruppen-Übersicht
          setLocation("/groups");
        }
      } else {
        throw new Error("Keine Gruppen-ID zurückgegeben");
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Gruppe:', error);
      
      // Prüfe, ob die Gruppe trotz Fehler erstellt wurde
      if (error instanceof Error && error.message.includes('Server-Fehler: 409')) {
        // Wenn es ein Konflikt war (z.B. Gruppe existiert bereits), trotzdem zur Übersicht navigieren
        toast({
          title: "Gruppe möglicherweise erstellt",
          description: "Es gab ein Problem, aber die Gruppe könnte trotzdem erstellt worden sein.",
        });
        
        // Synchronisiere die Gruppen, um sicherzustellen, dass wir die neuesten Daten haben
        await groupStore.syncWithServer();
        
        // Navigiere zur Gruppen-Übersicht
        setLocation("/groups");
      } else {
        // Bei anderen Fehlern Fehlermeldung anzeigen und auf der Seite bleiben
        toast({
          title: "Fehler",
          description: "Beim Erstellen der Gruppe ist ein Fehler aufgetreten. Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
      
      setIsSubmitting(false);
    }
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

          {/* Featured Group Option - Nur für Admins sichtbar */}
          {currentUser?.isAdmin && (
            <div className="flex items-center justify-between space-x-2 pt-2">
              <div className="space-y-0.5">
                <Label className="text-base">Featured Gruppe</Label>
                <p className="text-sm text-muted-foreground">
                  Diese Gruppe wird auf der Übersichtsseite hervorgehoben
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  aria-label="Toggle featured status"
                />
                {/*<Pin className={`h-4 w-4 ${isFeatured ? 'text-primary' : 'text-muted-foreground'}`} />*/}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Privatsphäre</Label>
            <RadioGroup defaultValue={privacy} onValueChange={(value: "public" | "private") => setPrivacy(value)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Öffentlich</div>
                    <p className="text-sm text-muted-foreground">
                      Jeder kann der Gruppe beitreten
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Privat</div>
                    <p className="text-sm text-muted-foreground">
                      Beitritt nur auf Anfrage
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Einladungen - nur bei privaten Gruppen */}
          {privacy === "private" && (
            <div className="space-y-2">
              <Label>Mitglieder einladen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Username oder E-Mail"
                  value={currentInvite}
                  onChange={(e) => setCurrentInvite(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInvite()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddInvite}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              {invites.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {invites.map((invite, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                    >
                      {invite}
                      <button
                        onClick={() => removeInvite(invite)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Gruppe wird erstellt..." : "Gruppe erstellen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

