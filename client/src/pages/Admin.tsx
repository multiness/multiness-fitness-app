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
  BarChart
} from "lucide-react";
import { DEFAULT_BANNER_POSITIONS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useUsers } from "../contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Simulierte Banner-Daten für den Prototyp
const mockBanners = [
  {
    id: 1,
    name: "Summer Challenge",
    positionId: "APP_HEADER",
    description: "Promotion für die Summer Fitness Challenge",
    appImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
    webImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1920&auto=format",
    isActive: true,
    targetUrl: "https://example.com", // Added targetUrl
    stats: {
      views: 1234,
      clicks: 89,
      ctr: "7.2%"
    }
  }
];

// Leere Mock-Daten für die Statistik-Karten
const mockChallenges = [];
const mockGroups = [];
const mockPosts = [];

// Änderungen im BannerManagement
function BannerManagement() {
  const { toast } = useToast();

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
                {mockBanners
                  .filter(banner => banner.positionId === position.shortcode)
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
                          <div>
                            <label className="text-sm font-medium">Link</label>
                            <Input defaultValue={banner.targetUrl} className="mt-1.5" placeholder="https://" />
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
                          <Button variant="outline" size="sm">
                            Änderungen speichern
                          </Button>
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
            <CardTitle>Gemeldete Inhalte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Search reported content..." />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {mockPosts.map(post => (
                  <div key={post.id} className="border-b p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          Post by @{users.find(u => u.id === post.userId)?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">Remove</Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Approve</Button>
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