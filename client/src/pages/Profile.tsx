import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Trophy, Users2, Image } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockPosts, mockChallenges, mockGroups } from "../data/mockData";
import { Badge } from "@/components/ui/badge";
import EditProfileDialog from "@/components/EditProfileDialog";
import { usePostStore } from "../lib/postStore";
import DailyGoalDisplay from "@/components/DailyGoalDisplay";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "@/components/UserAvatar";

export default function Profile() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const userId = parseInt(id || "1");
  const [user, setUser] = useState(() => mockUsers.find(u => u.id === userId));
  const userPosts = mockPosts.filter(p => p.userId === userId);
  const userChallenges = mockChallenges.filter(c => c.creatorId === userId);
  const userGroups = mockGroups.filter(g => g.participantIds?.includes(userId));
  const activeUserChallenges = userChallenges.filter(c => new Date() <= new Date(c.endDate));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const postStore = usePostStore();
  const activeGoal = postStore.getDailyGoal(userId);

  if (!user) return <div>User not found</div>;

  const handleProfileUpdate = (updatedData: { name: string; bio?: string; avatar?: string }) => {
    setUser(currentUser => {
      if (!currentUser) return currentUser;
      return {
        ...currentUser,
        ...updatedData,
      };
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg" />

        <div className="flex flex-col items-center -mt-12">
          <div className="relative">
            <UserAvatar
              userId={userId}
              avatar={user.avatar}
              username={user.username}
              size="lg"
              showActiveGoal={true}
            />
            {user.isVerified && (
              <VerifiedBadge className="absolute bottom-0 right-0" />
            )}
          </div>

          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <h2 className="text-lg text-muted-foreground">@{user.username}</h2>

          {/* Bio */}
          {user.bio && (
            <p className="text-center mt-2 max-w-md text-muted-foreground">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <span className="text-lg font-semibold">{userPosts.length}</span>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold">{activeUserChallenges.length}</span>
              <p className="text-sm text-muted-foreground">Aktive Challenges</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold">{userGroups.length}</span>
              <p className="text-sm text-muted-foreground">Gruppen</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {currentUser?.id === userId ? (
              <Button onClick={() => setIsEditDialogOpen(true)}>Profil bearbeiten</Button>
            ) : (
              <Button>Folgen</Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Goal Display */}
      {activeGoal && (
        <div className="mb-6">
          <DailyGoalDisplay
            goal={activeGoal}
            userId={userId}
            variant="profile"
          />
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Alle
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Gruppen
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Medien
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="all" className="space-y-4">
          {userPosts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {userChallenges.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {userChallenges.map(challenge => (
                <div key={challenge.id} className="bg-card rounded-lg p-4">
                  <h3 className="font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  <div className="flex gap-2 mt-2">
                    {challenge.tags?.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Keine Challenges gefunden</p>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {userGroups.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {userGroups.map(group => (
                <div key={group.id} className="bg-card rounded-lg p-4">
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Keine Gruppen gefunden</p>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          {userPosts.filter(post => post.image).length > 0 ? (
            <div className="grid gap-4 grid-cols-3">
              {userPosts
                .filter(post => post.image)
                .map(post => (
                  <img
                    key={post.id}
                    src={post.image || ''}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Keine Medien gefunden</p>
          )}
        </TabsContent>
      </Tabs>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}