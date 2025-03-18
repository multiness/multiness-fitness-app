import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Settings,
  Calendar,
  Activity,
  Star,
  MessageSquare,
  Group,
  Target,
} from "lucide-react";
import { DEFAULT_BANNER_POSITIONS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format, subDays } from "date-fns";
import { de } from 'date-fns/locale';
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useUsers } from "../contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAdmin } from "@/contexts/AdminContext";
import { useProducts } from "@/contexts/ProductContext";
import { usePostStore } from "../lib/postStore";
import { useGroupStore } from "../lib/groupStore";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data für Demonstration
const generateMockTimeData = (days: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({
      date: subDays(new Date(), i),
      users: Math.floor(Math.random() * 100),
      posts: Math.floor(Math.random() * 200),
      interactions: Math.floor(Math.random() * 500)
    });
  }
  return data.reverse();
};

export default function Admin() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("users");
  const [showUserStats, setShowUserStats] = useState(false);
  const [showGroupStats, setShowGroupStats] = useState(false);
  const [showChallengeStats, setShowChallengeStats] = useState(false);
  const [showPostStats, setShowPostStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { users } = useUsers();
  const postStore = usePostStore();
  const groupStore = useGroupStore();
  const { products, updateProduct } = useProducts();
  const { toast } = useToast();

  // Simulierte Statistiken
  const stats = {
    total: {
      users: users.length,
      activeUsers: Math.floor(users.length * 0.7), // Simuliert aktive User
      groups: 45,
      challenges: 28,
      events: 12
    },
    growth: {
      "24h": { users: 12, posts: 67, interactions: 234 },
      "7d": { users: 89, posts: 445, interactions: 1567 },
      "30d": { users: 356, posts: 1890, interactions: 6789 },
      "12m": { users: 4567, posts: 23456, interactions: 89012 }
    },
    performance: {
      topUsers: users.slice(0, 5).map(user => ({
        ...user,
        score: Math.floor(Math.random() * 1000),
        memberSince: subDays(new Date(), Math.floor(Math.random() * 365))
      })),
      topChallenges: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Challenge ${i + 1}`,
        participants: Math.floor(Math.random() * 100),
        completion: Math.floor(Math.random() * 100)
      })),
      topGroups: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Gruppe ${i + 1}`,
        members: Math.floor(Math.random() * 200),
        activity: Math.floor(Math.random() * 100)
      })),
      topPosts: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        author: users[Math.floor(Math.random() * users.length)],
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100)
      }))
    }
  };

  // Zeitbasierte Daten für Grafiken
  const timeData = {
    "24h": generateMockTimeData(24),
    "7d": generateMockTimeData(7),
    "30d": generateMockTimeData(30),
    "12m": generateMockTimeData(12)
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Community Insights */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Community Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-accent/5" onClick={() => setShowUserStats(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.total.users}</p>
                  <p className="text-sm text-muted-foreground">Gesamt User</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {stats.total.activeUsers} aktiv in 30 Tagen
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/5" onClick={() => setShowGroupStats(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Users2 className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.total.groups}</p>
                  <p className="text-sm text-muted-foreground">Gruppen</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                12 neue diese Woche
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/5" onClick={() => setShowChallengeStats(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Trophy className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.total.challenges}</p>
                  <p className="text-sm text-muted-foreground">Challenges</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                8 aktiv, 3 diese Woche
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Calendar className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.total.events}</p>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                5 kommende Events
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/5" onClick={() => setShowPostStats(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.growth["24h"].interactions}</p>
                  <p className="text-sm text-muted-foreground">Interaktionen heute</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                +{Math.floor(stats.growth["24h"].interactions / stats.growth["7d"].interactions * 100)}% vs. letzte Woche
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="space-y-8">
        {/* Product Management Section */}
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
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={product.image || "https://placehold.co/600x400/png"}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <Badge variant="outline" className="absolute top-2 left-2">
                        #{product.id}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge>{product.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => {
                            const updatedProduct = {
                              ...product,
                              isActive: !product.isActive
                            };
                            updateProduct(updatedProduct);
                          }}
                        />
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
            </CardContent>
          </Card>
        </section>

        {/* Marketing Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Marketing</h2>
          <Card>
            <CardHeader>
              <CardTitle>Marketing-Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button className="justify-start" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Push-Benachrichtigungen
                </Button>
                <Button className="justify-start" variant="outline">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Banner verwalten
                </Button>
                <Button className="justify-start" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Content hochladen
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Moderation Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Moderation</h2>
          <Card>
            <CardHeader>
              <CardTitle>Moderations-Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button className="justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Gemeldete Inhalte
                </Button>
                <Button className="justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Benutzer-Verwaltung
                </Button>
                <Button className="justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Event Management Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Event Management</h2>
          <Card>
            <CardHeader>
              <CardTitle>Event-Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button className="justify-start" variant="outline" asChild>
                  <Link href="/create/event">
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Event
                  </Link>
                </Button>
                <Button className="justify-start" variant="outline" asChild>
                  <Link href="/events/manager">
                    <Calendar className="h-4 w-4 mr-2" />
                    Event Manager
                  </Link>
                </Button>
                <Button className="justify-start" variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Event Statistiken
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Statistik-Dialoge */}
      <Dialog open={showUserStats} onOpenChange={setShowUserStats}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Benutzer Statistiken</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total.users}</div>
                  <p className="text-sm text-muted-foreground">Gesamt User</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total.activeUsers}</div>
                  <p className="text-sm text-muted-foreground">Aktive User (30d)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.growth["7d"].users}</div>
                  <p className="text-sm text-muted-foreground">Neue User (7d)</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Benutzer Wachstum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {/* Chart Component */}
                  <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">
                    User Growth Chart Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Benutzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.performance.topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{index + 1}.</div>
                        <UserAvatar userId={user.id} clickable />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Mitglied seit {format(user.memberSince, "dd.MM.yyyy", { locale: de })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.score}</p>
                        <p className="text-sm text-muted-foreground">Punkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ähnliche Dialoge für Groups, Challenges und Posts... */}
    </div>
  );
}