import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, UserPlus } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/VerifiedBadge"; // Fix import to use named import


export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Community Mitglieder</h1>
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

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredUsers.map(user => (
          <Card key={user.id} className="transition-all hover:shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href={`/profile/${user.id}`} className="hover:opacity-80">
                  <div className="relative">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    {user.isVerified && (
                      <VerifiedBadge className="absolute bottom-0 right-0" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold hover:text-primary truncate">{user.username}</h3>
                      <div className="flex flex-wrap gap-1">
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
                    </div>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{user.name}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex items-center gap-1 min-w-[100px]">
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Folgen</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 min-w-[100px]">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Nachricht</span>
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