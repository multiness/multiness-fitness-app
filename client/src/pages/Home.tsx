
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Crown, Heart, Share2, Users, Trophy, Package, RefreshCw, Check, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { usePostStore } from "../lib/postStore";
import { getChatId } from "../lib/chatService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  
  // Synchronisiere Daten mit dem Server beim ersten Rendern
  useEffect(() => {
    // Lade alle Daten synchronisiert vom Server
    const loadAllData = async () => {
      try {
        console.log("Lade alle Daten vom Server...");
        
        // Synchronisiere Posts
        await postStore.loadStoredPosts();
        
        // Synchronisiere Produkte
        await loadInitialProducts();
        
        // Synchronisiere Gruppen
        await groupStore.syncWithServer();
        
        // Synchronisiere Challenges
        await syncWithServer();
        
        console.log("Alle Daten erfolgreich geladen");
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
      }
    };
    
    loadAllData();
    
    // Setze ein Intervall für regelmäßige Updates (alle 20 Sekunden)
    const intervalId = setInterval(async () => {
      try {
        console.log("Automatische Aktualisierung...");
        
        // Posts aktualisieren
        await postStore.loadStoredPosts();
        
        // Challenges aktualisieren
        await syncWithServer();
        
        // Gruppen aktualisieren mit Erzwingung der Aktualisierung
        await groupStore.syncWithServer(true); // true = forceRefresh
      } catch (error) {
        console.error("Fehler bei der automatischen Aktualisierung:", error);
      }
    }, 15000); // Kürzeres Intervall für häufigere Aktualisierungen
    
    // Bereinige das Intervall beim Unmount der Komponente
    return () => clearInterval(intervalId);
  }, []);
  
  // Lade Daten aus den stores statt aus den mock-Daten
  const groups = Object.values(groupStore.groups);
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

  // Lade Posts aus dem postStore
  const allPosts = Object.values(postStore.posts).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId, 'group');
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
          <GroupCarousel groups={groups.slice(0, 6)} />
        </div>
        {/* Desktop: Grid-Layout mit optimiertem Laden */}
        <div className="hidden md:grid grid-cols-2 gap-4">
          {groups.length === 0 ? (
            // Zeige Skeleton-UI während des Ladens
            <>
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="overflow-hidden bg-card">
                  <div className="aspect-[3/2] relative overflow-hidden bg-muted animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-2/3 bg-muted animate-pulse rounded"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-3 w-10 bg-muted animate-pulse rounded"></div>
                      <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            // Zeige tatsächliche Gruppen, wenn geladen
            groups.slice(0, 4).map(group => (
              <div key={group.id} className="cursor-pointer" onClick={() => navigateToGroupChat(group.id)}>
                <GroupPreview group={group} />
              </div>
            ))
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

      {/* Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neueste Beiträge</h2>
          <Link href="/create/post" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Beitrag erstellen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-6">
          {allPosts.map((post: any) => (
            <div key={post.id} className="w-full max-w-xl mx-auto">
              <FeedPost post={post as any} />
            </div>
          ))}
          {allPosts.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Noch keine Beiträge vorhanden
            </div>
          )}
        </div>
      </section>
    </div>
  );
}