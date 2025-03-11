import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import { mockChallenges, mockUsers } from "../data/mockData";

export default function Challenges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const currentDate = new Date();
  const activeChallenges = mockChallenges.filter(
    challenge => currentDate >= challenge.startDate && currentDate <= challenge.endDate
  );
  const pastChallenges = mockChallenges.filter(
    challenge => currentDate > challenge.endDate
  );

  const filteredActiveChallenges = activeChallenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastChallenges = pastChallenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="past">Past Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid gap-4">
              {filteredActiveChallenges.map(challenge => (
                <div key={challenge.id}>
                  <ChallengeCard challenge={challenge} />
                  {/* Leaderboard Preview */}
                  <Card className="mt-2">
                    <CardHeader>
                      <CardTitle className="text-sm">Top Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockUsers.slice(0, 3).map((user, index) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <span className="font-bold">{index + 1}</span>
                            <span>{user.username}</span>
                            <span className="ml-auto text-muted-foreground">
                              {Math.floor(Math.random() * 1000)} points
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="past">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid gap-4">
              {filteredPastChallenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
