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
                  className="flex-1 overflow-hidden cursor-pointer"
                  onClick={() => setLocation(`/groups/${group.id}`)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-medium text-sm mb-1">{group.name}</h3>
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={creator?.avatar} />
                          <AvatarFallback>{creator?.username[0]}</AvatarFallback>
                        </Avatar>
                        <span>{creator?.username}</span>
                      </div>
                      <Button
                        variant={isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleJoin(e, group)}
                        className="mt-2 w-full bg-white/10 hover:bg-white/20 border-white/20"
                      >
                        <Users className="h-4 w-4 mr-2" />
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
