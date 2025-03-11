import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Shield, 
  Trophy,
  MessageSquare,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const admins = filteredUsers.filter(user => user.isAdmin);
  const verified = filteredUsers.filter(user => user.isVerified);
  const team = filteredUsers.filter(user => user.isTeamMember);

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Community Mitglieder</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {mockUsers.length} Mitglieder
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Suche nach Mitgliedern..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alle
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Verifiziert
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MembersList users={filteredUsers} />
        </TabsContent>

        <TabsContent value="admins">
          <MembersList users={admins} />
        </TabsContent>

        <TabsContent value="verified">
          <MembersList users={verified} />
        </TabsContent>

        <TabsContent value="team">
          <MembersList users={team} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MembersList({ users }: { users: typeof mockUsers }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{users.length} Mitglieder gefunden</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {users.map(user => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Link href={`/profile/${user.id}`} className="hover:opacity-80">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${user.id}`}>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold hover:text-primary">{user.username}</h3>
                          {user.isAdmin && (
                            <Badge variant="default" className="bg-primary">Admin</Badge>
                          )}
                          {user.isVerified && (
                            <Badge variant="secondary">Verifiziert</Badge>
                          )}
                          {user.isTeamMember && (
                            <Badge variant="outline">{user.teamRole}</Badge>
                          )}
                        </div>
                      </Link>
                      <p className="text-sm text-muted-foreground">{user.name}</p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <UserPlus className="h-4 w-4" />
                          Folgen
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          Nachricht
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}