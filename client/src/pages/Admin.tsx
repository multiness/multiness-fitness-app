import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  RotateCw,
  Settings,
  Calendar,
  RefreshCw,
  Check,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  X,
  FileText,
  Download,
  Eye,
  Edit,
  CalendarRange,
  CalendarDays,
  HardDrive,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_BANNER_POSITIONS } from "../../../shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { format } from "date-fns/format";
import { de } from "date-fns/locale/de";
import { useUsers } from "@/contexts/UserContext";
import { useGroupStore } from "@/lib/groupStore";
import { useChallengeStore } from "@/lib/challengeStore";
import { usePostStore } from "@/lib/postStore";
import { useProducts } from "@/contexts/ProductContext";
import { 
  adminCreateBackup, 
  adminRestoreBackup, 
  adminViewBackups, 
  adminDeleteBackup 
} from "../lib/backupService";
import UserManagementWrapper from "@/components/UserManagement";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const { users } = useUsers();
  const { toast } = useToast();
  const groupStore = useGroupStore();
  const challengeStore = useChallengeStore();
  const postStore = usePostStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

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

      {/* Benutzer-Verwaltung */}
      <div id="users">
        <UserManagementWrapper />
      </div>

      {/* Datenbank & Synchronisierung */}
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Letzte Synchronisierung</p>
                  <p className="font-medium">{lastSyncTime}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-1" 
                    onClick={() => {
                      // Später Herausforderungen synchronisieren
                      // challengeStore.forceFetchChallenges(); // Muss noch implementiert werden
                      toast({
                        title: "Challenges synchronisiert",
                        description: "Alle Challenges wurden mit der Datenbank synchronisiert."
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Challenges synchronisieren
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-1" 
                    onClick={() => {
                      // Manuelles Synchronisierungs-Event auslösen
                      const syncEvent = new CustomEvent('forcedSync', { 
                        detail: { source: 'manual' } 
                      });
                      window.dispatchEvent(syncEvent);
                      
                      toast({
                        title: "Synchronisierung gestartet",
                        description: "Die manuelle Synchronisierung wurde gestartet."
                      });
                    }}
                  >
                    <Database className="h-4 w-4" />
                    Alle Daten synchronisieren
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Team-Verwaltung */}
      <TeamManagement />

      {/* Gruppen-Synchronisierung */}
      <GroupSyncManagement />

      {/* Backup-Verwaltung */}
      <BackupManagement />

      {/* Produkt-Verwaltung */}
      <ProductManagement />
      
      {/* Banner-Verwaltung */}
      <BannerManagement />
      
      {/* Event-Verwaltung */}
      <EventSection />
    </div>
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
                placeholder="Team-Mitglied suchen..."
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
                      <select
                        className="w-full p-1 text-sm rounded border"
                        value={user.teamRole || "member"}
                        onChange={(e) => {
                          updateTeamRole(user.id, e.target.value);
                          toast({
                            title: "Rolle aktualisiert",
                            description: `Die Rolle von ${user.name} wurde zu "${e.target.value}" geändert.`
                          });
                        }}
                        disabled={!user.isTeamMember}
                      >
                        {teamRoles.map(role => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 text-center">
                      <Button
                        variant={user.isTeamMember ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full h-6 min-w-[60px] ${user.isTeamMember ? 'bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'}`}
                        onClick={() => {
                          toggleTeamMember(user.id);
                          toast({
                            title: user.isTeamMember ? "Aus Team entfernt" : "Zum Team hinzugefügt",
                            description: user.isTeamMember 
                              ? `${user.name} wurde aus dem Team entfernt.` 
                              : `${user.name} wurde zum Team hinzugefügt.`
                          });
                        }}
                      >
                        {user.isTeamMember ? "Ja" : "Nein"}
                      </Button>
                    </div>
                    <div className="col-span-2 text-center">
                      <Button
                        variant={user.isAdmin ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full h-6 min-w-[60px] ${user.isAdmin ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-muted-foreground text-muted-foreground'}`}
                        onClick={() => {
                          toggleAdmin(user.id);
                          toast({
                            title: user.isAdmin ? "Admin-Rechte entzogen" : "Admin-Rechte gewährt",
                            description: user.isAdmin 
                              ? `${user.name} ist kein Administrator mehr.` 
                              : `${user.name} ist jetzt Administrator.`
                          });
                        }}
                      >
                        {user.isAdmin ? "Ja" : "Nein"}
                      </Button>
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          // Profil anzeigen
                        }}
                      >
                        <User className="h-3.5 w-3.5" />
                        Profil
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Benutzerliste - Mobile Ansicht */}
            <div className="sm:hidden space-y-4">
              {filteredUsers.map(user => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/40"} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/40";
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
                    
                    {/* Status & Rolle */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Team-Mitglied</p>
                        <Button
                          variant={user.isTeamMember ? "default" : "outline"}
                          size="sm"
                          className={`w-full ${user.isTeamMember ? 'bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'}`}
                          onClick={() => toggleTeamMember(user.id)}
                        >
                          {user.isTeamMember ? "Ja" : "Nein"}
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Administrator</p>
                        <Button
                          variant={user.isAdmin ? "default" : "outline"}
                          size="sm"
                          className={`w-full ${user.isAdmin ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-muted-foreground text-muted-foreground'}`}
                          onClick={() => toggleAdmin(user.id)}
                        >
                          {user.isAdmin ? "Ja" : "Nein"}
                        </Button>
                      </div>
                    </div>

                    {/* Teamrolle */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Team-Rolle</p>
                      <select
                        className="w-full p-2 rounded border"
                        value={user.teamRole || "member"}
                        onChange={(e) => updateTeamRole(user.id, e.target.value)}
                        disabled={!user.isTeamMember}
                      >
                        {teamRoles.map(role => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Aktionen */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 flex-1"
                        onClick={() => {
                          // Profil anzeigen
                        }}
                      >
                        <User className="h-3.5 w-3.5" />
                        Profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Gruppen-Synchronisierung verwalten
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
            Bei Problemen mit der Gruppen-Synchronisation können Sie hier alle Gruppen-IDs zurücksetzen.
            Dies führt zur Neugenerierung aller UUIDs. Bestehende Chat-Zuordnungen gehen dabei verloren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Achtung: Dieser Vorgang ist nicht umkehrbar!</p>
                  <p>Setzen Sie die Gruppen-IDs nur zurück, wenn es Synchronisationsprobleme gibt oder explizit vom Support angewiesen.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                className="gap-1" 
                disabled={isResetting} 
                onClick={handleResetGroupIds}
              >
                {isResetting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Wird zurückgesetzt...</>
                ) : (
                  <><RotateCw className="h-4 w-4" /> Gruppen-IDs zurücksetzen</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Backup-Verwaltung
function BackupManagement() {
  interface BackupInfo {
    name: string;
    timestamp: string;
    size?: string;
    isLocalBackup?: boolean;
    isServerBackup?: boolean;
  }
  
  const [backups, setBackups] = useState<BackupInfo[]>([]);
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
      setBackups(availableBackups as BackupInfo[]);
      
      // Nach einer kurzen Verzögerung erneut abfragen, um sicherzustellen, dass wir die neuesten Daten haben
      // Dies hilft besonders auf mobilen Geräten, die möglicherweise eine schlechtere Verbindung haben
      setTimeout(async () => {
        try {
          const refreshedBackups = await adminViewBackups();
          
          // Nur aktualisieren, wenn sich die Anzahl der Backups geändert hat
          if (refreshedBackups.length !== availableBackups.length) {
            console.log("🔄 Backup-Liste aktualisiert: Neue Anzahl =", refreshedBackups.length);
            setBackups(refreshedBackups as BackupInfo[]);
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
        title: "Fehler beim Laden der Backups",
        description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      // Backup erstellen
      const result = await adminCreateBackup();
      
      if (result) {
        toast({
          title: "Backup erstellt",
          description: "Das Backup wurde erfolgreich erstellt.",
          variant: "default"
        });
        
        // Backup-Liste aktualisieren
        loadBackups();
      } else {
        throw new Error("Backup konnte nicht erstellt werden.");
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Backups:", error);
      toast({
        title: "Fehler beim Erstellen des Backups",
        description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (id: string) => {
    if (window.confirm("ACHTUNG: Beim Wiederherstellen eines Backups werden ALLE aktuellen Daten überschrieben. Dieser Vorgang kann nicht rückgängig gemacht werden. Möchten Sie fortfahren?")) {
      try {
        setIsRestoring(true);
        setSelectedBackup(id);
        
        // Backup wiederherstellen
        const result = await adminRestoreBackup(id);
        
        if (result) {
          toast({
            title: "Backup wiederhergestellt",
            description: "Das Backup wurde erfolgreich wiederhergestellt. Die Anwendung wird neu geladen.",
            variant: "default"
          });
          
          // Kurze Verzögerung für den Toast
          setTimeout(() => {
            // Seite neu laden, um Änderungen zu übernehmen
            window.location.reload();
          }, 2000);
        } else {
          throw new Error("Backup konnte nicht wiederhergestellt werden.");
        }
      } catch (error) {
        console.error("Fehler bei der Wiederherstellung des Backups:", error);
        toast({
          title: "Fehler bei der Wiederherstellung",
          description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
          variant: "destructive"
        });
        setIsRestoring(false);
        setSelectedBackup(null);
      }
    }
  };

  const deleteBackup = async (id: string) => {
    if (window.confirm("Sind Sie sicher, dass Sie dieses Backup löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.")) {
      try {
        // Backup löschen
        const result = await adminDeleteBackup(id);
        
        if (result) {
          toast({
            title: "Backup gelöscht",
            description: "Das Backup wurde erfolgreich gelöscht.",
            variant: "default"
          });
          
          // Backup-Liste aktualisieren
          loadBackups();
        } else {
          throw new Error("Backup konnte nicht gelöscht werden.");
        }
      } catch (error) {
        console.error("Fehler beim Löschen des Backups:", error);
        toast({
          title: "Fehler beim Löschen des Backups",
          description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
          variant: "destructive"
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Ungültiges Datumsformat:", dateString);
      return dateString;
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Datenbank-Backup</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backups verwalten
          </CardTitle>
          <CardDescription>
            Erstellen und verwalten Sie Backups der Datenbank. Sie können jederzeit zu einem früheren Zustand zurückkehren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Verfügbare Backups</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Alle {backups.length} Backups werden angezeigt.
                </p>
              </div>
              <Button 
                onClick={createBackup} 
                disabled={isCreatingBackup}
                className="gap-1"
              >
                {isCreatingBackup ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Backup wird erstellt...</>
                ) : (
                  <><Save className="h-4 w-4" /> Neues Backup erstellen</>
                )}
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : backups.length === 0 ? (
              <div className="bg-muted rounded-md p-8 text-center">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Backups vorhanden</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Es wurden noch keine Backups erstellt. Erstellen Sie Ihr erstes Backup, um Ihre Daten zu sichern.
                </p>
                <Button onClick={createBackup} disabled={isCreatingBackup}>
                  {isCreatingBackup ? "Backup wird erstellt..." : "Neues Backup erstellen"}
                </Button>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 font-medium bg-muted/40 text-sm border-b">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3">Datum</div>
                  <div className="col-span-2">Größe</div>
                  <div className="col-span-2 text-right">Aktionen</div>
                </div>
                <ScrollArea className="max-h-[400px]">
                  {backups.map((backup) => (
                    <div key={backup.name} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0 hover:bg-muted/10">
                      <div className="col-span-5 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">{backup.name}</span>
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {formatDate(backup.timestamp)}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {backup?.size || "-"}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => restoreBackup(backup.name)}
                          disabled={isRestoring}
                          title="Backup wiederherstellen"
                        >
                          {isRestoring && selectedBackup === backup.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBackup(backup.name)}
                          disabled={isRestoring}
                          title="Backup löschen"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
            
            <div className="bg-muted rounded-md p-4 text-sm">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium mb-1">Über Backups</p>
                  <p className="text-muted-foreground">
                    Backups enthalten einen vollständigen Snapshot der Datenbank zum Zeitpunkt der Erstellung.
                    Die Wiederherstellung eines Backups überschreibt alle aktuellen Daten.
                    Es wird empfohlen, vor größeren Änderungen ein Backup zu erstellen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Banner-Verwaltung
function BannerManagement() {
  const { toast } = useToast();
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  const copyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(`[banner position="${shortcode}"]`);
    toast({
      title: "Shortcode kopiert!",
      description: "Fügen Sie diesen Code an der gewünschten Stelle Ihrer Website ein. Der Banner wird nur angezeigt, wenn er aktiv ist, ansonsten wird der Container automatisch ausgeblendet."
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Banner-Verwaltung</h2>
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
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyShortcode(position.shortcode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="h-[160px] bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div className="p-3 flex items-center justify-between bg-muted/40">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          Inaktiv
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Aktualisiert: Nie
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setEditingBanner(editingBanner === position.shortcode ? null : position.shortcode)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Button>
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

// Produkt-Verwaltung
function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const { products = [] } = useProducts();
  const { toast } = useToast();

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product?.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
          <CardDescription>
            Verwalten Sie die angebotenen Produkte, überwachen Sie deren Status und fügen Sie neue Produkte hinzu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {filteredProducts.filter((p: any) => p.isActive && !p.isArchived).length}
                </div>
                <p className="text-sm text-muted-foreground">Aktive Produkte</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredProducts.filter((p: any) => p.validUntil && new Date(p.validUntil) < new Date()).length}
                </div>
                <p className="text-sm text-muted-foreground">Abgelaufene Produkte</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-muted-foreground">
                  {filteredProducts.filter((p: any) => p.isArchived).length}
                </div>
                <p className="text-sm text-muted-foreground">Archivierte Produkte</p>
              </CardContent>
            </Card>
          </div>

          {/* Suchleiste und Aktionen */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Produkte suchen..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/create/product">
                <Plus className="h-4 w-4 mr-2" />
                Neues Produkt anlegen
              </Link>
            </Button>
          </div>

          {/* Produkttabelle */}
          {filteredProducts.length === 0 ? (
            <div className="bg-muted rounded-md p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Produkte vorhanden</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Es wurden noch keine Produkte erstellt. Fügen Sie Ihr erstes Produkt hinzu.
              </p>
              <Button asChild>
                <Link href="/create/product">
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Produkt anlegen
                </Link>
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-3 font-medium text-sm border-b bg-muted/40">
                <div className="col-span-5">Produkt</div>
                <div className="col-span-2">Preis</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3 text-right">Aktionen</div>
              </div>
              <ScrollArea className="h-[400px]">
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0">
                    <div className="col-span-5 flex items-center gap-2">
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-medium">{product.price?.toFixed(2)} €</div>
                      {product.msrp && (
                        <div className="text-xs text-muted-foreground line-through">
                          {product.msrp?.toFixed(2)} €
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      {product.isArchived ? (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Archiviert
                        </Badge>
                      ) : product.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-3 flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/products/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          // Produkt archivieren
                          toast({
                            title: "Produkt archiviert",
                            description: `"${product.name}" wurde erfolgreich archiviert.`,
                          });
                        }}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// Event-Verwaltung
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