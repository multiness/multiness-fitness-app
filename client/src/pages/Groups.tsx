import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users2, Plus, Pencil, Share2, MessageCircle } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { getChatId } from "../lib/chatService";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ShareDialog from "@/components/ShareDialog";

import EditGroupDialog from "@/components/EditGroupDialog"; // Korrigierter Import-Pfad


export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser } = useUsers();
  const groupStore = useGroupStore();
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<null | any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareGroupId, setShareGroupId] = useState<number | null>(null);
  const { users } = useUsers();
  const { toast } = useToast();
  const groups = Object.values(groupStore.groups);

  console.log("Available groups:", groups);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId, 'group');
    console.log('Navigating to group chat:', chatId, 'type: group');
    setLocation(`/chat/${chatId}`);
  };

  const handleEditGroup = (e: React.MouseEvent, group: any) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleGroupUpdate = (groupId: number, updatedData: any) => {
    groupStore.updateGroup(groupId, updatedData);
  };
  
  // Funktion zum Öffnen des Share-Dialogs
  const handleShareGroup = (e: React.MouseEvent, group: any) => {
    e.stopPropagation(); // Verhindert Navigation beim Klicken
    setShareGroupId(group.id);
    setIsShareDialogOpen(true);
  };
  
  // Funktion zum Teilen über native Share-API (wenn verfügbar)
  const handleNativeShare = async (e: React.MouseEvent, group: any) => {
    e.stopPropagation(); // Verhindert Navigation beim Klicken
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: `Schau dir die Gruppe ${group.name} an: ${group.description}`,
          url: window.location.origin + `/groups/${group.id}`
        });
        toast({
          title: "Erfolgreich geteilt!",
          description: "Die Gruppe wurde über deine bevorzugte App geteilt.",
        });
      } catch (error) {
        console.error("Sharing failed:", error);
        toast({
          title: "Teilen fehlgeschlagen",
          description: "Beim Teilen ist ein Fehler aufgetreten.",
          variant: "destructive",
        });
      }
    } else {
      // Fallback, wenn Share API nicht verfügbar ist
      toast({
        title: "Teilen nicht verfügbar",
        description: "Die Share-Funktion wird auf diesem Gerät nicht unterstützt.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gruppen</h1>
        </div>
        <Link href="/create/group">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Gruppe erstellen
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Nach Gruppen suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Groups Grid */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 gap-4">
          {filteredGroups.map(group => {
            const isCreator = group.creatorId === currentUser?.id;
            const isAdmin = group.adminIds?.includes(currentUser?.id || 0);

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
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleEditGroup(e, group)}
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
                              return (
                                <UserAvatar
                                  key={participantId}
                                  userId={participantId}
                                  size="sm"
                                />
                              );
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
                        
                        {/* Share Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleShareGroup(e, group)}
                            title="In der App teilen"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleNativeShare(e, group)}
                            title="Extern teilen"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {selectedGroup && (
        <EditGroupDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          group={selectedGroup}
          onSave={handleGroupUpdate}
        />
      )}
      
      {/* Share Dialog für Gruppen */}
      {shareGroupId && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          type="chat"
          title="Gruppe teilen"
          onShare={() => {
            toast({
              title: "Geteilt!",
              description: "Die Gruppe wurde in deinem Chat geteilt.",
            });
          }}
          content={{
            id: shareGroupId,
            type: "group",
            title: groups.find(g => g.id === shareGroupId)?.name || "",
            preview: groups.find(g => g.id === shareGroupId)?.description || ""
          }}
        />
      )}
    </div>
  );
}