import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Plus } from "lucide-react";
import GroupPreview from "@/components/GroupPreview";
import { mockGroups } from "../data/mockData";
import { Link } from "wouter";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gruppen</h1>
        </div>
        <Button onClick={() => window.location.href = "/create/group"}>
          <Plus className="h-4 w-4 mr-2" />
          Gruppe erstellen
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Nach Gruppen suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Featured Group */}
      <div className="relative mb-6 rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format"
          alt="Featured Group"
          className="w-full h-48 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h2 className="text-xl font-bold mb-1">Featured: Yoga Enthusiasts</h2>
          <p className="text-sm opacity-90 mb-2">Join our growing community of yoga practitioners</p>
          <Button variant="secondary">
            <Users className="h-4 w-4 mr-2" />
            Gruppe beitreten
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredGroups.map(group => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}