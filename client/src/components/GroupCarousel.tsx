import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useLocation } from "wouter";
import { getChatId } from "../lib/chatService";
import { UserAvatar } from "./UserAvatar";
import { useGroupStore, type Group } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";

interface GroupCarouselProps {
  groups: Group[];
}

export default function GroupCarousel({ groups }: GroupCarouselProps) {
  const groupStore = useGroupStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { users } = useUsers();
  const userId = 1; // Für dieses Beispiel nehmen wir an, dass der aktuelle Benutzer die ID 1 hat

  const handleJoin = (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (groupStore.isGroupMember(group.id, userId)) {
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

  const groupChunks = groups.reduce((acc, curr, i) => {
    if (i % 2 === 0) acc.push([]);
    acc[acc.length - 1].push(curr);
    return acc;
  }, [] as Group[][]);

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 snap-x snap-mandatory w-full">
        {groupChunks.map((chunk, chunkIndex) => (
          <div 
            key={chunkIndex}
            className="flex gap-4 shrink-0 snap-start w-[calc(100vw-2rem)]"
          >
            {chunk.map(group => {
              const creator = users.find(u => u.id === group.creatorId);
              const isJoined = groupStore.isGroupMember(group.id, userId);
              const chatId = getChatId(group.id);

              return (
                <Card 
                  key={group.id}
                  className="flex-1 overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors min-w-[150px]"
                  onClick={() => setLocation(`/chat/${chatId}`)}
                >
                  <div className="aspect-[3/2] relative overflow-hidden bg-muted">
                    <img
                      src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm leading-tight">
                        {group.name}
                      </h3>
                      {creator && (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            userId={creator.id}
                            size="sm"
                          />
                          <p className="text-xs text-muted-foreground truncate">
                            {creator.username}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{group.participantIds?.length || 0}</span>
                      </div>
                      <Button
                        variant={isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleJoin(e, group)}
                        className="h-7 px-2 text-xs"
                      >
                        {isJoined ? "Beigetreten" : "Beitreten"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}