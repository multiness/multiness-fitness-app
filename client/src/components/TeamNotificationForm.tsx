import { useState } from "react";
import { useUsers } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Diese Komponente erlaubt Team-Mitgliedern, Push-Benachrichtigungen an Benutzer zu senden
export default function TeamNotificationForm() {
  const { users, currentUser } = useUsers();
  const { toast } = useToast();
  
  // Benachrichtigungsdaten
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("all"); // all, premium, specific
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [includeAction, setIncludeAction] = useState(false);
  const [actionUrl, setActionUrl] = useState("");
  const [actionText, setActionText] = useState("Mehr erfahren");
  
  // UI-Zustand
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  
  // Team-Rollen, die Benachrichtigungen senden dürfen
  const allowedRoles = [
    "admin", "moderator", "marketing", "event_manager", 
    "product_manager", "community_manager"
  ];
  
  // Prüfen, ob der aktuelle Benutzer Benachrichtigungen senden darf
  const canSendNotifications = currentUser?.isAdmin || 
    (currentUser?.isTeamMember && allowedRoles.includes(currentUser?.teamRole || ""));
  
  // Benachrichtigung senden
  const handleSendNotification = () => {
    if (!canSendNotifications) {
      toast({
        title: "Keine Berechtigung",
        description: "Sie haben keine Berechtigung, Benachrichtigungen zu senden.",
        variant: "destructive"
      });
      return;
    }
    
    if (!title || !message) {
      toast({
        title: "Fehlende Daten",
        description: "Bitte geben Sie einen Titel und eine Nachricht ein.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    // Hier würde normalerweise die API-Anfrage stattfinden
    // Für dieses Beispiel simulieren wir eine erfolgreiche Anfrage
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      
      toast({
        title: "Benachrichtigung gesendet",
        description: `Die Benachrichtigung wurde erfolgreich an ${
          targetGroup === "all" 
            ? "alle Benutzer" 
            : targetGroup === "premium" 
              ? "Premium-Benutzer" 
              : "den ausgewählten Benutzer"
        } gesendet.`,
      });
      
      // Nach 3 Sekunden den Erfolgsindikator zurücksetzen
      setTimeout(() => {
        setSentSuccess(false);
      }, 3000);
      
      // Formular zurücksetzen
      setTitle("");
      setMessage("");
      setTargetGroup("all");
      setSelectedUserId(null);
      setIncludeAction(false);
      setActionUrl("");
      setActionText("Mehr erfahren");
    }, 1500);
  };
  
  // Benutzerliste für die Auswahl eines bestimmten Benutzers
  const filteredUsers = users
    .filter(user => user.id !== currentUser?.id) // Aktuellen Benutzer ausschließen
    .sort((a, b) => a.name.localeCompare(b.name));
  
  if (!canSendNotifications) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push-Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
            <div>
              <p>Sie haben keine Berechtigung, Push-Benachrichtigungen zu senden.</p>
              <p className="text-sm mt-1">Diese Funktion ist nur für Team-Mitglieder mit speziellen Rollen verfügbar.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push-Benachrichtigungen senden
        </CardTitle>
        <CardDescription>
          Senden Sie Push-Benachrichtigungen an Benutzer der App
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benachrichtigungsdetails */}
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input
            id="title"
            placeholder="z.B. Neue Challenge verfügbar"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Nachricht</Label>
          <Textarea
            id="message"
            placeholder="z.B. Nimm an unserer neuen Sommer-Challenge teil und gewinne tolle Preise!"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        {/* Zielgruppenauswahl */}
        <div className="space-y-2">
          <Label htmlFor="target-group">Zielgruppe</Label>
          <Select 
            value={targetGroup} 
            onValueChange={setTargetGroup}
          >
            <SelectTrigger>
              <SelectValue placeholder="Zielgruppe auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Benutzer</SelectItem>
              <SelectItem value="premium">Premium-Benutzer</SelectItem>
              <SelectItem value="specific">Bestimmter Benutzer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Bestimmten Benutzer auswählen wenn "specific" ausgewählt ist */}
        {targetGroup === "specific" && (
          <div className="space-y-2">
            <Label htmlFor="user-select">Benutzer auswählen</Label>
            <Select 
              value={selectedUserId?.toString() || ""} 
              onValueChange={(value) => setSelectedUserId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Benutzer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} (@{user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Aktion/URL hinzufügen */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="include-action" className="cursor-pointer">Aktion hinzufügen</Label>
            <Switch
              id="include-action"
              checked={includeAction}
              onCheckedChange={setIncludeAction}
            />
          </div>
          
          {includeAction && (
            <div className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="action-url">URL</Label>
                <Input
                  id="action-url"
                  placeholder="z.B. /challenges/5"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Interne URLs ohne https:// eingeben, z.B. /events/1 oder /groups/5
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-text">Aktionstext</Label>
                <Input
                  id="action-text"
                  placeholder="z.B. Zur Challenge"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {targetGroup === "all" 
            ? `Sendet an ${users.length} Benutzer`
            : targetGroup === "premium" 
              ? "Sendet an Premium-Benutzer"
              : "Sendet an einen einzelnen Benutzer"
          }
        </div>
        <Button 
          onClick={handleSendNotification}
          disabled={isSending || !title || !message || (targetGroup === "specific" && !selectedUserId)}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gesendet...
            </>
          ) : sentSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Gesendet
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Benachrichtigung senden
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}