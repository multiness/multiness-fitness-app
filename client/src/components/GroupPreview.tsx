import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useLocation } from "wouter";
import { useGroupStore, type Group } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "./UserAvatar";
import { getChatIdSync } from "../lib/chatService";

interface GroupPreviewProps {
  group: Group;
}

export default function GroupPreview({ group }: GroupPreviewProps) {
  const { users } = useUsers();
  const creator = users.find(u => u.id === group.creatorId);
  const groupStore = useGroupStore();
  const userId = 1; // Für dieses Beispiel nehmen wir an, dass der aktuelle Benutzer die ID 1 hat
  const isJoined = groupStore.isGroupMember(group.id, userId);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isJoined) {
      groupStore.leaveGroup(group.id, userId);
      toast({
        title: "Gruppe verlassen",
        description: "Du hast die Gruppe erfolgreich verlassen.",
      });
    } else {
      groupStore.joinGroup(group.id, userId);
      toast({
        title: "Gruppe beigetreten",
        description: "Du bist der Gruppe erfolgreich beigetreten.",
      });
      goToGroupChat();
    }
  };

  const goToGroupChat = () => {
    const chatId = getChatIdSync(group.id, 'group');
    setLocation(`/chat/${chatId}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToGroupChat();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isJoined) {
      goToGroupChat();
    } else {
      setLocation(`/groups/${group.id}`);
    }
  };

  return (
    <div onClick={handleCardClick}>
      <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <img
            src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
            alt={group.name}
            className="w-full h-32 object-cover"
          />
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-2">{group.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {group.description}
          </p>

          {creator && (
            <div className="flex items-center gap-2 mb-3">
              <UserAvatar
                userId={creator.id}
                size="sm"
                disableLink={true}
              />
              <span className="text-sm text-muted-foreground">
                Created by {creator.username}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {group.participantIds?.slice(0, 3).map((participantId) => {
                  const participant = users.find(u => u.id === participantId);
                  return participant ? (
                    <UserAvatar
                      key={participantId}
                      userId={participant.id}
                      size="sm"
                      disableLink={true}
                    />
                  ) : null;
                })}
                {(group.participantIds?.length || 0) > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    +{(group.participantIds?.length || 0) - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.participantIds?.length || 0} Mitglieder
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" 
                size="sm"
                onClick={handleMessage}
                className="flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Chat
              </Button>
              <Button
                variant={isJoined ? "outline" : "default"}
                size="sm"
                onClick={handleJoin}
              >
                {isJoined ? "Beigetreten" : "Beitreten"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}