import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Trophy } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import { useChallengeStore } from "../lib/challengeStore";

export default function Challenges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const currentDate = new Date();
  const getAllChallenges = useChallengeStore(state => state.getAllChallenges);
  const challenges = getAllChallenges();

  // Filter challenges based on their dates
  const activeChallenges = challenges.filter(challenge => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    return currentDate >= startDate && currentDate <= endDate;
  });

  const pastChallenges = challenges.filter(challenge => {
    const endDate = new Date(challenge.endDate);
    return currentDate > endDate;
  });

  const futureStartingChallenges = challenges.filter(challenge => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Challenges</h1>
        </div>
        <Button onClick={() => window.location.href = "/create/challenge"}>
          Challenge erstellen
        </Button>
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

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">Aktive & Kommende Challenges</TabsTrigger>
          <TabsTrigger value="past">Vergangene Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid gap-6">
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
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid gap-6">
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