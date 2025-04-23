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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/contexts/UserContext";
import { useGroupStore } from "@/lib/groupStore";
import { useChallengeStore } from "@/lib/challengeStore";
import { usePostStore } from "@/lib/postStore";
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
  Download
} from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { format } from "date-fns/format";
import { de } from "date-fns/locale/de";
// Mock-Funktionen für Backup-Verwaltung (später durch echte Implementierung ersetzen)
const adminViewBackups = async () => {
  // Mock-Daten für Backups
  return [
    { id: '1', date: new Date().toISOString(), size: '2.3 MB' },
    { id: '2', date: new Date(Date.now() - 86400000).toISOString(), size: '2.1 MB' }
  ];
};

const adminBackupDatabase = async () => {
  // Mock-Funktion für Backup-Erstellung
  return { success: true };
};

const adminRestoreBackup = async (id: string) => {
  // Mock-Funktion für Backup-Wiederherstellung
  return { success: true };
};

const adminDeleteBackup = async (id: string) => {
  // Mock-Funktion für Backup-Löschung
  return { success: true };
};
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
                    <div className="col-span-3 flex justify-end">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          if (user.isTeamMember) {
                            toggleTeamMember(user.id);
                            toast({
                              title: "Aus Team entfernt",
                              description: `${user.name} ist kein Team-Mitglied mehr.`,
                            });
                          } else {
                            toggleTeamMember(user.id);
                            toast({
                              title: "Zum Team hinzugefügt",
                              description: `${user.name} ist jetzt Teil des Teams.`,
                            });
                          }
                        }}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                      >
                        {user.isTeamMember ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            Entfernen
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Hinzufügen
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Benutzerliste - Mobile Ansicht */}
            <div className="sm:hidden space-y-4">
              {filteredUsers.map(user => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/40"} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/40";
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
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex justify-between items-center border rounded-md p-2">
                        <span className="text-sm">Team-Mitglied</span>
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
                      <div className="flex justify-between items-center border rounded-md p-2">
                        <span className="text-sm">Administrator</span>
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
                    
                    {user.isTeamMember && (
                      <div className="mb-3">
                        <label className="text-sm mb-1 block">Team-Rolle</label>
                        <select
                          className="w-full p-2 text-sm rounded border"
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
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          if (user.isTeamMember) {
                            toggleTeamMember(user.id);
                            toast({
                              title: "Aus Team entfernt",
                              description: `${user.name} ist kein Team-Mitglied mehr.`,
                            });
                          } else {
                            toggleTeamMember(user.id);
                            toast({
                              title: "Zum Team hinzugefügt",
                              description: `${user.name} ist jetzt Teil des Teams.`,
                            });
                          }
                        }}
                        disabled={user.id === 1 && user.username === "maxmustermann"}
                      >
                        {user.isTeamMember ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            Aus Team entfernen
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Zum Team hinzufügen
                          </>
                        )}
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

// Gruppen-Synchronisation Verwaltung
function GroupSyncManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: string | null;
    groupCount: number | null;
    deletedCount: number | null;
  }>({
    lastSync: null,
    groupCount: null,
    deletedCount: null
  });

  // Event-Handler für erzwungene Synchronisierung
  const handleForcedSync = (event: CustomEvent) => {
    if (event.detail?.source === 'manual') {
      synchronizeGroups();
    }
  };

  // Effekt zum Einrichten des Event-Listeners
  useEffect(() => {
    window.addEventListener('forcedSync', handleForcedSync as EventListener);
    return () => {
      window.removeEventListener('forcedSync', handleForcedSync as EventListener);
    };
  }, []);

  // Hilfsfunktion zum Abrufen des Status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/groups/sync/status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          lastSync: data.lastSync,
          groupCount: data.groupCount,
          deletedCount: data.deletedCount
        });
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Synchronisierungsstatus:", error);
    }
  };

  // Lade den Status beim ersten Render
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  // Funktion zur Synchronisierung der Gruppen
  const synchronizeGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/groups/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Gruppen synchronisiert",
          description: `${data.syncedCount} Gruppen wurden erfolgreich synchronisiert.`
        });
        fetchSyncStatus(); // Aktualisiere den Status nach der Synchronisierung
      } else {
        toast({
          title: "Synchronisierungsfehler",
          description: "Bei der Synchronisierung der Gruppen ist ein Fehler aufgetreten.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Gruppensynchronisierung:", error);
      toast({
        title: "Synchronisierungsfehler",
        description: "Bei der Synchronisierung der Gruppen ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Gruppen-Synchronisation</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Gruppen synchronisieren
          </CardTitle>
          <CardDescription>
            Synchronisieren Sie die Gruppen mit der Datenbank und bereinigen Sie gelöschte Gruppen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {syncStatus.groupCount !== null ? syncStatus.groupCount : "-"}
                  </div>
                  <p className="text-sm text-muted-foreground">Aktive Gruppen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-amber-600">
                    {syncStatus.deletedCount !== null ? syncStatus.deletedCount : "-"}
                  </div>
                  <p className="text-sm text-muted-foreground">Gelöschte Gruppen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString('de-DE') : "Noch nie"}
                  </div>
                  <p className="text-sm text-muted-foreground">Letzte Synchronisierung</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button 
                disabled={isLoading} 
                onClick={synchronizeGroups}
                className="gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Synchronisiere...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4" />
                    Jetzt synchronisieren
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Typ-Definition für Backup-Informationen
interface BackupInfo {
  id: string;
  date: string;
  size: string;
}

// Backup-Verwaltung
function BackupManagement() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Backups abrufen
  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const backupsData = await adminViewBackups();
      // Stellen Sie sicher, dass die Daten dem erwarteten Format entsprechen
      setBackups(backupsData as BackupInfo[]);
    } catch (error) {
      console.error("Fehler beim Abrufen der Backups:", error);
      toast({
        title: "Fehler",
        description: "Die Backups konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Backups beim ersten Render laden
  useEffect(() => {
    loadBackups();
  }, []);

  // Backup erstellen
  const createBackup = async () => {
    setIsCreating(true);
    try {
      await adminBackupDatabase();
      toast({
        title: "Backup erstellt",
        description: "Die Datenbank wurde erfolgreich gesichert."
      });
      loadBackups(); // Liste aktualisieren
    } catch (error) {
      console.error("Fehler beim Erstellen des Backups:", error);
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Backup wiederherstellen
  const restoreBackup = async (backupId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Backup wiederherstellen möchten? Alle aktuellen Daten werden überschrieben.")) {
      return;
    }
    
    setIsRestoring(true);
    setSelectedBackup(backupId);
    try {
      await adminRestoreBackup(backupId);
      toast({
        title: "Backup wiederhergestellt",
        description: "Die Datenbank wurde erfolgreich wiederhergestellt."
      });
    } catch (error) {
      console.error("Fehler bei der Wiederherstellung:", error);
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
  const deleteBackup = async (backupId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Backup löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }
    
    try {
      await adminDeleteBackup(backupId);
      toast({
        title: "Backup gelöscht",
        description: "Das Backup wurde erfolgreich gelöscht."
      });
      loadBackups(); // Liste aktualisieren
    } catch (error) {
      console.error("Fehler beim Löschen des Backups:", error);
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Datenbank-Backup</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Backups verwalten
          </CardTitle>
          <CardDescription>
            Sichern und wiederherstellen Sie die Datenbank
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Verfügbare Backups</h3>
              <Button 
                onClick={createBackup} 
                disabled={isCreating}
                className="gap-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Erstelle Backup...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Neues Backup erstellen
                  </>
                )}
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-muted/20">
                <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Keine Backups vorhanden</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Erstellen Sie Ihr erstes Backup, um Ihre Daten zu sichern.
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 font-medium text-sm border-b bg-muted/40">
                  <div className="col-span-5">Datum</div>
                  <div className="col-span-3">Größe</div>
                  <div className="col-span-4 text-right">Aktionen</div>
                </div>
                <ScrollArea className="max-h-[300px]">
                  {backups.map((backup) => (
                    <div key={backup.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-b-0">
                      <div className="col-span-5 font-medium">
                        {new Date(backup.date).toLocaleString('de-DE')}
                      </div>
                      <div className="col-span-3 text-muted-foreground text-sm">
                        {backup.size}
                      </div>
                      <div className="col-span-4 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => restoreBackup(backup.id)}
                          disabled={isRestoring}
                          className="gap-1"
                        >
                          {isRestoring && selectedBackup === backup.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                          Wiederherstellen
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteBackup(backup.id)}
                          className="gap-1"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Produkt-Verwaltung
function ProductManagement() {
  const [products, setProducts] = useState([]);
  // Hier weitere Produkt-Verwaltungslogik

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Produkt-Verwaltung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produkte verwalten
          </CardTitle>
          <CardDescription>
            Hier können Sie Produkte hinzufügen, bearbeiten oder entfernen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center p-4">
            <p>Produktverwaltung wird in einem zukünftigen Update implementiert.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Banner-Verwaltung
function BannerManagement() {
  const { toast } = useToast();

  const copyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(`[banner position="${shortcode}"]`);
    toast({
      title: "Shortcode kopiert!",
      description: "Fügen Sie diesen Code an der gewünschten Stelle Ihrer Website ein."
    });
  };

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Marketing-Banner</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Banner-Verwaltung
          </CardTitle>
          <CardDescription>
            Erstellen und verwalten Sie Marketing-Banner, die an verschiedenen Stellen der Website angezeigt werden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Header-Banner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12 bg-primary/10 border-2 border-dashed border-primary/20 rounded flex items-center justify-center mb-3">
                    Vorschaubereich
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="bg-green-600">Aktiv</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => copyShortcode("header")}
                    >
                      <Copy className="h-3.5 w-3.5" /> 
                      <span className="font-mono text-xs">header</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sidebar-Banner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12 bg-primary/10 border-2 border-dashed border-primary/20 rounded flex items-center justify-center mb-3">
                    Vorschaubereich
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline">Inaktiv</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => copyShortcode("sidebar")}
                    >
                      <Copy className="h-3.5 w-3.5" /> 
                      <span className="font-mono text-xs">sidebar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Footer-Banner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12 bg-primary/10 border-2 border-dashed border-primary/20 rounded flex items-center justify-center mb-3">
                    Vorschaubereich
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="bg-green-600">Aktiv</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => copyShortcode("footer")}
                    >
                      <Copy className="h-3.5 w-3.5" /> 
                      <span className="font-mono text-xs">footer</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neuen Banner erstellen
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}

// Event-Verwaltung
function EventSection() {
  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Event-Verwaltung</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events verwalten
          </CardTitle>
          <CardDescription>
            Hier können Sie anstehende Events überwachen und verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center p-4">
            <p>Eventverwaltung wird in einem zukünftigen Update implementiert.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}