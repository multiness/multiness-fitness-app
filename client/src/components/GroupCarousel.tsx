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
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Gruppen-Info */}
                  <div className="p-3 space-y-3">
                    {/* Header mit Creator-Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 ring-2 ring-background">
                        <AvatarImage src={creator?.avatar} />
                        <AvatarFallback>{creator?.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {creator?.username}
                        </p>
                      </div>
                    </div>

                    {/* Beschreibung */}
                    <p className="text-sm text-foreground/90 line-clamp-2">
                      {group.description}
                    </p>

                    {/* Mitglieder-Info und Action Button */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{Math.floor(Math.random() * 50) + 10} Mitglieder</span>
                      </div>
                      <Button
                        variant={isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleJoin(e, group)}
                        className={isJoined ? "border-primary/20" : ""}
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