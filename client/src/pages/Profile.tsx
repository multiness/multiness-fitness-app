import { useState } from "react";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Trophy, Users2, Image } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockPosts, mockChallenges, mockGroups } from "../data/mockData";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import type { User, Post, Challenge, Group } from "@shared/schema";

export default function Profile() {
  const { id } = useParams();
  const userId = parseInt(id || "1");
  const user = mockUsers.find(u => u.id === userId);
  const userPosts = mockPosts.filter(p => p.userId === userId);
  const userChallenges = mockChallenges.filter(c => c.creatorId === userId);
  const userGroups = mockGroups.filter(g => g.participantIds?.includes(userId));
  const activeUserChallenges = userChallenges.filter(c => new Date() <= new Date(c.endDate));

  const [selectedTab, setSelectedTab] = useState("all");

  if (!user) return <div>User not found</div>;

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover Image (optional) */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg" />

        <div className="flex flex-col items-center -mt-12">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <h2 className="text-lg text-muted-foreground">@{user.username}</h2>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {user.isAdmin && (
              <Badge variant="default" className="bg-primary">Admin</Badge>
            )}
            {user.isVerified && (
              <Badge variant="secondary">Verifiziert</Badge>
            )}
            {user.isTeamMember && user.teamRole && (
              <Badge variant="outline">{user.teamRole}</Badge>
            )}
          </div>

          {user.bio && (
            <p className="text-center mt-4 max-w-md text-muted-foreground">{user.bio}</p>
          )}

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-8 mt-6 w-full max-w-md">
            <div className="text-center">
              <div className="font-bold text-xl">{activeUserChallenges.length}</div>
              <div className="text-sm text-muted-foreground">Aktive Challenges</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{userPosts.length}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{userGroups.length}</div>
              <div className="text-sm text-muted-foreground">Gruppen</div>
            </div>
          </div>

          {userId === 1 && ( // Nur anzeigen, wenn es das eigene Profil ist
            <Button className="mt-6" variant="outline">Profil bearbeiten</Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Alle
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Gruppen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">
          {/* Active Challenges */}
          {activeUserChallenges.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aktive Challenges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeUserChallenges.map(challenge => (
                  <div key={challenge.id} className="relative rounded-lg overflow-hidden bg-muted aspect-video group hover:scale-[1.02] transition-transform">
                    <img
                      src={challenge.image || undefined}
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-white font-semibold">{challenge.title}</h4>
                      <p className="text-white/80 text-sm">
                        Endet am {format(new Date(challenge.endDate), "dd.MM.yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Letzte Posts</h3>
            <div className="space-y-4">
              {userPosts.slice(0, 3).map(post => (
                <FeedPost key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Groups */}
          {userGroups.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Gruppen</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {userGroups.map(group => (
                  <div key={group.id} className="aspect-square relative rounded-lg overflow-hidden group hover:scale-[1.02] transition-transform">
                    <img
                      src={group.image || undefined}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-medium text-sm">{group.name}</h4>
                      <p className="text-white/80 text-xs">
                        {group.participantIds?.length || 0} Mitglieder
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userChallenges.map(challenge => (
              <div key={challenge.id} className="relative rounded-lg overflow-hidden aspect-video group hover:scale-[1.02] transition-transform">
                <img
                  src={challenge.image || undefined}
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white font-semibold">{challenge.title}</h4>
                  <p className="text-white/80 text-sm">
                    {new Date() <= new Date(challenge.endDate) ? 'Aktiv' : 'Beendet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-4">
            {userPosts.map(post => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {userGroups.map(group => (
              <div key={group.id} className="aspect-square relative rounded-lg overflow-hidden group hover:scale-[1.02] transition-transform">
                <img
                  src={group.image || undefined}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-white font-medium">{group.name}</h4>
                  <p className="text-white/80 text-sm">
                    {group.participantIds?.length || 0} Mitglieder
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}