import { useState } from "react";
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
  Bell
} from "lucide-react";
import { DEFAULT_BANNER_POSITIONS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useUsers } from "../contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";


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

// Leere Mock-Daten für die Statistik-Karten
const mockChallenges = [];
const mockGroups = [];
const mockPosts = [
  {
    id: 1,
    userId: 1,
    content: "Dies ist ein Beispiel für einen gemeldeten Beitrag.",
    image: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    userId: 2,
    content: "Ein weiterer gemeldeter Beitrag.",
    image: null,
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
                            <div className="mt-1">Empfohlene Mindestgröße</div>
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

export default function Admin() {
  const { users, toggleVerification } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const { toast } = useToast();

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
    <div className="container max-w-7xl mx-auto p-4 pb-8 space-y-8">
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
            <div className="text-2xl font-bold">{mockChallenges.length}</div>
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
            <div className="text-2xl font-bold">{mockGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              2 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              +25% engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Banner Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Marketing Banner Management</h2>
        <BannerManagement />
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
                          src={user.avatar}
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
                          <span className="text-sm whitespace-nowrap">Verified</span>
                          <Switch
                            checked={user.isVerified}
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
                {mockPosts.map(post => (
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
                {mockPosts.length === 0 && (
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
    </div>
  );
}