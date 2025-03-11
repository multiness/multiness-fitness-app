import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, UserPlus } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Community Mitglieder</h1>
        <div className="text-sm text-muted-foreground">
          {mockUsers.length} Mitglieder
        </div>
      </div>

      {/* Verbessertes Suchfeld */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Nach Namen oder Benutzernamen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map(user => (
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
    </div>
  );
}