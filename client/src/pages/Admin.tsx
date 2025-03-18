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
import {
  Users,
  Trophy,
  Users2,
  TrendingUp,
  BarChart2,
  Calendar,
  Activity,
  Star,
  MessageSquare,
  Clock,
  Group,
  Target,
  Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { de } from 'date-fns/locale';
import { useUsers } from "../contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Mock data for demonstration
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

  const { users } = useUsers();
  const postStore = usePostStore();
  const groupStore = useGroupStore();

  // Simulierte Statistiken
  const stats = {
    total: {
      users: users.length,
      activeUsers: users.filter(u => u.lastLogin && new Date(u.lastLogin) > subDays(new Date(), 30)).length,
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
        score: Math.floor(Math.random() * 1000)
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

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Hauptstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
              <CalendarIcon className="h-8 w-8 text-primary" />
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

      {/* Wachstum & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Wachstum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Community Wachstum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                    <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                    <SelectItem value="30d">Letzter Monat</SelectItem>
                    <SelectItem value="12m">Letztes Jahr</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Neue User</SelectItem>
                    <SelectItem value="posts">Neue Posts</SelectItem>
                    <SelectItem value="interactions">Interaktionen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[300px] mt-4">
                {/* Hier würde ein Chart Component eingebunden werden */}
                <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">
                  Chart Placeholder
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.growth["24h"][selectedMetric as keyof typeof stats.growth["24h"]]}</div>
                    <p className="text-sm text-muted-foreground">24 Stunden</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.growth["7d"][selectedMetric as keyof typeof stats.growth["7d"]]}</div>
                    <p className="text-sm text-muted-foreground">7 Tage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.growth["30d"][selectedMetric as keyof typeof stats.growth["30d"]]}</div>
                    <p className="text-sm text-muted-foreground">30 Tage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.growth["12m"][selectedMetric as keyof typeof stats.growth["12m"]]}</div>
                    <p className="text-sm text-muted-foreground">12 Monate</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users">User</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="groups">Gruppen</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <div className="space-y-4">
                  {stats.performance.topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{index + 1}.</div>
                        <UserAvatar userId={user.id} clickable />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">Aktiv seit {format(new Date(user.createdAt), "dd.MM.yyyy")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.score}</p>
                        <p className="text-sm text-muted-foreground">Punkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="challenges" className="mt-4">
                <div className="space-y-4">
                  {stats.performance.topChallenges.map((challenge, index) => (
                    <div key={challenge.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{index + 1}.</div>
                        <div>
                          <p className="font-medium">{challenge.name}</p>
                          <p className="text-sm text-muted-foreground">{challenge.participants} Teilnehmer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{challenge.completion}%</p>
                        <p className="text-sm text-muted-foreground">Abschlussrate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="groups" className="mt-4">
                <div className="space-y-4">
                  {stats.performance.topGroups.map((group, index) => (
                    <div key={group.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{index + 1}.</div>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.members} Mitglieder</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{group.activity}</p>
                        <p className="text-sm text-muted-foreground">Aktivitätspunkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="posts" className="mt-4">
                <div className="space-y-4">
                  {stats.performance.topPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{index + 1}.</div>
                        <UserAvatar userId={post.author.id} clickable />
                        <div>
                          <p className="font-medium">{post.author.username}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-3 w-3" /> {post.comments}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{post.likes}</p>
                        <p className="text-sm text-muted-foreground">Likes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialoge */}
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
                  {/* Hier würde ein Chart Component eingebunden werden */}
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
                          <p className="text-sm text-muted-foreground">Aktiv seit {format(new Date(user.createdAt), "dd.MM.yyyy")}</p>
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