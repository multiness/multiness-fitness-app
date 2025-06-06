import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Trophy,
  Users2,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  Shield,
  Search,
  Link as LinkIcon,
  Copy,
  BarChart,
  Bell,
  Package,
  Hash,
  Clock,
  Archive,
  Plus,
  User,
  Save,
  Trash,
  Database,
  RotateCcw,
  Settings,
  Calendar,
  RefreshCw,
  Check,
  Loader2,
  HardDrive,
  Info,
  CalendarRange,
  CalendarDays,
  UserCog,
  UserX,
  Key,
  Lock,
  Unlock,
  Edit,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { DEFAULT_BANNER_POSITIONS } from "../../../shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useUsers, loadAPIUsers } from "../contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAdmin } from "@/contexts/AdminContext";
import { useProducts } from "@/contexts/ProductContext";
import { usePostStore } from "../lib/postStore";
import { useChallengeStore } from "../lib/challengeStore";
import { useGroupStore } from "../lib/groupStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  adminCreateBackup, 
  adminRestoreBackup, 
  adminViewBackups, 
  adminDeleteBackup 
} from "../lib/backupService";
import UserManagement from "@/components/UserManagement";

// Alte lokale Benutzerverwaltung - wird durch importierte Komponente ersetzt
function OldUserManagement() {
  const { users, toggleLock, resetPassword, deleteUser } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "reset" | "lock" | "unlock" | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const { toast } = useToast();

  // Benutzer nach Name oder Benutzernamen filtern
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Konto sperren Dialog öffnen
  const openLockDialog = (userId: number) => {
    setSelectedUserId(userId);
    setLockReason("");
    setIsLockDialogOpen(true);
  };

  // Bestätigungsdialog schließen und Zustände zurücksetzen
  const closeConfirmDialog = () => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
    setSelectedUserId(null);
  };

  // Bestätigungsdialog öffnen
  const openConfirmDialog = (userId: number, action: "delete" | "reset" | "lock" | "unlock") => {
    setSelectedUserId(userId);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  // Bestätigte Aktion ausführen
  const executeConfirmedAction = async () => {
    if (!selectedUserId || !confirmAction) return;
    
    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (!selectedUser) return;

      switch (confirmAction) {
        case "delete":
          await deleteUser(selectedUserId);
          toast({
            title: "Benutzer gelöscht",
            description: `Das Konto von ${selectedUser.name} wurde erfolgreich gelöscht.`,
          });
          break;
        case "reset":
          const newPwd = await resetPassword(selectedUserId);
          if (newPwd) {
            setNewPassword(newPwd);
            setIsPasswordResetModalOpen(true);
          }
          break;
        case "lock":
        case "unlock":
          toggleLock(selectedUserId, confirmAction === "lock" ? "Administrativer Eingriff" : undefined);
          toast({
            title: confirmAction === "lock" ? "Konto gesperrt" : "Konto entsperrt",
            description: confirmAction === "lock" 
              ? `Das Konto von ${selectedUser.name} wurde gesperrt.` 
              : `Das Konto von ${selectedUser.name} wurde entsperrt.`,
            variant: confirmAction === "lock" ? "destructive" : "default",
          });
          break;
      }
    } catch (error) {
      console.error("Fehler bei der Ausführung der Aktion:", error);
      toast({
        title: "Fehler",
        description: "Die Aktion konnte nicht ausgeführt werden.",
        variant: "destructive",
      });
    } finally {
      closeConfirmDialog();
    }
  };

  // Konto sperren mit Grund
  const lockAccountWithReason = () => {
    if (!selectedUserId) return;
    
    toggleLock(selectedUserId, lockReason || "Administrativer Eingriff");
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      toast({
        title: "Konto gesperrt",
        description: `Das Konto von ${selectedUser.name} wurde gesperrt.`,
        variant: "destructive",
      });
    }
    
    setIsLockDialogOpen(false);
    setSelectedUserId(null);
    setLockReason("");
  };

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Benutzerverwaltung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Benutzerkonten verwalten
          </CardTitle>
          <CardDescription>
            Hier können Sie Benutzerkonten sperren, entsperren, löschen oder Passwörter zurücksetzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {users.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Gesamte Benutzer</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.isLocked).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Gesperrte Konten</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {users.filter(u => !u.isVerified).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Unbestätigte Konten</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.isVerified && !u.isLocked).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Aktive Konten</p>
                </CardContent>
              </Card>
            </div>

            {/* Suchleiste */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nutzer suchen..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Benutzerliste - Desktop Ansicht */}
            <div className="hidden sm:block border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-3 font-medium text-sm border-b bg-muted/40">
                <div className="col-span-4">Benutzer</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Registriert am</div>
                <div className="col-span-4 text-right">Aktionen</div>
              </div>
              <ScrollArea className="h-[400px]">
                {filteredUsers.map(user => (
                  <div key={user.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0">
                    <div className="col-span-4 flex items-center gap-2">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/32"} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/32";
                        }}
                      />
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {user.name}
                          {user.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {user.isLocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Gesperrt
                        </Badge>
                      ) : user.isVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 gap-1 bg-green-50">
                          <Check className="h-3 w-3" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Unbestätigt
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </div>
                    <div className="col-span-4 flex justify-end gap-2">
                      {user.isLocked ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openConfirmDialog(user.id, "unlock")}
                          disabled={user.id === 1 && user.username === "maxmustermann"}
                          className="gap-1"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Entsperren
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openLockDialog(user.id)}
                          disabled={user.id === 1 && user.username === "maxmustermann"}
                          className="gap-1 border-amber-200 hover:bg-amber-50"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Sperren
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConfirmDialog(user.id, "reset")}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        className="gap-1"
                      >
                        <Key className="h-3.5 w-3.5" />
                        Passwort
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => openConfirmDialog(user.id, "delete")}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        className="gap-1"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Benutzerliste - Mobile Ansicht */}
            <div className="sm:hidden border rounded-md">
              <div className="p-3 font-medium text-sm border-b bg-muted/40">
                Benutzer & Aktionen
              </div>
              <ScrollArea className="h-[400px]">
                {filteredUsers.map(user => (
                  <div key={user.id} className="p-3 border-b last:border-b-0">
                    {/* Benutzerinfo und Avatar */}
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/32"} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/32";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-1 truncate">
                          {user.name}
                          {user.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                        <div className="flex mt-1 items-center gap-2">
                          {user.isLocked ? (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Gesperrt
                            </Badge>
                          ) : user.isVerified ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 gap-1 bg-green-50">
                              <Check className="h-3 w-3" />
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Unbestätigt
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Registriert: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Aktionsbuttons */}
                    <div className="flex flex-wrap gap-2">
                      {user.isLocked ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openConfirmDialog(user.id, "unlock")}
                          disabled={user.id === 1 && user.username === "maxmustermann"}
                          className="gap-1 flex-1"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Entsperren
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openLockDialog(user.id)}
                          disabled={user.id === 1 && user.username === "maxmustermann"}
                          className="gap-1 border-amber-200 hover:bg-amber-50 flex-1"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Sperren
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConfirmDialog(user.id, "reset")}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        className="gap-1 flex-1"
                      >
                        <Key className="h-3.5 w-3.5" />
                        Passwort zurücksetzen
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => openConfirmDialog(user.id, "delete")}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        className="gap-1"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bestätigungsdialog */}
      {isConfirmOpen && selectedUserId && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              {confirmAction === "delete" ? "Benutzer löschen" :
               confirmAction === "reset" ? "Passwort zurücksetzen" :
               confirmAction === "lock" ? "Konto sperren" : "Konto entsperren"}
            </h3>
            <p className="mb-6 text-muted-foreground">
              {confirmAction === "delete" ? "Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden." :
               confirmAction === "reset" ? "Möchten Sie das Passwort dieses Benutzers zurücksetzen? Ein neues Passwort wird generiert." :
               confirmAction === "lock" ? "Möchten Sie dieses Konto sperren? Der Benutzer kann sich nicht mehr anmelden." :
               "Möchten Sie dieses Konto entsperren? Der Benutzer kann sich wieder anmelden."}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeConfirmDialog}>
                Abbrechen
              </Button>
              <Button 
                variant={confirmAction === "delete" ? "destructive" : "default"}
                onClick={executeConfirmedAction}
              >
                Bestätigen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sperrgrund-Dialog */}
      {isLockDialogOpen && selectedUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Konto sperren</h3>
            <p className="mb-4 text-muted-foreground">
              Bitte geben Sie einen Grund für die Sperrung an (optional):
            </p>
            <Input
              placeholder="Grund für die Sperrung"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsLockDialogOpen(false);
                  setSelectedUserId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={lockAccountWithReason}>
                Konto sperren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Passwort-Reset-Modal */}
      {isPasswordResetModalOpen && newPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Neues Passwort</h3>
            <p className="mb-4 text-muted-foreground">
              Das Passwort wurde zurückgesetzt. Bitte notieren Sie sich das neue Passwort und teilen Sie es dem Benutzer mit:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-center mb-4 break-all">
              {newPassword}
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                className="gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(newPassword);
                  toast({
                    title: "Kopiert!",
                    description: "Das Passwort wurde in die Zwischenablage kopiert."
                  });
                }}
              >
                <Copy className="h-4 w-4" />
                Kopieren
              </Button>
              <Button 
                onClick={() => {
                  setIsPasswordResetModalOpen(false);
                  setNewPassword(null);
                }}
              >
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Team-Mitglied-Verwaltung
function TeamManagement() {
  const { users, toggleTeamMember, toggleAdmin, updateTeamRole } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Benutzer nach Name oder Benutzernamen filtern
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Team-Rollen für Auswahlfeld
  const teamRoles = [
    { id: "member", label: "Mitglied" },
    { id: "trainer", label: "Trainer" },
    { id: "coach", label: "Coach" },
    { id: "support", label: "Support" },
    { id: "moderator", label: "Moderator" },
    { id: "marketing", label: "Marketing" },
    { id: "event_manager", label: "Event-Manager" },
    { id: "product_manager", label: "Produkt-Manager" },
    { id: "community_manager", label: "Community-Manager" },
    { id: "content_creator", label: "Content-Creator" },
    { id: "head_trainer", label: "Cheftrainer" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Team-Verwaltung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Teammitglieder verwalten
          </CardTitle>
          <CardDescription>
            Hier können Sie Team-Mitglieder hinzufügen oder entfernen und deren Rollen verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {users.filter(u => u.isTeamMember).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Team-Mitglieder</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.isAdmin).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Administratoren</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {users.filter(u => u.isVerified).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Verifizierte Benutzer</p>
                </CardContent>
              </Card>
            </div>

            {/* Suchleiste */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nutzer suchen..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Benutzerliste - Desktop Ansicht */}
            <div className="hidden sm:block border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-3 font-medium text-sm border-b bg-muted/40">
                <div className="col-span-3">Benutzer</div>
                <div className="col-span-2">Rolle</div>
                <div className="col-span-2 text-center">Team-Mitglied</div>
                <div className="col-span-2 text-center">Admin</div>
                <div className="col-span-3 text-right">Aktionen</div>
              </div>
              <ScrollArea className="h-[400px]">
                {filteredUsers.map(user => (
                  <div key={user.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0">
                    <div className="col-span-3 flex items-center gap-2">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/32"} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/32";
                        }}
                      />
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {user.name}
                          {user.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {user.isTeamMember ? (
                        <select
                          className="w-full p-1 text-sm rounded border"
                          value={user.teamRole || "member"}
                          onChange={(e) => {
                            updateTeamRole(user.id, e.target.value);
                            toast({
                              title: "Rolle aktualisiert",
                              description: `Die Rolle von ${user.name} wurde geändert.`,
                            });
                          }}
                        >
                          {teamRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <Switch
                        checked={!!user.isTeamMember}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        onCheckedChange={() => {
                          toggleTeamMember(user.id);
                          toast({
                            title: user.isTeamMember ? "Aus Team entfernt" : "Zum Team hinzugefügt",
                            description: user.isTeamMember
                              ? `${user.name} ist kein Team-Mitglied mehr.`
                              : `${user.name} ist jetzt Teil des Teams.`,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      <Switch
                        checked={!!user.isAdmin}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                        onCheckedChange={() => {
                          toggleAdmin(user.id);
                          toast({
                            title: user.isAdmin ? "Admin-Rechte entzogen" : "Als Admin festgelegt",
                            description: user.isAdmin
                              ? `${user.name} ist kein Administrator mehr.`
                              : `${user.name} hat jetzt Administrator-Rechte.`,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/profile/${user.id}`}>
                          Profil
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Benutzerliste - Mobile Ansicht */}
            <div className="sm:hidden border rounded-md">
              <div className="p-3 font-medium text-sm border-b bg-muted/40">
                Benutzer & Berechtigungen
              </div>
              <ScrollArea className="h-[400px]">
                {filteredUsers.map(user => (
                  <div key={user.id} className="p-3 border-b last:border-b-0">
                    {/* Benutzerinfo und Avatar */}
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/32"} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/32";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-1 truncate">
                          {user.name}
                          {user.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    
                    {/* Aktionsbuttons */}
                    <div className="flex justify-between mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link href={`/profile/${user.id}`}>
                          <User className="h-4 w-4 mr-1" />
                          Profil ansehen
                        </Link>
                      </Button>
                    </div>

                    {/* Berechtigungen */}
                    <div className="border rounded-md p-2 mb-3 bg-muted/20">
                      <h4 className="text-xs font-semibold mb-2 px-1">Berechtigungen</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 bg-background p-2 rounded-md">
                          <div className="text-xs font-medium flex items-center justify-between">
                            <span>Team-Mitglied</span>
                            <Switch
                              checked={!!user.isTeamMember}
                              disabled={user.id === 1 && user.username === "maxmustermann"}
                              onCheckedChange={() => {
                                toggleTeamMember(user.id);
                                toast({
                                  title: user.isTeamMember ? "Aus Team entfernt" : "Zum Team hinzugefügt",
                                  description: user.isTeamMember
                                    ? `${user.name} ist kein Team-Mitglied mehr.`
                                    : `${user.name} ist jetzt Teil des Teams.`,
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1 bg-background p-2 rounded-md">
                          <div className="text-xs font-medium flex items-center justify-between">
                            <span>Administrator</span>
                            <Switch
                              checked={!!user.isAdmin}
                              disabled={user.id === 1 && user.username === "maxmustermann"}
                              onCheckedChange={() => {
                                toggleAdmin(user.id);
                                toast({
                                  title: user.isAdmin ? "Admin-Rechte entzogen" : "Als Admin festgelegt",
                                  description: user.isAdmin
                                    ? `${user.name} ist kein Administrator mehr.`
                                    : `${user.name} hat jetzt Administrator-Rechte.`,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team-Rolle Auswahl (nur anzeigen wenn Team-Mitglied) */}
                    {user.isTeamMember && (
                      <div className="border rounded-md p-2 bg-muted/20">
                        <h4 className="text-xs font-semibold mb-2 px-1">Team-Rolle zuweisen</h4>
                        <select
                          className="w-full p-2 text-sm rounded border bg-background"
                          value={user.teamRole || "member"}
                          onChange={(e) => {
                            updateTeamRole(user.id, e.target.value);
                            toast({
                              title: "Rolle aktualisiert",
                              description: `Die Rolle von ${user.name} wurde geändert.`,
                            });
                          }}
                        >
                          {teamRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>

            <Alert>
              <AlertDescription>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Team-Mitglieder Berechtigungen</p>
                    <p className="text-sm text-muted-foreground">
                      Team-Mitglieder können je nach Rolle Push-Nachrichten senden, 
                      Events erstellen und verwalten, Marketing-Banner erstellen und weitere Funktionen nutzen.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Backup Management Component
// Komponente zur Verwaltung der Gruppensynchronisation
function GroupSyncManagement() {
  const [isResetting, setIsResetting] = useState(false);
  const groupStore = useGroupStore();
  const { toast } = useToast();

  const handleResetGroupIds = async () => {
    if (window.confirm('ACHTUNG: Alle Gruppen-IDs werden zurückgesetzt. Dies kann bestehende Chat-Zuordnungen beeinflussen. Fortfahren?')) {
      try {
        setIsResetting(true);
        const result = await groupStore.resetGroupIds();
        
        toast({
          title: "Gruppen-IDs zurückgesetzt",
          description: "Alle Gruppen-IDs wurden erfolgreich zurückgesetzt und neu synchronisiert.",
          variant: "default"
        });
        
        console.log("Reset-Ergebnis:", result);
      } catch (error) {
        console.error("Fehler beim Zurücksetzen der Gruppen-IDs:", error);
        toast({
          title: "Fehler beim Zurücksetzen",
          description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
          variant: "destructive"
        });
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Gruppen-Synchronisation</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gruppen-IDs zurücksetzen
          </CardTitle>
          <CardDescription>
            Diese Funktion setzt alle Gruppen-IDs zurück und generiert neue IDs für die Gruppen-Chat-Zuordnung.
            Verwenden Sie diese Option nur, wenn es Probleme mit der Gruppensynchronisierung gibt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertDescription>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-semibold text-sm mb-1">Wichtiger Hinweis</p>
                  <p className="text-sm text-muted-foreground">
                    Das Zurücksetzen der Gruppen-IDs führt dazu, dass alle virtuellen Gruppen neu erstellt werden.
                    Bestehende Chat-Verläufe bleiben erhalten, aber die Zuordnung zwischen Gruppen und Chats wird neu hergestellt.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Button 
            variant="destructive" 
            onClick={handleResetGroupIds}
            disabled={isResetting}
            className="w-full"
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gruppen-IDs werden zurückgesetzt...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Gruppen-IDs zurücksetzen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function BackupManagement() {
  const [backups, setBackups] = useState<{name: string, timestamp: string, isLocalBackup?: boolean, isServerBackup?: boolean}[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Backup-Daten beim Laden der Komponente abrufen
  useEffect(() => {
    loadBackups();
  }, []);

  // Backups laden mit Polling für bessere mobile und Desktop Synchronisation
  const loadBackups = async () => {
    setIsLoading(true);
    try {
      // Erste Abfrage der Backups
      const availableBackups = await adminViewBackups();
      setBackups(availableBackups);
      
      // Nach einer kurzen Verzögerung erneut abfragen, um sicherzustellen, dass wir die neuesten Daten haben
      // Dies hilft besonders auf mobilen Geräten, die möglicherweise eine schlechtere Verbindung haben
      setTimeout(async () => {
        try {
          const refreshedBackups = await adminViewBackups();
          
          // Nur aktualisieren, wenn sich die Anzahl der Backups geändert hat
          if (refreshedBackups.length !== availableBackups.length) {
            console.log("🔄 Backup-Liste aktualisiert: Neue Anzahl =", refreshedBackups.length);
            setBackups(refreshedBackups);
          } else {
            console.log("✓ Backup-Liste ist aktuell");
          }
        } catch (refreshError) {
          console.warn("Fehler bei der Aktualisierung der Backup-Liste:", refreshError);
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1 Sekunde Verzögerung für die Aktualisierung
    } catch (error) {
      console.error("Fehler beim Laden der Backups:", error);
      toast({
        title: "Fehler",
        description: "Die Backups konnten nicht geladen werden.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Neues Backup erstellen
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupName = await adminCreateBackup();
      toast({
        title: "Backup erstellt",
        description: `Das Backup "${backupName}" wurde erfolgreich erstellt und mit dem Server synchronisiert.`,
      });
      await loadBackups(); // Liste der Backups aktualisieren
    } catch (error) {
      console.error("Fehler beim Erstellen des Backups:", error);
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Backup wiederherstellen
  const handleRestoreBackup = async (backupName: string) => {
    setSelectedBackup(backupName);
    setIsRestoring(true);
    try {
      const success = await adminRestoreBackup(backupName);
      if (success) {
        toast({
          title: "Backup wiederhergestellt",
          description: `Das Backup "${backupName}" wurde erfolgreich wiederhergestellt.`,
        });
      } else {
        throw new Error("Wiederherstellung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Fehler bei der Wiederherstellung des Backups:", error);
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht wiederhergestellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  // Backup löschen
  const handleDeleteBackup = async (backupName: string) => {
    try {
      const success = await adminDeleteBackup(backupName);
      if (success) {
        toast({
          title: "Backup gelöscht",
          description: `Das Backup "${backupName}" wurde erfolgreich gelöscht.`,
        });
        await loadBackups(); // Liste der Backups aktualisieren
      } else {
        throw new Error("Löschung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Backups:", error);
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  // Formatiere das Datum für die Anzeige
  const formatDate = (isoDate: string) => {
    if (!isoDate) return "Unbekanntes Datum";
    
    try {
      const date = new Date(isoDate);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoDate;
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Systemsicherung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup-Management
          </CardTitle>
          <CardDescription>
            Erstellen und Verwalten Sie Sicherungen der App-Daten, um Datenverlust zu vermeiden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Verfügbare Backups</h3>
                <p className="text-sm text-muted-foreground">
                  {backups.length} Backup(s) verfügbar. Die letzten 5 Backups werden automatisch gespeichert.
                </p>
              </div>
              <Button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="w-full sm:w-auto"
              >
                {isCreatingBackup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Neues Backup erstellen
                  </>
                )}
              </Button>
            </div>

            <Card className="bg-muted/40">
              <CardContent className="p-4">
                {backups.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Keine Backups verfügbar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Erstellen Sie ein neues Backup, um Ihre Daten zu sichern
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {backups.map((backup) => (
                        <div 
                          key={backup.name} 
                          className={`border rounded-md p-3 ${
                            selectedBackup === backup.name ? 'border-primary' : ''
                          }`}
                        >
                          {/* Desktop Ansicht */}
                          <div className="hidden sm:flex sm:flex-row justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{backup.name.replace('fitness-app-backup-', '')}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Erstellt am {formatDate(backup.timestamp)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRestoreBackup(backup.name)}
                                disabled={isRestoring}
                              >
                                {isRestoring && selectedBackup === backup.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                                <span className="ml-1">Wiederherstellen</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBackup(backup.name)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                                <span className="ml-1">Löschen</span>
                              </Button>
                            </div>
                          </div>

                          {/* Mobile Ansicht */}
                          <div className="sm:hidden">
                            <div className="mb-2">
                              <div className="flex items-center gap-1.5">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{backup.name.replace('fitness-app-backup-', '')}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Erstellt am {formatDate(backup.timestamp)}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRestoreBackup(backup.name)}
                                disabled={isRestoring}
                                className="flex justify-center"
                              >
                                {isRestoring && selectedBackup === backup.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                )}
                                Wiederherstellen
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBackup(backup.name)}
                                className="flex justify-center"
                              >
                                <Trash className="h-4 w-4 text-red-500 mr-1" />
                                Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Hinweis zur Backup-Strategie</p>
                    <p className="text-sm text-muted-foreground">
                      Es wird empfohlen, vor größeren Änderungen am System ein Backup zu erstellen. 
                      Die Daten werden lokal im Browser gespeichert und beim Aktualisieren mit dem Server synchronisiert.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Product Management Section Component
function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const { products, updateProduct } = useProducts();
  const { toast } = useToast();

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Produktverwaltung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produkte verwalten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {products.filter(p => p.isActive && !p.isArchived).length}
                </div>
                <p className="text-sm text-muted-foreground">Aktive Produkte</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {products.filter(p => p.validUntil && new Date(p.validUntil) < new Date()).length}
                </div>
                <p className="text-sm text-muted-foreground">Abgelaufene Produkte</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-500">
                  {products.filter(p => p.isArchived).length}
                </div>
                <p className="text-sm text-muted-foreground">Archivierte Produkte</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Produkte durchsuchen..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/create/product">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Neues Produkt
                </Button>
              </Link>
            </div>

            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">Aktiv</TabsTrigger>
                <TabsTrigger value="expired">Abgelaufen</TabsTrigger>
                <TabsTrigger value="archived">Archiviert</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts
                    .filter(p => p.isActive && !p.isArchived)
                    .map(product => (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={product.image || "https://placehold.co/600x400/png"}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400/png";
                            }}
                          />
                          <Badge
                            variant="outline"
                            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {product.id}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge>{product.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={product.isActive}
                                onCheckedChange={() => {
                                  const updatedProduct = {
                                    ...product,
                                    isActive: !product.isActive
                                  };
                                  updateProduct(updatedProduct);
                                  toast({
                                    title: updatedProduct.isActive ? "Produkt aktiviert" : "Produkt deaktiviert",
                                    description: updatedProduct.isActive
                                      ? "Das Produkt ist jetzt im Shop sichtbar."
                                      : "Das Produkt wird nicht mehr im Shop angezeigt."
                                  });
                                }}
                              />
                              <span className="text-sm">Aktiv</span>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/products/${product.id}`}>
                                Bearbeiten
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="expired" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts
                    .filter(p => p.validUntil && new Date(p.validUntil) < new Date())
                    .map(product => (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={product.image || "https://placehold.co/600x400/png"}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400/png";
                            }}
                          />
                          <Badge
                            variant="outline"
                            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {product.id}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="outline" className="text-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Abgelaufen
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Gültig bis: {product.validUntil ? new Date(product.validUntil).toLocaleDateString() : 'Unbegrenzt'}
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newValidUntil = new Date();
                                newValidUntil.setDate(newValidUntil.getDate() + 30);
                                const updatedProduct = {
                                  ...product,
                                  validUntil: newValidUntil.toISOString()
                                };
                                updateProduct(updatedProduct);
                                toast({
                                  title: "Gültigkeit verlängert",
                                  description: "Das Produkt wurde um 30 Tage verlängert."
                                });
                              }}
                            >
                              Verlängern
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/products/${product.id}`}>
                                Bearbeiten
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="archived" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts
                    .filter(p => p.isArchived)
                    .map(product => (
                      <Card key={product.id} className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <img
                            src={product.image || "https://placehold.co/600x400/png"}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400/png";
                            }}
                          />
                          <Badge
                            variant="outline"
                            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {product.id}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="outline">
                              <Archive className="h-3 w-3 mr-1" />
                              Archiviert
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedProduct = {
                                  ...product,
                                  isArchived: false,
                                  isActive: true
                                };
                                updateProduct(updatedProduct);
                                toast({
                                  title: "Produkt reaktiviert",
                                  description: "Das Produkt wurde aus dem Archiv geholt und ist wieder aktiv."
                                });
                              }}
                            >
                              Reaktivieren
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/products/${product.id}`}>
                                Bearbeiten
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Erweiterte Mock-Daten mit Button-Konfiguration und archivierten Bannern
const mockBanners = [
  {
    id: 1,
    name: "Summer Challenge",
    positionId: "APP_HEADER",
    description: "Promotion für die Summer Fitness Challenge",
    appImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
    webImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1920&auto=format",
    isActive: true,
    targetUrl: "https://example.com",
    createdAt: new Date(),
    buttons: [
      {
        text: "Jetzt mitmachen",
        url: "https://example.com/challenge"
      },
      {
        text: "Mehr erfahren",
        url: "https://example.com/info"
      }
    ],
    stats: {
      views: 1234,
      clicks: 89,
      ctr: "7.2%"
    }
  },
  {
    id: 2,
    name: "Spring Event 2024",
    positionId: "APP_HEADER",
    description: "Frühlings-Fitness-Event",
    appImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
    webImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1920&auto=format",
    isActive: false,
    targetUrl: "https://example.com/spring",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 Tage alt
    buttons: [],
    stats: {
      views: 2500,
      clicks: 180,
      ctr: "7.2%"
    }
  }
];

// Verwende echte Daten aus den Stores für Statistiken und Verwaltung
// Diese Daten werden direkt in der Komponente aus den Stores geholt

// Mock Product Data
const mockProducts = [
  {
    id: 1,
    name: "Produkt A",
    description: "Beschreibung von Produkt A",
    image: "https://via.placeholder.com/150",
    type: "Type A",
    isActive: true,
    isArchived: false,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    id: 2,
    name: "Produkt B",
    description: "Beschreibung von Produkt B",
    image: "https://via.placeholder.com/150",
    type: "Type B",
    isActive: false,
    isArchived: true,
    validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  },
  {
    id: 3,
    name: "Produkt C",
    description: "Beschreibung von Produkt C",
    image: "https://via.placeholder.com/150",
    type: "Type C",
    isActive: true,
    isArchived: false,
    validUntil: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

  }
];


// Änderungen im BannerManagement
function BannerManagement() {
  const { toast } = useToast();
  const [editingBanner, setEditingBanner] = useState<number | null>(null);
  const [showSecondButton, setShowSecondButton] = useState(true);

  const copyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(`[banner position="${shortcode}"]`);
    toast({
      title: "Shortcode kopiert!",
      description: "Fügen Sie diesen Code an der gewünschten Stelle Ihrer Website ein. Der Banner wird nur angezeigt, wenn er aktiv ist, ansonsten wird der Container automatisch ausgeblendet."
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DEFAULT_BANNER_POSITIONS.map(position => (
          <Card key={position.shortcode}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{position.name}</CardTitle>
                  <CardDescription className="mt-1.5">
                    {position.description}
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                      <div className="font-medium mb-2">Format-Anforderungen:</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 border rounded-md">
                          <div className="font-medium">App Format</div>
                          <div className="text-muted-foreground">
                            {position.appDimensions.width} x {position.appDimensions.height}px
                          </div>
                        </div>
                        <div className="p-2 border rounded-md">
                          <div className="font-medium">Web Format</div>
                          <div className="text-muted-foreground">
                            {position.webDimensions.width} x {position.webDimensions.height}px
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => copyShortcode(position.shortcode)}
                >
                  <Copy className="h-4 w-4" />
                  Shortcode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Aktuelle Banner */}
                {mockBanners
                  .filter(banner => banner.positionId === position.shortcode && banner.isActive)
                  .map(banner => (
                    <div key={banner.id} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* App Preview */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">App Preview:</div>
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={banner.appImage}
                              alt={`${banner.name} (App)`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>

                        {/* Web Preview */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Web Preview:</div>
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={banner.webImage}
                              alt={`${banner.name} (Web)`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Banner Info & Controls */}
                      <div className="space-y-4 p-4 rounded-lg border bg-card">
                        <div className="grid gap-4">
                          <div>
                            <label className="text-sm font-medium">Titel</label>
                            <Input defaultValue={banner.name} className="mt-1.5" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Beschreibung</label>
                            <Input defaultValue={banner.description} className="mt-1.5" />
                          </div>

                          {/* Button Konfiguration */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Button Konfiguration</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Zweiter Button</span>
                                <Switch
                                  checked={showSecondButton}
                                  onCheckedChange={setShowSecondButton}
                                />
                              </div>
                            </div>

                            {/* Erster Button */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Button 1</label>
                              <div className="grid gap-2">
                                <Input
                                  placeholder="Button Text"
                                  defaultValue={banner.buttons[0]?.text}
                                />
                                <Input
                                  placeholder="Button Link (https://...)"
                                  defaultValue={banner.buttons[0]?.url}
                                />
                              </div>
                            </div>

                            {/* Zweiter Button (optional) */}
                            {showSecondButton && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Button 2</label>
                                <div className="grid gap-2">
                                  <Input
                                    placeholder="Button Text"
                                    defaultValue={banner.buttons[1]?.text}
                                  />
                                  <Input
                                    placeholder="Button Link (https://...)"
                                    defaultValue={banner.buttons[1]?.url}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Aktiv</span>
                            <Switch
                              checked={banner.isActive}
                              onCheckedChange={() => {
                                toast({
                                  title: banner.isActive ? "Banner deaktiviert" : "Banner aktiviert",
                                  description: banner.isActive
                                    ? "Der Banner wird nicht mehr angezeigt."
                                    : "Der Banner wird jetzt auf der Website angezeigt."
                                });
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Vorschau aktualisiert",
                                  description: "Die Änderungen werden in der Vorschau angezeigt."
                                });
                              }}
                            >
                              Vorschau
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Änderungen gespeichert",
                                  description: "Die Änderungen wurden erfolgreich gespeichert und sind jetzt live."
                                });
                              }}
                            >
                              Speichern
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Views</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{banner.stats.views}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{banner.stats.clicks}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">CTR</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{banner.stats.ctr}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}

                {/* Upload Bereich */}
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Ziehen Sie Bilder hierher oder klicken Sie zum Hochladen
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="font-medium mb-2">App Format</div>
                          <div className="text-xs text-muted-foreground">
                            Quadratisch: {position.appDimensions.width} x {position.appDimensions.height}px
                          </div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="font-medium mb-2">Web Format</div>
                          <div className="text-xs text-muted-foreground">
                            {position.webDimensions.width} x {position.webDimensions.height}px
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Empfohlene Mindestgröße
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Banner hochladen
                    </Button>
                  </div>
                </div>

                {/* Banner Archiv */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Banner-Archiv</h3>
                    <Button variant="outline" size="sm">
                      Archiv anzeigen
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {mockBanners
                      .filter(banner => banner.positionId === position.shortcode && !banner.isActive)
                      .map(banner => (
                        <div key={banner.id} className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                              <img
                                src={banner.appImage}
                                alt={banner.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium truncate">{banner.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                Erstellt am {format(banner.createdAt, "dd.MM.yyyy")}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                <span>{banner.stats.views} Views</span>
                                <span>•</span>
                                <span>{banner.stats.clicks} Clicks</span>
                                <span>•</span>
                                <span>{banner.stats.ctr} CTR</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setEditingBanner(banner.id)}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                toast({
                                  title: "Banner reaktiviert",
                                  description: "Der Banner wurde erfolgreich reaktiviert und wird jetzt angezeigt."
                                });
                              }}
                            >
                              Reaktivieren
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EventSection() {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Event Management</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Events verwalten
          </CardTitle>
          <CardDescription>
            Verwalten Sie Events und Termine, prüfen Sie Anmeldungen und erstellen Sie neue Events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Im Event-Manager können Sie alle Events einsehen, bearbeiten und archivieren.
                Überwachen Sie Anmeldungen und verwalten Sie die Events zentral.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" asChild>
                <Link href="/events/manager">
                  <CalendarRange className="h-4 w-4 mr-2" />
                  Event-Manager öffnen
                </Link>
              </Button>
              <Button asChild>
                <Link href="/create/event">
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Event erstellen
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}


// Die BackupManagement-Komponente wurde bereits oben im Code implementiert

export default function Admin() {
  const { 
    users, 
    toggleVerification, 
    toggleLock, 
    updateUser, 
    resetPassword, 
    deleteUser,
    getUserById 
  } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  
  // Scrolle zum Team-Bereich, wenn die URL einen #team-Anker enthält
  useEffect(() => {
    if (location.includes("#team")) {
      const teamSection = document.getElementById("team");
      if (teamSection) {
        teamSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const postStore = usePostStore();
  const challengeStore = useChallengeStore();
  const groupStore = useGroupStore();
  
  // Funktion für automatische Aktualisierung (ehemals manuell)
  const refreshUsers = () => {
    setIsRefreshing(true);
    loadAPIUsers();
    setTimeout(() => {
      setIsRefreshing(false);
      // Nur einen Toast anzeigen, wenn die Funktion von einem Button ausgelöst wurde
      if (false) { // Deaktiviert, da jetzt automatisch
        toast({
          title: "Benutzerdaten aktualisiert",
          description: "Die Benutzerdaten wurden erfolgreich von der API synchronisiert.",
        });
      }
    }, 1000);
  };

  // Automatische Aktualisierung beim Laden der Seite und regelmäßig alle 30 Sekunden
  useEffect(() => {
    refreshUsers();
    
    // Automatische Aktualisierung alle 30 Sekunden einrichten
    const autoRefreshInterval = setInterval(() => {
      console.log("Admin: Automatische Aktualisierung der Benutzerdaten");
      refreshUsers();
    }, 30000); // 30 Sekunden
    
    // Bereinigen beim Unmount
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);
  
  // Event-Listener für gelöschte Posts und erzwungene Synchronisierung
  useEffect(() => {
    let isMounted = true;
    
    // Handler für erzwungene Synchronisierung aller gelöschten Posts
    const handleForcedSync = (event: CustomEvent) => {
      console.log("Admin: Erzwungene Synchronisierung der gelöschten Posts", event.detail);
      
      if (isMounted) {
        // Stelle sicher, dass vollständige Neusynchronisierung durchgeführt wird
        console.log("Admin-Ansicht: Starte vollständige Neusynchronisierung aufgrund von force-deleted-posts-sync");
        postStore.loadStoredPosts().catch(e => {
          console.warn("Admin-Ansicht: Fehler bei der erzwungenen Synchronisierung:", e);
        });
      }
    };
    
    // Event-Listener für erzwungene Synchronisierung registrieren
    window.addEventListener('force-deleted-posts-sync', handleForcedSync as EventListener);
    
    // Bereinige beim Unmount
    return () => {
      isMounted = false;
      window.removeEventListener('force-deleted-posts-sync', handleForcedSync as EventListener);
    };
  }, []);
  
  // Synchronisieren der Challenges mit der Datenbank
  const syncWithServer = async () => {
    setSyncing(true);
    setSyncComplete(false);
    
    try {
      // Challenge-Daten synchronisieren
      await challengeStore.syncWithServer();
      
      // Post-Daten synchronisieren
      await usePostStore.getState().loadStoredPosts();
      
      // Gruppen synchronisieren
      await useGroupStore.getState().syncWithServer();
      
      // Benutzer synchronisieren
      refreshUsers();
      
      setSyncComplete(true);
      toast({
        title: "Synchronisierung erfolgreich",
        description: "Alle Daten wurden erfolgreich mit der Datenbank synchronisiert.",
      });
    } catch (error) {
      console.error("Fehler bei der Synchronisierung:", error);
      toast({
        title: "Synchronisierungsfehler",
        description: "Die Daten konnten nicht mit dem Server synchronisiert werden.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
      // Nach 3 Sekunden den Erfolgs-Indikator ausblenden
      setTimeout(() => {
        setSyncComplete(false);
      }, 3000);
    }
  };
  
  // Berechne das Datum der letzten Synchronisierung
  const lastSyncTime = challengeStore.lastFetched ? 
    new Date(challengeStore.lastFetched).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Noch nie';

  // Filtere Benutzer basierend auf Suche und Verifizierungsstatus
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (showVerifiedOnly) {
      return user.isVerified && matchesSearch;
    }
    return matchesSearch;
  });

  const copyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(`[banner position="${shortcode}"]`);
    toast({
      title: "Shortcode kopiert!",
      description: "Fügen Sie diesen Code an der gewünschten Stelle Ihrer Website ein. Der Banner wird nur angezeigt, wenn er aktiv ist, ansonsten wird der Container automatisch ausgeblendet."
    });
  };

  return (
    <div className="container mx-auto p-4 pb-8 space-y-8">
      {/* Insights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.isVerified).length} verified
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(useChallengeStore.getState().challenges).length}</div>
            <p className="text-xs text-muted-foreground">
              3 ending this week
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(useGroupStore.getState().groups).length}</div>
            <p className="text-xs text-muted-foreground">
              2 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(usePostStore.getState().posts).length}</div>
            <p className="text-xs text-muted-foreground">
              +2 seit letzter Woche
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Datenbank Synchronisierung */}
      {/* User Management - importierte Komponente */}
      <div id="users">
        <UserManagement />
      </div>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-6">Datenbank & Synchronisation</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Daten synchronisieren
            </CardTitle>
            <CardDescription>
              Synchronisieren Sie die Challenge-Daten mit der Datenbank, um Geräteübergreifend konsistente Daten zu gewährleisten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-primary/20 bg-primary/5 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <AlertDescription className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">Datenbank-Synchronisierung:</span>{" "}
                    Letzte Synchronisierung am {lastSyncTime}
                  </p>
                </AlertDescription>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={syncWithServer}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisiere...
                    </>
                  ) : syncComplete ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Synchronisiert
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Synchronisieren
                    </>
                  )}
                </Button>
              </div>
            </Alert>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{Object.keys(challengeStore.challenges).length}</div>
                    <p className="text-xs text-muted-foreground">Synchronisiert</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Teilnehmer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {Object.values(challengeStore.participants).reduce(
                        (acc, participants) => acc + participants.length, 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Synchronisiert</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Aktive Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {challengeStore.getActiveChallenges().filter(c => c.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Synchronisiert</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Benutzer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {users.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {/* Automatische Aktualisierung, kein manueller Button mehr notwendig */}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        Automatische Synchronisierung aktiv
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Die Daten werden alle 30 Sekunden automatisch synchronisiert, um eine konsistente Erfahrung auf allen Geräten zu gewährleisten.
            </p>
          </CardFooter>
        </Card>
      </section>

      {/* Event Management Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Event Management</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Events verwalten
            </CardTitle>
            <CardDescription>
              Verwalten Sie Events und Termine, prüfen Sie Anmeldungen und erstellen Sie neue Events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Im Event-Manager können Sie alle Events einsehen, bearbeiten und archivieren.
                  Überwachen Sie Anmeldungen und verwalten Sie die Events zentral.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <Link href="/events/manager">
                    <CalendarRange className="h-4 w-4 mr-2" />
                    Event-Manager öffnen
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/create/event">
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Event erstellen
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Marketing Banner Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Marketing Banner Management</h2>
        <BannerManagement />
      </section>

      {/* Products Management Section */}
      <ProductManagement />

      {/* Team Management Section */}
      <section id="team">
        <TeamManagement />
      </section>
      
      {/* User Verification Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">User Verification</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Benutzer verwalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap">Verified Only</span>
                  <Switch
                    checked={showVerifiedOnly}
                    onCheckedChange={setShowVerifiedOnly}
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b p-4 gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || "https://via.placeholder.com/40"}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">@{user.username}</span>
                            {user.isVerified && <VerifiedBadge />}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm whitespacenowrap">Verified</span>
                          <Switch
                            checked={!!user.isVerified}
                            onCheckedChange={() => toggleVerification(user.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Content Moderation Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Content Moderation</h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gemeldete Inhalte</CardTitle>
              <div className="flex items-center gap-2">
                <select className="px-2 py-1 rounded border text-sm">
                  <option value="all">Alle Meldungen</option>
                  <option value="pending">Ausstehend</option>
                  <option value="resolved">Bearbeitet</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Gemeldete Inhalte durchsuchen..." />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Verwenden von echten Posts aus dem postStore */}
                {Object.values(usePostStore.getState().posts).slice(0, 5).map(post => (
                  <div key={post.id} className="border-b p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            Beitrag von @{users.find(u => u.id === post.userId)?.username}
                          </h3>
                          <Badge variant="outline" className="text-red-500">
                            2 Meldungen
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {post.content}
                        </p>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Reported content"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                        )}
                        <div className="mt-2 space-y-2">
                          <div className="text-sm p-2 bg-muted rounded-md">
                            <p className="font-medium text-xs text-muted-foreground mb-1">
                              Grund der Meldung:
                            </p>
                            <p>Unangemessener Inhalt - Der Beitrag verstößt gegen die Community-Richtlinien</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Gemeldet von @username • Vor 2 Stunden
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button variant="destructive" size="sm" className="w-full">
                          Entfernen
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Ignorieren
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Wenn keine gemeldeten Inhalte vorhanden sind */}
                {Object.keys(usePostStore.getState().posts).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-2">✨</div>
                    <h4 className="font-medium">Alles klar!</h4>
                    <p className="text-sm">Keine gemeldeten Inhalte vorhanden.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      {/* Push Notification History Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Push Notification History</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Versendete Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Search notifications..." />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Beispiel Notifications */}
                {[
                  {
                    id: 1,
                    title: "Summer Challenge Start",
                    message: "Die Summer Challenge beginnt heute!",
                    sentAt: new Date(),
                    targetGroup: "all",
                    stats: {
                      sent: 1234,
                      opened: 856,
                      openRate: "69.4%"
                    }
                  },
                  {
                    id: 2,
                    title: "Neue Premium Features",
                    message: "Entdecke unsere neuen Premium Features!",
                    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    targetGroup: "premium",
                    stats: {
                      sent: 500,
                      opened: 423,
                      openRate: "84.6%"
                    }
                  }
                ].map(notification => (
                  <div key={notification.id} className="border-b p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Gesendet am {format(notification.sentAt, "dd.MM.yyyy HH:mm")} •
                          Zielgruppe: {notification.targetGroup === "all" ? "Alle Nutzer" : "Premium Nutzer"}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <div className="font-medium">{notification.stats.sent}</div>
                          <div className="text-xs text-muted-foreground">Gesendet</div>
                        </div>
                        <div>
                          <div className="font-medium">{notification.stats.opened}</div>
                          <div className="text-xs text-muted-foreground">Geöffnet</div>
                        </div>
                        <div>
                          <div className="font-medium">{notification.stats.openRate}</div>
                          <div className="text-xs text-muted-foreground">Open Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      {/* Group Sync Management Section */}
      <GroupSyncManagement />

      {/* Backup Management Section */}
      <BackupManagement />
    </div>
  );
}