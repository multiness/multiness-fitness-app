import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy, Users2, ArrowRight, Pencil } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockChallenges, mockGroups } from "../data/mockData";
import { Badge } from "@/components/ui/badge";
import EditProfileDialog from "@/components/EditProfileDialog";
import { usePostStore } from "../lib/postStore";
import DailyGoalDisplay from "@/components/DailyGoalDisplay";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getChatId } from "../lib/chatService";
import { useGroupStore } from "../lib/groupStore"; // Import useGroupStore


export default function Profile() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const [, setLocation] = useLocation();
  const userId = parseInt(id || "1");
  const [user, setUser] = useState(() => mockUsers.find(u => u.id === userId));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("posts");
  const postStore = usePostStore();
  const groupStore = useGroupStore(); // Initialize groupStore
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<null | any>(null);
  const activeGoal = postStore.getDailyGoal(userId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]);

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

  const navigateToChallenge = (challengeId: number) => {
    setLocation(`/challenges/${challengeId}`);
  };

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId);
    setLocation(`/chat/${chatId}`);
  };

  const userPosts = Object.values(postStore.posts)
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userChallenges = mockChallenges.filter(c => c.creatorId === userId || c.participantIds?.includes(userId));
  // Verwende Gruppen aus dem groupStore statt mockGroups
  const userGroups = Object.values(groupStore.groups)
    .filter(g => g.creatorId === userId || g.participantIds?.includes(userId));
  const activeUserChallenges = userChallenges.filter(c => new Date() <= new Date(c.endDate));

  const handleEditGroup = (group: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedGroup(group);
    setIsEditGroupDialogOpen(true);
  };

  const handleGroupUpdate = (groupId: number, updatedData: any) => {
    groupStore.updateGroup(groupId, updatedData);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="relative mb-8">
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
          </div>

          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <h2 className="text-lg text-muted-foreground">@{user.username}</h2>

          {user.bio && (
            <p className="text-center mt-2 max-w-md text-muted-foreground">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <span className="text-lg font-semibold">{userPosts.length}</span>
              <p className="text-sm text-muted-foreground">Beiträge</p>
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
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Beiträge
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Gruppen
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <FeedPost key={post.id} post={post} />
            ))
          ) : (
            <p className="text-center text-muted-foreground">Keine Beiträge gefunden</p>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          {userChallenges.length > 0 ? (
            <div className="grid gap-4 grid-cols-1">
              {userChallenges.map(challenge => (
                <Card 
                  key={challenge.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigateToChallenge(challenge.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {challenge.image ? (
                        <img 
                          src={challenge.image} 
                          alt={challenge.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                          </div>
                          <Badge variant={challenge.creatorId === userId ? "default" : "secondary"} className="ml-2">
                            {challenge.creatorId === userId ? 'Ersteller' : 'Teilnehmer'}
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            <span>{challenge.prize}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Details <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Keine Challenges gefunden</p>
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          {userGroups.length > 0 ? (
            <div className="grid gap-4 grid-cols-1">
              {userGroups.map(group => {
                // Prüfe, ob der aktuelle User der Creator oder Admin ist
                const isCreatorOrAdmin = group.creatorId === userId || (group.adminIds && group.adminIds.includes(userId));

                return (
                  <Card 
                    key={group.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigateToGroupChat(group.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {group.image ? (
                          <img 
                            src={group.image} 
                            alt={group.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Users2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{group.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={group.creatorId === userId ? "default" : "secondary"} className="ml-2">
                                {group.creatorId === userId ? 'Admin' : 'Mitglied'}
                              </Badge>
                              {isCreatorOrAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2"
                                  onClick={(e) => handleEditGroup(group, e)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {group.participantIds?.slice(0, 3).map((participantId) => {
                                  const participant = mockUsers.find(u => u.id === participantId);
                                  return participant ? (
                                    <UserAvatar
                                      key={participant.id}
                                      userId={participant.id}
                                      avatar={participant.avatar}
                                      username={participant.username}
                                      size="sm"
                                    />
                                  ) : null;
                                })}
                                {(group.participantIds?.length || 0) > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                                    +{(group.participantIds?.length || 0) - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {group.participantIds?.length || 0} Mitglieder
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1">
                              Chat öffnen <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Keine Gruppen gefunden</p>
          )}
        </TabsContent>

      </Tabs>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        onSave={handleProfileUpdate}
      />
      {/* Edit Group Dialog Placeholder */}
      {selectedGroup && (
        <EditGroupDialog
          open={isEditGroupDialogOpen}
          onOpenChange={setIsEditGroupDialogOpen}
          group={selectedGroup}
          onSave={handleGroupUpdate}
        />
      )}
    </div>
  );
}

// Placeholder for EditGroupDialog
const EditGroupDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
  onSave: (groupId: number, updatedData: any) => void;
}> = ({ open, onOpenChange, group, onSave }) => {
  // Implement your EditGroupDialog logic here.  This is a placeholder.
  return (
    <div>
      {/*  Your EditGroupDialog implementation would go here */}
      <p>Edit Group Dialog for {group.name} (Implementation needed)</p>
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  );
};