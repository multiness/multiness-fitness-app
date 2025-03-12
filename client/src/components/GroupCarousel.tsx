import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Group } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { useGroupStore } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface GroupCarouselProps {
  groups: Group[];
}

export default function GroupCarousel({ groups }: GroupCarouselProps) {
  const { isGroupMember, joinGroup, leaveGroup } = useGroupStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleJoin = (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGroupMember(group.id)) {
      leaveGroup(group.id);
      toast({
        title: "Gruppe verlassen",
        description: "Du hast die Gruppe erfolgreich verlassen.",
      });
    } else {
      joinGroup(group.id);
      toast({
        title: "Gruppe beigetreten",
        description: "Du bist der Gruppe erfolgreich beigetreten.",
      });
      setLocation(`/groups/${group.id}`);
    }
  };

  // Gruppen in Dreiergruppen aufteilen
  const groupChunks = groups.reduce((acc, curr, i) => {
    if (i % 3 === 0) acc.push([]);
    acc[acc.length - 1].push(curr);
    return acc;
  }, [] as Group[][]);

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 snap-x snap-mandatory w-full">
        {groupChunks.map((chunk, chunkIndex) => (
          <div 
            key={chunkIndex}
            className="flex gap-2 shrink-0 snap-start w-[calc(100vw-2rem)]"
          >
            {chunk.map(group => {
              const creator = mockUsers.find(u => u.id === group.creatorId);
              const isJoined = isGroupMember(group.id);

              return (
                <Card 
                  key={group.id}
                  className="flex-1 overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors"
                  onClick={() => setLocation(`/groups/${group.id}`)}
                >
                  {/* Gruppenbild */}
                  <div className="aspect-[3/2] relative overflow-hidden bg-muted">
                    <img
                      src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Gruppen-Info */}
                  <div className="p-2">
                    {/* Header mit Gruppen-Name */}
                    <h3 className="font-semibold text-base truncate mb-1">
                      {group.name}
                    </h3>

                    {/* Creator-Info */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={creator?.avatar} />
                        <AvatarFallback>{creator?.username[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-muted-foreground truncate">
                        {creator?.username}
                      </p>
                    </div>

                    {/* Action Button und Mitglieder */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{Math.floor(Math.random() * 50) + 10}</span>
                      </div>
                      <Button
                        variant={isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleJoin(e, group)}
                        className={`px-3 h-7 text-xs ${isJoined ? "border-primary/20" : ""}`}
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