
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Crown, Heart, Share2, Users, Trophy, Package, RefreshCw, Check, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { usePostStore } from "../lib/postStore";
import { getChatId, getChatIdSync } from "../lib/chatService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import GroupCarousel from "@/components/GroupCarousel";
import { UserAvatar } from "@/components/UserAvatar";
import ProductSlider from "@/components/ProductSlider";
import { useGroupStore } from "../lib/groupStore";
import { useChallengeStore, createInitialChallenges } from "../lib/challengeStore";
import { useProductStore, loadInitialProducts } from "../lib/productStore";
import { useToast } from "@/hooks/use-toast";


const format = (date: Date, formatStr: string) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  
  // Stores verwenden statt mockDaten
  const postStore = usePostStore();
  const groupStore = useGroupStore();
  const challengeStore = useChallengeStore();
  const productStore = useProductStore();
  
  // Synchronisieren der Challenges mit der Datenbank
  const syncWithServer = async (showNotification = false) => {
    setSyncing(true);
    setSyncComplete(false);
    
    try {
      await challengeStore.syncWithServer();
      
      setSyncComplete(true);
      
      // Zeige nur eine Benachrichtigung, wenn explizit gewünscht (z.B. bei manuellem Refresh)
      if (showNotification) {
        toast({
          title: "Synchronisierung erfolgreich",
          description: "Alle Challenges wurden erfolgreich aktualisiert.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Synchronisierung:", error);
      
      // Fehler immer anzeigen
      toast({
        title: "Synchronisierungsfehler",
        description: "Die Daten konnten nicht mit dem Server synchronisiert werden.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
      // Nach 3 Sekunden den Erfolgs-Indikator ausblenden
      setTimeout(() => {
        setSyncComplete(false);
      }, 3000);
    }
  };
  
  // Synchronisiere Daten mit dem Server beim ersten Rendern - Optimiert
  useEffect(() => {
    // Wir verwenden ein Flag, um zu verhindern, dass mehrere Anfragen gleichzeitig laufen
    let isMounted = true;
    let isLoading = false;
    
    // Lade alle Daten synchronisiert vom Server mit Fehlerbehandlung
    const loadAllData = async () => {
      // Verhindere mehrfache gleichzeitige Ladevorgänge
      if (isLoading || !isMounted) return;
      
      isLoading = true;
      
      try {
        // Lade nur die wesentlichen Daten sofort
        const postsPromise = postStore.loadStoredPosts().catch(e => {
          console.error("Fehler beim Laden der Posts:", e);
          return null;
        });
        
        const groupsPromise = groupStore.syncWithServer().catch(e => {
          console.error("Fehler beim Laden der Gruppen:", e);
          return null;
        });
        
        // Warte auf die wichtigsten Daten
        await Promise.all([postsPromise, groupsPromise]);
        
        // Lade dann die restlichen Daten, wenn die Komponente noch montiert ist
        if (isMounted) {
          try {
            await loadInitialProducts();
            await syncWithServer();
          } catch (e) {
            console.error("Fehler beim Laden sekundärer Daten:", e);
          }
        }
      } catch (error) {
        // Allgemeine Fehlerbehandlung
        console.error("Fehler beim Laden der Daten:", error);
      } finally {
        isLoading = false;
      }
    };
    
    // Handler für direkt gelöschte Posts 
    const handlePostDeleted = (event: CustomEvent) => {
      console.log("Home: Erkenne gelöschten Post", event.detail);
      
      // Stelle sicher, dass wir die Posts aktualisieren
      if (isMounted && !isLoading) {
        postStore.loadStoredPosts().catch(e => {
          console.warn("Fehler beim Aktualisieren nach Post-Löschung:", e);
        });
      }
    };
    
    // Handler für erzwungene Synchronisierung aller gelöschten Posts
    const handleForcedSync = (event: CustomEvent) => {
      console.log("Home: Erzwungene Synchronisierung der gelöschten Posts", event.detail);
      
      if (isMounted && !isLoading) {
        // Stelle sicher, dass vollständige Neusynchronisierung durchgeführt wird
        console.log("Starte vollständige Neusynchronisierung aufgrund von force-deleted-posts-sync");
        postStore.loadStoredPosts().catch(e => {
          console.warn("Fehler bei der erzwungenen Synchronisierung:", e);
        });
      }
    };
    
    // Event-Listener für einzelne Löschvorgänge
    window.addEventListener('post-deleted', handlePostDeleted as EventListener);
    
    // Event-Listener für erzwungene Synchronisierung
    window.addEventListener('force-deleted-posts-sync', handleForcedSync as EventListener);
    
    // Initialer Ladevorgang
    loadAllData();
    
    // Automatische Aktualisierung alle 15 Sekunden
    // Häufigere Aktualisierung für bessere Echtzeit-Erfahrung
    const intervalId = setInterval(() => {
      if (!isLoading && isMounted) {
        // Sanfte Aktualisierung ohne Fehlerwerfen
        console.log("Automatische Aktualisierung der Posts und Gruppen (15s-Intervall)");
        postStore.loadStoredPosts().catch(e => console.warn("Update-Fehler:", e));
        groupStore.syncWithServer(false).catch(e => console.warn("Update-Fehler:", e));
      }
    }, 15000); // Aktualisierung alle 15 Sekunden
    
    // Bereinige beim Unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('post-deleted', handlePostDeleted as EventListener);
      window.removeEventListener('force-deleted-posts-sync', handleForcedSync as EventListener);
    };
  }, []);
  
  // Vereinfachter Zugriff auf Gruppen ohne redundantes Logging
  const allGroups = useMemo(() => {
    return Object.values(groupStore.groups);
  }, [groupStore.groups]);
  
  // Entferne intensives Debug-Logging im Produktionsmodus
  if (process.env.NODE_ENV === 'development') {
    console.debug("Gruppen nach ID:", allGroups.map((g: any) => g.id).join(", "));
  }
  
  // Alle Gruppen ohne Filterung verwenden
  const groups = allGroups;
  
  // Hole aktive und bevorstehende Challenges, sortiere nach Startdatum (neueste zuerst)
  const challenges = challengeStore.getActiveChallenges()
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const products = Object.values(productStore.products);
  
  // Verwende alle aktiven und bevorstehenden Challenges
  const activeChallenges = challenges;
  
  // Berechne das Datum der letzten Synchronisierung
  const lastSyncTime = challengeStore.lastFetched ? 
    new Date(challengeStore.lastFetched).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Noch nie';

  // Zusätzlicher Status für erzwungene Neurendering
  const [forceRender, setForceRender] = useState<number>(Date.now());

  // Lade alle Posts und erzwinge neue Ansicht, wenn sich forceRender ändert
  useEffect(() => {
    console.log("Home: Erzwungene Neuladung der Posts durch State-Änderung", new Date().toISOString());
    
    // Direkt auf den neuesten Server-Stand bringen mit Timeout, um Rendern zu ermöglichen
    const loadPosts = async () => {
      try {
        // Hole Posts mit Nocache-Parameter, um Caching zu verhindern
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/posts?nocache=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Posts: ${response.status}`);
        }
        
        const freshPosts = await response.json();
        console.log(`Home: ${freshPosts.length} Posts direkt vom Server geladen`, 
          freshPosts.map((p: any) => p.id));
          
        // Manuelles Update des Post-Stores
        await postStore.loadStoredPosts();
        
        // Force-Render nicht direkt erneut auslösen, um Rekursion zu vermeiden
        console.log("Home: Posts neu geladen, Status aktualisiert");
      } catch (error) {
        console.error("Fehler beim Neuladen der Posts:", error);
      }
    };
    
    loadPosts();
  }, [forceRender]);

  // Behandle POST-Event von der FeedPost-Komponente
  useEffect(() => {
    const handlePostEvent = (event: CustomEvent) => {
      console.log("Home: Post-Event empfangen", event.detail);
      setForceRender(Date.now());
    };
    
    window.addEventListener('post-created', handlePostEvent as EventListener);
    window.addEventListener('post-updated', handlePostEvent as EventListener);
    window.addEventListener('post-deleted', handlePostEvent as EventListener);
    
    return () => {
      window.removeEventListener('post-created', handlePostEvent as EventListener);
      window.removeEventListener('post-updated', handlePostEvent as EventListener);
      window.removeEventListener('post-deleted', handlePostEvent as EventListener);
    };
  }, []);
  
  // HIER: Direkter API-Aufruf für die neuesten Beiträge
  const [directApiPosts, setDirectApiPosts] = useState<any[]>([]);
  
  // Immer direkt die neuesten Posts laden, wenn die Komponente geladen wird
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        // Anti-Cache-Parameter
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/posts?nocache=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Home.tsx: Direkt geladene Posts:", data.map((p: any) => p.id));
          setDirectApiPosts(data);
        }
      } catch (error) {
        console.error("Fehler beim direkten Laden der Posts:", error);
      }
    };
    
    fetchLatestPosts();
  }, [forceRender]); // Bei forceRender neu laden
  
  // Lade Posts aus dem postStore mit verbesserter Filterung und Sortierung
  const allPosts = directApiPosts.length > 0 
    ? directApiPosts // API-Posts zuerst verwenden, wenn verfügbar!
    : Object.values(postStore.posts)
        .filter(post => post !== null && post !== undefined)
        .sort((a, b) => {
          // Stelle sicher, dass beide Daten korrekt als Date-Objekte behandelt werden
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          // Sortiere absteigend (neueste zuerst)
          return dateB.getTime() - dateA.getTime();
        });
  
  // Debugging: Protokolliere die aktuelle Post-Sammlung mit IDs
  console.log("Aktuelle Posts in Home.tsx:", 
    allPosts.map((p: any) => ({id: p.id, content: p.content.substring(0, 15)})), 
    "Anzahl:", allPosts.length,
    "API-Posts:", directApiPosts.length);
  
  // Für ältere Browser fallback, wenn die Sortierung nicht funktioniert
  if (allPosts.length === 0) {
    console.warn("Keine Posts gefunden! API gibt aber", Object.keys(postStore.posts).length, "Posts zurück");
    
    // Erneut versuchen, Posts direkt von der API zu laden und als Array zu konvertieren
    console.log("Versuche direkte Konvertierung von API-Daten...");
    
    // Trigger für Neuladen nach einer kurzen Verzögerung
    setTimeout(() => setForceRender(Date.now()), 500);
  }

  const navigateToGroupChat = (groupId: number) => {
    // Verwende die SYNCHRONE Funktion statt der asynchronen
    const chatId = getChatIdSync(groupId, 'group');
    console.log("Navigating to group chat with ID:", chatId);
    setLocation(`/chat/${chatId}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Synchronisierung läuft jetzt im Hintergrund ohne Benutzeroberfläche */}
      
      {/* Marketing Banner */}
      <section className="mb-12">
        <Card className="relative aspect-square overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format"
            alt="Summer Fitness Challenge"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            <span className="text-sm font-semibold uppercase tracking-wider mb-2">Limitiertes Angebot</span>
            <h1 className="text-3xl font-bold mb-4">Summer Body Challenge 2025</h1>
            <p className="text-lg mb-6 text-white/90">Starte jetzt deine Fitness-Journey mit unserem 12-Wochen Programm.</p>
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="default"
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => setLocation("/challenges")}
              >
                Jetzt teilnehmen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white hover:bg-white/90 text-black border-white"
                onClick={() => setLocation("/events/1")}
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Events & Kurse */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Events & Kurse</h2>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <EventSlider />
      </section>

      {/* Neue Mitglieder */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neue Mitglieder</h2>
          <Link href="/members" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Mitglieder <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <UserSlider />
      </section>

      {/* Beliebte Gruppen */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Beliebte Gruppen</h2>
          <Link href="/groups" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Gruppen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* Mobile: Karussell-Layout */}
        <div className="block md:hidden">
          <GroupCarousel groups={groups} />
        </div>
        {/* Desktop-Ansicht: Grid-Layout statt Karussell */}
        <div className="hidden md:block">
          {/* Debug-Info entfernt */}
          
          {/* Wenn keine Gruppen geladen sind, zeigen wir eine Lade-Animation */}
          {groups.length === 0 ? (
            <div className="mb-6">
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 mt-0.5 text-amber-500 animate-spin" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Gruppen werden geladen</p>
                    <p className="text-sm text-muted-foreground">
                      Bitte einen Moment Geduld, während alle Gruppen geladen werden.
                    </p>
                  </div>
                </div>
              </Alert>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Hier wichtig: Stellen Sie sicher, dass ALLE Gruppen angezeigt werden */}
              {/* Erzwinge Anzeige aller Gruppen auf dem Desktop mit key={forceRender} */}
              {groups.map((group: any) => {
                const chatId = getChatIdSync(group.id, 'group');
                const isJoined = groupStore.isGroupMember(group.id, 1);
                
                // Hier wird jede einzelne Gruppe angezeigt
                console.debug(`Rendering desktop group card: ${group.id} - ${group.name}`); 
                
                return (
                  <Card 
                    key={`group-${group.id}`}
                    className="overflow-hidden cursor-pointer bg-card hover:bg-accent/5 transition-colors"
                    onClick={() => setLocation(`/chat/${chatId}`)}
                  >
                    <div className="aspect-[3/2] relative overflow-hidden bg-muted">
                      <img
                        src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                        alt={group.name}
                        className="w-full h-full object-cover"
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isJoined) {
                              groupStore.leaveGroup(group.id, 1);
                              toast({
                                title: "Gruppe verlassen",
                                description: "Du hast die Gruppe erfolgreich verlassen.",
                              });
                            } else {
                              groupStore.joinGroup(group.id, 1);
                              toast({
                                title: "Gruppe beigetreten",
                                description: "Du bist der Gruppe erfolgreich beigetreten.",
                              });
                              setLocation(`/chat/${chatId}`);
                            }
                          }}
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
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Shop</h2>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Produkte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductSlider products={products as any} />
      </section>

      {/* Aktive Challenges - Hervorgehobenes Design */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Aktive Challenges</h2>
          </div>
          <Link href="/challenges" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Challenges <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile: Karussell-Layout */}
        <div className="block md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {activeChallenges.map((challenge: any) => (
                <CarouselItem key={challenge.id} className="pl-2 basis-[80%]">
                  <ChallengeCard challenge={challenge} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: Grid-Layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.slice(0, 6).map((challenge: any) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>

      {/* Feed - KOMPLETT ÜBERARBEITET */}
      <section className="mb-20 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Neueste Beiträge</h2>
            {/* Aktualisieren-Button entfernt - Updates erfolgen automatisch im Hintergrund */}
          </div>
          
          <Button
            size="sm"
            variant="default"
            onClick={() => setLocation("/create/post")}
            className="h-8 px-3"
          >
            Beitrag erstellen <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* KOMPLETT NEUER ANSATZ FÜR FEED */}
        <div className="space-y-4 pb-20 mb-20">
          {(() => {
            // Sofortiger Aufruf einer Funktion für bessere Kontrolle
            
            // Keine Beiträge vorhanden - lade automatisch
            if (!directApiPosts || directApiPosts.length === 0) {
              // Automatisch neu laden
              setTimeout(() => {
                const timestamp = Date.now();
                fetch(`/api/posts?force=${timestamp}`, {
                  headers: {
                    'Cache-Control': 'no-cache'
                  }
                })
                .then(res => res.json())
                .then(data => {
                  console.log("Auto-Lade-Ergebnis:", data.length);
                  setDirectApiPosts(data);
                  setForceRender(Date.now());
                })
                .catch(e => console.error("Auto-Lade-Fehler:", e));
              }, 500);
              
              return (
                <div className="text-center text-muted-foreground py-8">
                  <div className="mb-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                  <p>Beiträge werden geladen...</p>
                </div>
              );
            }
            
            // Sortiere die Beiträge nach Datum absteigend (neueste zuerst)
            const sortedPosts = [...directApiPosts].sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            // Gib Feedback mit der Anzahl
            console.log("Sortierte Posts für Feed:", sortedPosts.length);
            
            // Ergebnis darstellen
            return (
              <div>
                {/* Minimale Statusanzeige ohne manuellen Aktualisierungsbutton */}
                <div className="mb-4 text-sm text-muted-foreground">
                  <span>{sortedPosts.length} Beiträge</span>
                </div>

                {/* Container mit höherem z-Index und Abstand */}
                <div className="space-y-4 pb-16" style={{minHeight: "800px", position: "relative", zIndex: 10}}>
                  {sortedPosts.map((post, index) => (
                    <div 
                      key={`post-${post.id}-${index}-${forceRender}`} 
                      className="mb-6 max-w-xl mx-auto"
                    >
                      <FeedPost post={post} />
                    </div>
                  ))}
                </div>
                
                {/* Platzhalter mit Hinweis, dass automatisch aktualisiert wird */}
                <div className="flex flex-col items-center justify-center mt-8 pb-20 text-xs text-muted-foreground">
                  <p>Beiträge werden automatisch aktualisiert</p>
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}