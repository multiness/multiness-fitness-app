import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy, Users2, ArrowRight, Pencil, Shield, UserCog } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { Badge } from "@/components/ui/badge";
import EditProfileDialog from "@/components/EditProfileDialog";
import { usePostStore } from "../lib/postStore";
import DailyGoalDisplay from "@/components/DailyGoalDisplay";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { getChatId } from "../lib/chatService";
import { useGroupStore } from "../lib/groupStore";
import { useChallengeStore } from "../lib/challengeStore";
import EditGroupDialog from "@/components/EditGroupDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChallengeCard from "@/components/ChallengeCard"; // Import ChallengeCard


export default function Profile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser, updateCurrentUser, users } = useUsers();
  const userId = parseInt(id || "1");
  const [user, setUser] = useState(() =>
    userId === currentUser?.id
      ? currentUser
      : users.find(u => u.id === userId)
  );
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

  const challengeStore = useChallengeStore();
  const userChallenges = Object.values(challengeStore.challenges).filter(challenge => 
    challenge.creatorId === userId || challenge.participantIds?.includes(userId));

  const userGroups = Object.values(groupStore.groups)
    .filter(g => g.creatorId === userId || g.participantIds?.includes(userId));

  console.log('Current user ID:', userId);
  console.log('User groups:', userGroups);
  console.log('All groups in store:', groupStore.groups);

  const activeUserChallenges = userChallenges.filter(challenge => new Date() <= new Date(challenge.endDate));

  if (!user) return <div>Benutzer nicht gefunden</div>;

  const handleProfileUpdate = (updatedData: {
    name: string;
    username: string;
    bio?: string;
    avatar?: string;
    bannerImage?: string;
    teamRole?: string;
  }) => {
    if (userId === currentUser?.id) {
      // Wenn es der aktuelle Benutzer ist, aktualisiere über den Context
      updateCurrentUser(updatedData);
    }
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
    const chatId = `group-${groupId}`;
    console.log('Navigating to group chat:', chatId);
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
    <div className="container max-w-4xl mx-auto px-4 pb-20 mb-20" style={{
      /* Verbesserte Touch-Handhabung für mobile Geräte */
      overscrollBehavior: "touch",
      WebkitOverflowScrolling: "touch"
    }}>
      {/* Profile Header - Leicht angepasst für verbesserte Performance */}
      <div className="relative mb-8">
        <div className="h-32 overflow-hidden rounded-t-lg">
          {user.bannerImage ? (
            <img
              src={user.bannerImage}
              alt="Profile Banner"
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full bg-gradient-to-r from-primary/20 to-primary/10" />
          )}
        </div>

        <div className="flex flex-col items-center -mt-12">
          <div className="relative">
            <UserAvatar
              userId={userId}
              size="lg"
              showActiveGoal={true}
              enableImageModal={true}
            />
          </div>

          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <h2 className="text-lg text-muted-foreground">@{user.username}</h2>
          
          {user.teamRole && (
            <div className="mt-1">
              <Badge variant="outline" className="font-medium">
                {user.teamRole}
              </Badge>
            </div>
          )}

          {user.bio && (
            <p className="text-center mt-2 max-w-md text-muted-foreground">{user.bio}</p>
          )}

          {/* Stats - mit verbesserten Performance-Attributen */}
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
              <>
                <Button onClick={() => setIsEditDialogOpen(true)}>Profil bearbeiten</Button>
                {/* Team-Mitglied-Button - nur für Team-Mitglieder anzeigen */}
                {currentUser.isTeamMember && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setLocation("/admin#team")}
                  >
                    <UserCog className="h-4 w-4" />
                    Team-Bereich
                  </Button>
                )}

                {/* Admin-Button - nur für Administratoren anzeigen */}
                {currentUser.isAdmin && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setLocation("/admin")}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="default"
                className="flex items-center gap-2"
                onClick={() => {
                  const chatId = getChatId(userId, 'user');
                  setLocation(`/chat/${chatId}`);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Nachricht senden
              </Button>
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

      {/* Tabs ohne ScrollArea - verbesserte Scroll-Funktionalität */}
      <div className="mt-6 pb-16">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Beiträge ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Challenges ({activeUserChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Gruppen ({userGroups.length})
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab - mit optimiertem Scrolling und Touch-Handhabung */}
          <TabsContent 
            value="groups" 
            className="space-y-4"
            style={{
              touchAction: "pan-y", 
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain"
            }}
          >
            {/* "Nach oben"-Button für einfache Navigation */}
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4 text-xs w-full flex gap-1"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <ArrowRight className="h-3 w-3 rotate-270" />
              Nach oben scrollen
            </Button>
            
            {userGroups.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 pb-20">
                <div className="text-sm text-muted-foreground mb-2">
                  {userGroups.length} Gruppen
                </div>
              
                {userGroups.map(group => {
                  const isCreator = group.creatorId === userId;
                  const isAdmin = group.adminIds?.includes(userId);

                  return (
                    <Card
                      key={group.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigateToGroupChat(group.id)}
                      style={{touchAction: "pan-y"}} // Verbesserte Berührungssteuerung
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
                                  {group.participantIds?.slice(0, 3).map((participantId) => (
                                    <UserAvatar
                                      key={participantId}
                                      userId={participantId}
                                      size="sm"
                                    />
                                  ))}
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
                
                {/* Verbesserte Scroll-Hilfe am Ende */}
                <div className="h-20 flex flex-col items-center justify-center text-muted-foreground text-xs pt-8">
                  <div className="mb-2">Ende der Gruppen</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  >
                    Nach oben
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Keine Gruppen gefunden
              </div>
            )}
          </TabsContent>

          {/* Posts TabContent - Komplett überarbeiteter Container mit besserem Touch-Handling */}
          <TabsContent 
            value="posts" 
            className="pb-8 mb-20"
            style={{
              touchAction: "pan-y", // Verbesserte Touch-Unterstützung
              WebkitOverflowScrolling: "touch", // Verbesserte iOS-Scrolling-Unterstützung
              overscrollBehavior: "contain" // Verhindert Pull-to-Refresh auf mobilen Geräten
            }}
          >
            <div className="space-y-5 pb-20 mb-20">
              {/* "Nach oben"-Button für einfache Navigation */}
              <Button 
                variant="outline" 
                size="sm" 
                className="mb-4 text-xs w-full flex gap-1"
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              >
                <ArrowRight className="h-3 w-3 rotate-270" />
                Nach oben scrollen
              </Button>
              
              {userPosts.length > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    {userPosts.length} Beiträge
                  </div>
                  
                  {userPosts.map((post) => (
                    <div 
                      key={`profile-post-${post.id}`} 
                      className="mb-6 rounded-lg overflow-hidden"
                      style={{touchAction: "pan-y"}} // Verbesserte Berührungssteuerung
                    >
                      <FeedPost post={post} />
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Keine Beiträge gefunden
                </div>
              )}
              
              {/* Zusätzlicher Platz und Scroll-Hilfe am Ende */}
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-xs pt-8">
                <div className="mb-2">Ende der Beiträge</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                >
                  Nach oben
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Challenges TabContent - Mit verbessertem Touch-Handling */}
          <TabsContent 
            value="challenges" 
            className="space-y-4 pb-20"
            style={{
              touchAction: "pan-y", 
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain"
            }}
          >
            {/* "Nach oben"-Button für einfache Navigation */}
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4 text-xs w-full flex gap-1"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <ArrowRight className="h-3 w-3 rotate-270" />
              Nach oben scrollen
            </Button>
            
            {activeUserChallenges.length > 0 ? (
              <div className="grid gap-4 pb-20">
                <div className="text-sm text-muted-foreground mb-2">
                  {activeUserChallenges.length} aktive Challenges
                </div>
                
                {activeUserChallenges.map((challenge) => (
                  <div key={challenge.id} style={{touchAction: "pan-y"}}>
                    <ChallengeCard
                      challenge={challenge}
                      variant="full"
                    />
                  </div>
                ))}
                
                {/* Verbesserte Scroll-Hilfe am Ende */}
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-xs pt-8">
                  <div className="mb-2">Ende der Challenges</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  >
                    Nach oben
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Keine aktiven Challenges gefunden
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
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