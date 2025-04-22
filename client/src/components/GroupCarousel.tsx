import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Share2, MessageCircle } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useLocation } from "wouter";
import { getChatIdSync } from "../lib/chatService";
import { UserAvatar } from "./UserAvatar";
import { useGroupStore, type Group } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { memo, useState, useEffect, useMemo } from "react";
import ShareDialog from "./ShareDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupCarouselProps {
  groups: Group[];
}

const GroupCarousel = ({ groups }: GroupCarouselProps) => {
  const groupStore = useGroupStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { users, currentUser } = useUsers();
  const userId = currentUser?.id || 1; // Für dieses Beispiel nehmen wir an, dass der aktuelle Benutzer die ID 1 hat
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'chat' | 'group'>('chat');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

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
      const chatId = getChatIdSync(group.id, 'group');
      setLocation(`/chat/${chatId}`);
    }
  };
  
  // Funktion für das native Teilen (mobile Geräte oder WhatsApp)
  const handleNativeShare = async (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: group.name,
      text: `Schau dir diese Gruppe an: ${group.name}`,
      url: `${window.location.origin}/groups/${group.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback auf WhatsApp, wenn Web Share API nicht verfügbar ist
        const url = `${window.location.origin}/groups/${group.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${group.name} - ${url}`)}`);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Funktion zum Öffnen des ShareDialogs für interne App-Teilung
  const handleInternalShare = (type: 'chat' | 'group', e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    setShareType(type);
    setSelectedGroup(group);
    setShareDialogOpen(true);
  };

  // Callback-Funktion für die Weitergabe an den ShareDialog
  const handleShare = (id: number) => {
    if (selectedGroup) {
      console.log(`Sharing group ${selectedGroup.id} to ${shareType} ${id}`);
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
  
  // Inhalt, der im ShareDialog angezeigt wird
  const sharedContent = selectedGroup ? {
    id: selectedGroup.id,
    type: 'group' as const,
    title: selectedGroup.name,
    preview: selectedGroup.description || 'Gruppendetails anzeigen'
  } : undefined;

  return (
    <>
      <div className="overflow-x-auto pb-8 md:pb-8 -mx-4 px-4 mb-4 relative z-0"> {/* Reduzierter Abstand für Mobile, Desktop bleibt gleich */}
        <div className="flex gap-4 snap-x snap-mandatory w-full pb-2"> {/* Reduzierter Abstand am unteren Rand */}
        {groupChunks.map((chunk, chunkIndex) => (
          <div 
            key={chunkIndex}
            className="flex gap-4 shrink-0 snap-start w-[calc(100vw-2rem)] md:w-auto md:min-w-[600px]"
            style={{ scrollSnapAlign: 'start' }} // Explizite Scroll-Snap-Ausrichtung
          >
            {chunk.map(group => {
              const isJoined = groupStore.isGroupMember(group.id, userId);
              const chatId = getChatIdSync(group.id, 'group');
              
              if (isMobile) {
                console.debug("Rendering mobile group card:", `${group.id} - ${group.name}`);
              } else {
                console.debug("Rendering desktop group card:", `${group.id} - ${group.name}`);
              }

              // Bestimme spezifische Eigenschaften für mobile und Desktop-Ansicht
              const cardClasses = isMobile 
                ? "flex-1 overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors min-w-[150px] max-w-[350px] transform-gpu shadow-md border-0 rounded-lg" // Mobile-optimiert - keine Ränder, abgerundete Ecken, stärkerer Schatten
                : "flex-1 overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors min-w-[280px] max-w-[350px] transform-gpu shadow-sm"; // Desktop bleibt unverändert

              return (
                <Card 
                  key={`group-card-${group.id}`}
                  className={cardClasses}
                  onClick={() => {
                    // Verbesserte Navigation zu Gruppenchats
                    console.log(`Navigiere zu Chat für Gruppe ${group.id}`);
                    
                    if (isJoined) {
                      // Wenn Benutzer bereits Mitglied ist, direkt zum Chat navigieren
                      const chatId = getChatIdSync(group.id, 'group');
                      console.log(`Chat-ID für Gruppe ${group.id} ist ${chatId}`);
                      setLocation(`/chat/${chatId}`);
                    } else {
                      // Wenn Benutzer kein Mitglied ist, zur Gruppendetailseite navigieren
                      setLocation(`/groups/${group.id}`);
                    }
                  }}
                  style={{ 
                    scrollMarginBottom: isMobile ? '6rem' : '2rem', // Angepasste Scroll-Margin für Desktop
                    ...(isMobile ? {} : { // Nur für Desktop-Ansicht:
                      borderColor: isJoined ? 'var(--green-500)' : undefined, // Hervorhebung von beigetretenen Gruppen
                      borderWidth: isJoined ? '2px' : '1px'
                    })
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

                  <div className={`${isMobile ? 'p-4' : 'p-3'} space-y-2`}>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <UserAvatar
                          userId={group.creatorId || 1}
                          size="sm"
                        />
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {group.creatorId === 1 ? "Max Mustermann" : "Gruppenersteller"}
                        </p>
                      </div>
                    </div>

                    {/* Mitglieder-Anzeige und Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{group.participantIds?.length || 0}</span>
                      </div>
                      <Button
                        variant={isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleJoin(e, group)}
                        className="h-7 px-2 text-xs whitespace-nowrap"
                      >
                        {isJoined ? "Beigetreten" : "Beitreten"}
                      </Button>
                    </div>
                    
                    {/* Teilen-Buttons am unteren Rand */}
                    <div className="flex items-center justify-between pt-3 border-t mt-2">
                      <div className="flex items-center gap-2">
                        {/* Button für externes Teilen (WhatsApp, etc.) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleNativeShare(e, group)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Dropdown für App-internes Teilen */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleInternalShare('chat', e, group)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              <span>An Chat senden</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleInternalShare('group', e, group)}>
                              <Users className="h-4 w-4 mr-2" />
                              <span>In Gruppe teilen</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div>
                        {/* Details-Button */}
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLocation(`/groups/${group.id}`);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
        </div>
      </div>
      
      {/* ShareDialog für App-internes Teilen */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        type={shareType}
        title={shareType === 'chat' ? 'An Chat senden' : 'In Gruppe teilen'}
        onShare={handleShare}
        content={sharedContent}
      />
    </>
  );
};

export default GroupCarousel;