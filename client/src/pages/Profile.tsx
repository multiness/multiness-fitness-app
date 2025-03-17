import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy, Users2, ArrowRight, Pencil } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockChallenges } from "../data/mockData"; 
import { Badge } from "@/components/ui/badge";
import EditProfileDialog from "@/components/EditProfileDialog";
import { usePostStore } from "../lib/postStore";
import DailyGoalDisplay from "@/components/DailyGoalDisplay";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { getChatId } from "../lib/chatService";
import { useGroupStore } from "../lib/groupStore";
import EditGroupDialog from "@/components/EditGroupDialog";

export default function Profile() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const [, setLocation] = useLocation();
  const userId = parseInt(id || "1");
  const [user, setUser] = useState(() => mockUsers.find(u => u.id === userId));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("posts");
  const postStore = usePostStore();
  const groupStore = useGroupStore();
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const activeGoal = postStore.getDailyGoal(userId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]);

  const userPosts = Object.values(postStore.posts)
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userChallenges = mockChallenges.filter(c => c.creatorId === userId || c.participantIds?.includes(userId));
  
  const userGroups = Object.values(groupStore.groups)
    .filter(g => g.creatorId === userId || g.participantIds?.includes(userId));

  console.log('Current groups in store:', groupStore.groups);
  console.log('User groups:', userGroups);
  console.log('Current user ID:', userId);

  const activeUserChallenges = userChallenges.filter(c => new Date() <= new Date(c.endDate));

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
      {/* Profile Header - unchanged */}

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
        {/* TabsList - unchanged */}

        {/* Posts TabContent - unchanged */}

        {/* Challenges TabContent - unchanged */}

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          {userGroups.length > 0 ? (
            <div className="grid gap-4 grid-cols-1">
              {userGroups.map(group => {
                const isCreator = group.creatorId === userId;
                const isAdmin = group.adminIds?.includes(userId);
                console.log(`Group ${group.name} - Creator: ${isCreator}, Admin: ${isAdmin}`);

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
                              <Badge variant={isCreator ? "default" : "secondary"} className="ml-2">
                                {isCreator ? 'Admin' : (isAdmin ? 'Co-Admin' : 'Mitglied')}
                              </Badge>
                              {(isCreator || isAdmin) && (
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