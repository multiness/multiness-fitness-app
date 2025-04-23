import React, { useState, useEffect, createContext, useContext } from "react";
import { useUsers } from "@/contexts/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  ClipboardCopy,
  Edit,
  Key,
  Loader2,
  Lock,
  LockOpen,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  User,
  UserCog,
  Users
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import UserAvatar from "@/components/UserAvatar";
import type { User } from "@/types/userTypes";

// Context für temporäres Passwort
type TemporaryPasswordContextType = {
  temporaryPassword: string | null;
  setTemporaryPassword: (password: string | null) => void;
};

const TemporaryPasswordContext = createContext<TemporaryPasswordContextType | null>(null);

const useTemporaryPasswordContext = () => {
  const context = useContext(TemporaryPasswordContext);
  if (!context) {
    throw new Error('useTemporaryPasswordContext muss innerhalb eines TemporaryPasswordProvider verwendet werden');
  }
  return context;
};

// Bearbeitungsfenster für Benutzer
const EditUserDialog = ({
  user,
  onSave,
}: {
  user: User | null;
  onSave: (userData: Partial<User>) => void;
}) => {
  const [userData, setUserData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name,
        email: user.email || "",
        bio: user.bio || "",
        teamRole: user.teamRole || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(userData);
  };

  if (!user) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Benutzer bearbeiten</DialogTitle>
        <DialogDescription>
          Bearbeiten Sie die Informationen für {user.name}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            value={userData.name || ""}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            E-Mail
          </Label>
          <Input
            id="email"
            name="email"
            value={userData.email || ""}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="teamRole" className="text-right">
            Team-Rolle
          </Label>
          <Input
            id="teamRole"
            name="teamRole"
            value={userData.teamRole || ""}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="bio" className="text-right">
            Bio
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={userData.bio || ""}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Abbrechen</Button>
        </DialogClose>
        <Button onClick={handleSubmit}>Speichern</Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Bestätigungsfenster für Passwort-Reset mit Anzeige des temporären Passworts
const ResetPasswordDialog = ({
  user,
  onConfirm,
}: {
  user: User | null;
  onConfirm: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { temporaryPassword } = useTemporaryPasswordContext();
  
  if (!user) return null;
  
  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Passwort zurücksetzen</DialogTitle>
        <DialogDescription>
          {!temporaryPassword ? (
            "Möchten Sie das Passwort dieses Benutzers zurücksetzen? Ein neues temporäres Passwort wird generiert."
          ) : (
            "Das Passwort wurde erfolgreich zurückgesetzt. Notieren Sie das temporäre Passwort und teilen Sie es dem Benutzer mit."
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <div className="flex items-center gap-3 p-3 border rounded-md">
          <UserAvatar user={user} className="h-10 w-10" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        
        {temporaryPassword && (
          <div className="mt-4">
            <Label htmlFor="tempPassword">Temporäres Passwort</Label>
            <div className="flex mt-1.5">
              <Input 
                id="tempPassword"
                className="font-mono bg-secondary"
                value={temporaryPassword}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                className="ml-2"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(temporaryPassword);
                  toast({
                    title: "Kopiert!",
                    description: "Passwort wurde in die Zwischenablage kopiert",
                  });
                }}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Klicken Sie auf das Feld, um das Passwort zu markieren, oder auf die Schaltfläche, um es zu kopieren.
            </p>
          </div>
        )}
      </div>
      <DialogFooter>
        {!temporaryPassword ? (
          <>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zurücksetzen...
                </>
              ) : (
                "Passwort zurücksetzen"
              )}
            </Button>
          </>
        ) : (
          <DialogClose asChild>
            <Button>Schließen</Button>
          </DialogClose>
        )}
      </DialogFooter>
    </DialogContent>
  );
};

// Bestätigungsfenster für Benutzerlöschung
const DeleteUserDialog = ({
  user,
  onConfirm,
}: {
  user: User | null;
  onConfirm: () => void;
}) => {
  if (!user) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogDescription>
          Möchten Sie wirklich den Benutzer {user.name} löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Abbrechen</Button>
        </DialogClose>
        <Button variant="destructive" onClick={onConfirm}>Löschen</Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Bestätigungsfenster für Kontosperrung
const LockUserDialog = ({
  user,
  onConfirm,
}: {
  user: User | null;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState("");
  
  if (!user) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Benutzerkonto sperren</DialogTitle>
        <DialogDescription>
          Möchten Sie wirklich das Konto von {user.name} sperren?
          Der Benutzer kann sich nicht mehr anmelden, bis die Sperre aufgehoben wird.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <Label htmlFor="lockReason">Sperrungsgrund (optional)</Label>
        <Textarea
          id="lockReason"
          placeholder="Geben Sie einen Grund für die Sperrung an..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Abbrechen</Button>
        </DialogClose>
        <Button variant="destructive" onClick={() => onConfirm(reason)}>Sperren</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const UserManagementWrapper = () => {
  // Zustand für das angezeigte temporäre Passwort
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  return (
    <TemporaryPasswordContext.Provider value={{ temporaryPassword, setTemporaryPassword }}>
      <UserManagementContent />
    </TemporaryPasswordContext.Provider>
  );
};

const UserManagementContent = () => {
  const { 
    users, 
    toggleVerification, 
    toggleTeamMember, 
    toggleAdmin, 
    toggleLock,
    updateUser,
    resetPassword,
    deleteUser
  } = useUsers();
  
  const { toast } = useToast();
  const { temporaryPassword, setTemporaryPassword } = useTemporaryPasswordContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Filtern der Benutzer basierend auf Suchbegriff und aktivem Tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admin") return matchesSearch && user.isAdmin;
    if (activeTab === "team") return matchesSearch && user.isTeamMember;
    if (activeTab === "verified") return matchesSearch && user.isVerified;
    if (activeTab === "locked") return matchesSearch && user.isLocked;
    
    return matchesSearch;
  });
  
  // Behandlung des Passwort-Resets
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      // Reset-Dialog-Status aktualisieren, um "Wird zurückgesetzt..." anzuzeigen
      setTemporaryPassword(null);
      
      const newPassword = await resetPassword(selectedUser.id);
      
      if (newPassword) {
        setTemporaryPassword(newPassword);
        // Wir schließen den Dialog NICHT, damit das Passwort angezeigt werden kann
      } else {
        setShowResetDialog(false);
        toast({
          title: "Fehler",
          description: "Das neue Passwort konnte nicht generiert werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setShowResetDialog(false);
      toast({
        title: "Fehler",
        description: "Passwort konnte nicht zurückgesetzt werden.",
        variant: "destructive",
      });
    }
  };

  // Behandlung der Benutzerlöschung
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
      
      toast({
        title: "Benutzer gelöscht",
        description: `Der Benutzer ${selectedUser.name} wurde erfolgreich gelöscht.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Behandlung der Kontosperrung
  const handleLockUser = async (reason: string) => {
    if (!selectedUser) return;
    
    try {
      await toggleLock(selectedUser.id, reason);
      setShowLockDialog(false);
      
      toast({
        title: selectedUser.isLocked ? "Konto entsperrt" : "Konto gesperrt",
        description: selectedUser.isLocked 
          ? `Das Konto von ${selectedUser.name} wurde entsperrt.`
          : `Das Konto von ${selectedUser.name} wurde gesperrt.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kontostatus konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  // Behandlung der Benutzerbearbeitung
  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, userData);
      setShowEditDialog(false);
      
      toast({
        title: "Benutzer aktualisiert",
        description: `Die Informationen für ${selectedUser.name} wurden aktualisiert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Benutzerinformationen konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  // Benutzeraktionen-Dropdown
  const UserActions = ({ user }: { user: User }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Aktionen</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(user);
            setShowEditDialog(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Bearbeiten
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(user);
            setShowResetDialog(true);
          }}
        >
          <Key className="mr-2 h-4 w-4" />
          Passwort zurücksetzen
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => toggleAdmin(user.id)}
        >
          <Shield className="mr-2 h-4 w-4" />
          {user.isAdmin ? "Admin-Rechte entziehen" : "Admin-Rechte gewähren"}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => toggleTeamMember(user.id)}
        >
          <UserCog className="mr-2 h-4 w-4" />
          {user.isTeamMember ? "Team-Mitgliedschaft entziehen" : "Zum Team hinzufügen"}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => toggleVerification(user.id)}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {user.isVerified ? "Verifizierung entziehen" : "Verifizieren"}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(user);
            setShowLockDialog(true);
          }}
        >
          {user.isLocked ? (
            <>
              <LockOpen className="mr-2 h-4 w-4" />
              Konto entsperren
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Konto sperren
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(user);
            setShowDeleteDialog(true);
          }}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              Benutzerverwaltung
            </CardTitle>
            <CardDescription>
              Verwalten Sie Benutzerkonten, Berechtigungen und Kontostatus
            </CardDescription>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all" className="text-sm">
              Alle
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-sm">
              Administratoren
            </TabsTrigger>
            <TabsTrigger value="team" className="text-sm">
              Team
            </TabsTrigger>
            <TabsTrigger value="verified" className="text-sm">
              Verifiziert
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-sm">
              Gesperrt
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Keine Benutzer gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="flex items-center gap-3">
                          <UserAvatar
                            user={user}
                            className="h-10 w-10"
                          />
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {user.name}
                              {user.isVerified && <VerifiedBadge />}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.isAdmin && (
                              <Badge variant="default">Admin</Badge>
                            )}
                            {user.isTeamMember && (
                              <Badge variant="secondary">Team</Badge>
                            )}
                            {user.isLocked && (
                              <Badge variant="destructive">Gesperrt</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.teamRole || "-"}
                        </TableCell>
                        <TableCell>
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString("de-DE")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <UserActions user={user} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Insgesamt {users.length} Benutzer
        </p>
      </CardFooter>

      {/* Dialoge für Benutzeraktionen */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditUserDialog
          user={selectedUser}
          onSave={handleUpdateUser}
        />
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <ResetPasswordDialog
          user={selectedUser}
          onConfirm={handleResetPassword}
        />
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DeleteUserDialog
          user={selectedUser}
          onConfirm={handleDeleteUser}
        />
      </Dialog>

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <LockUserDialog
          user={selectedUser}
          onConfirm={handleLockUser}
        />
      </Dialog>
    </Card>
  );
};

export default UserManagementWrapper;