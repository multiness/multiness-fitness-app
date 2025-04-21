import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useLocation } from "wouter";
import { getChatId } from "../lib/chatService";
import { UserAvatar } from "./UserAvatar";
import { useGroupStore, type Group } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { memo, useState, useEffect, useMemo } from "react";

interface GroupCarouselProps {
  groups: Group[];
}

const GroupCarousel = ({ groups }: GroupCarouselProps) => {
  const groupStore = useGroupStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { users } = useUsers();
  const userId = 1; // Für dieses Beispiel nehmen wir an, dass der aktuelle Benutzer die ID 1 hat
  const [isLoading, setIsLoading] = useState(true);

  // Optimiertes Laden
  useEffect(() => {
    // Wenn Gruppen vorhanden sind und nicht geladen wird, setze den Ladestatus auf fertig
    if (Array.isArray(groups) && groups.length > 0) {
      // Kurze Verzögerung, um flackern zu vermeiden
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [groups]);

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
      const chatId = getChatId(group.id, 'group');
      setLocation(`/chat/${chatId}`);
    }
  };

  // Log nur bei Änderungen und im Entwicklungsmodus
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("GroupCarousel received groups:", groups.map(g => `${g.id} - ${g.name}`));
    }
  }, [groups]);

  // Detect mobile devices - WICHTIG: Hooks müssen vor bedingtem Rendering kommen
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Memoize group chunks to prevent unnecessary re-calculation
  const groupChunks = useMemo(() => {
    // Ensure groups is an array before chunking
    const validGroups = Array.isArray(groups) ? groups : [];
    
    return validGroups.reduce((acc, curr, i) => {
      if (i % 2 === 0) acc.push([]);
      acc[acc.length - 1].push(curr);
      return acc;
    }, [] as Group[][]);
  }, [groups]);

  // Lade-Skeleton
  if (isLoading) {
    return (
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 snap-x snap-mandatory w-full">
          {[...Array(2)].map((_, chunkIndex) => (
            <div 
              key={chunkIndex}
              className="flex gap-4 shrink-0 snap-start w-[calc(100vw-2rem)]"
            >
              {[...Array(2)].map((_, index) => (
                <Card 
                  key={index}
                  className="flex-1 overflow-hidden bg-card min-w-[150px]"
                >
                  <Skeleton className="aspect-[3/2] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-[80%]" />
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Keine Gruppen
  if (groupChunks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="font-medium mb-1">Keine Gruppen</h3>
        <p className="text-sm max-w-md mx-auto">
          Erstelle eine neue Gruppe oder tritt einer bestehenden Gruppe bei.
        </p>
      </div>
    );
  }

  console.debug("Gruppen nach ID:", groups.map(g => g.id).join(", "));
  
  return (
    <div className="overflow-x-auto pb-32 -mx-4 px-4 mb-14 relative z-0"> {/* Stark erhöhter Abstand unten für mobile Geräte */}
      <div className="flex gap-4 snap-x snap-mandatory w-full pb-8"> {/* Erhöhter Abstand am unteren Rand */}
        {groupChunks.map((chunk, chunkIndex) => (
          <div 
            key={chunkIndex}
            className="flex gap-4 shrink-0 snap-start w-[calc(100vw-2rem)]"
            style={{ scrollSnapAlign: 'start' }} // Explizite Scroll-Snap-Ausrichtung
          >
            {chunk.map(group => {
              const isJoined = groupStore.isGroupMember(group.id, userId);
              const chatId = getChatId(group.id, 'group');
              
              if (isMobile) {
                console.debug("Rendering mobile group card:", `${group.id} - ${group.name}`);
              } else {
                console.debug("Rendering desktop group card:", `${group.id} - ${group.name}`);
              }

              return (
                <Card 
                  key={`group-card-${group.id}`}
                  className="flex-1 overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors min-w-[150px] transform-gpu shadow-sm" // Hinzugefügter Schatten
                  onClick={() => setLocation(`/chat/${chatId}`)}
                  style={{ 
                    scrollMarginBottom: isMobile ? '6rem' : '4rem', // Erhöhte Scroll-Margin für mobile Geräte
                    borderColor: isJoined ? 'var(--green-500)' : undefined, // Hervorhebung von beigetretenen Gruppen
                    borderWidth: isJoined ? '2px' : '1px'
                  }}
                >
                  <div className="aspect-[3/2] relative overflow-hidden bg-muted">
                    <img
                      src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                      alt={group.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback für Bilder, die nicht geladen werden können
                        e.currentTarget.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format";
                      }}
                      loading="lazy" 
                    />
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm leading-tight">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <UserAvatar
                          userId={group.creatorId || 1}
                          size="sm"
                        />
                        <p className="text-xs text-muted-foreground truncate">
                          {group.creatorId === 1 ? "Max Mustermann" : "Gruppenersteller"}
                        </p>
                      </div>
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
};

export default GroupCarousel;