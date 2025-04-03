import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { Link, useLocation } from "wouter";
import { useGroupStore, type Group } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { getChatId } from "../lib/chatService";
import { UserAvatar } from "./UserAvatar";

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
      const chatId = getChatId(group.id);
      setLocation(`/chat/${chatId}`);
    }
  };

  const chatUrl = `/chat/${getChatId(group.id)}`;

  return (
    <Link href={chatUrl}>
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
            <Button
              variant={isJoined ? "outline" : "default"}
              size="sm"
              onClick={handleJoin}
              className="ml-2"
            >
              {isJoined ? "Beigetreten" : "Beitreten"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}