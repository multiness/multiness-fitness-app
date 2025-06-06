import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Trophy, Check, Loader2 } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import { useChallengeStore } from "../lib/challengeStore";
import { useLocation } from "wouter";

export default function Challenges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [_, setLocation] = useLocation();
  
  const challengeStore = useChallengeStore();
  const currentDate = new Date();
  
  // Synchronisiere Challenges beim Laden
  useEffect(() => {
    let isMounted = true;
    
    const syncChallenges = async () => {
      if (isMounted) setLoading(true);
      
      try {
        await challengeStore.syncWithServer();
        
        if (isMounted) {
          setLoading(false);
          setSyncComplete(true);
          
          // Nach 2 Sekunden den Sync-Status zurücksetzen
          setTimeout(() => {
            if (isMounted) setSyncComplete(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Fehler bei der Synchronisierung:", error);
        if (isMounted) setLoading(false);
      }
    };
    
    // Sofort synchronisieren
    syncChallenges();
    
    // Alle 30 Sekunden aktualisieren
    const intervalId = setInterval(() => {
      console.log("Challenges werden automatisch aktualisiert...");
      syncChallenges();
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);
  
  // Holen der Challenges direkt aus dem Store mit useEffect, um bei Änderungen zu aktualisieren
  const [allChallenges, setAllChallenges] = useState(Object.values(challengeStore.challenges));
  
  // Aktualisiere die lokale Zustandsvariable, wenn sich Daten im Store ändern
  useEffect(() => {
    setAllChallenges(Object.values(challengeStore.challenges));
    
    // Log zur Überprüfung
    console.log("Challenges in der Challenges.tsx aktualisiert:", 
      Object.values(challengeStore.challenges).length, "Challenges gefunden");
  }, [challengeStore.challenges, challengeStore.lastFetched]);
  
  // Gruppieren der Challenges basierend auf ihrem Status
  const activeChallenges = allChallenges.filter(challenge => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    return currentDate >= startDate && currentDate <= endDate;
  });

  const pastChallenges = allChallenges.filter(challenge => {
    const endDate = new Date(challenge.endDate);
    return currentDate > endDate;
  });

  const futureStartingChallenges = allChallenges.filter(challenge => {
    const startDate = new Date(challenge.startDate);
    return currentDate < startDate;
  });

  // Combine active and future challenges for the active tab
  const allActiveChallenges = [...activeChallenges, ...futureStartingChallenges];

  const filteredActiveChallenges = allActiveChallenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastChallenges = pastChallenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header - für Mobile optimiert */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Challenges</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setLocation("/create/challenge")} 
            className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-sm font-medium"
            size="default"
          >
            Erstellen
          </Button>
          <Button 
            size="icon"
            variant="outline" 
            className="h-10 w-10 flex items-center justify-center"
            onClick={() => challengeStore.syncWithServer()}
            disabled={loading}
            title={loading ? "Aktualisieren..." : syncComplete ? "Aktualisiert" : "Aktualisieren"}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : syncComplete ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Suche nach Challenges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Tabs and Content - für Mobile optimiert */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active" className="px-2 py-1.5 text-xs sm:text-sm truncate">Aktive & Kommende</TabsTrigger>
          <TabsTrigger value="past" className="px-2 py-1.5 text-xs sm:text-sm truncate">Vergangene</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]">
            <div className="grid gap-4 sm:gap-6">
              {filteredActiveChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  variant="full"
                />
              ))}
              {filteredActiveChallenges.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Keine aktiven Challenges gefunden
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="past">
          <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]">
            <div className="grid gap-4 sm:gap-6">
              {filteredPastChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  variant="full"
                />
              ))}
              {filteredPastChallenges.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Keine vergangenen Challenges gefunden
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}