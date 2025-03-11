import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Plus, Pin } from "lucide-react";
import GroupPreview from "@/components/GroupPreview";
import { mockGroups } from "../data/mockData";
import { Link } from "wouter";
import { useUsers } from "../contexts/UserContext";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser } = useUsers();
  const [groups, setGroups] = useState(mockGroups);

  // Featured Group wird als erste Gruppe angezeigt
  const featuredGroup = groups.find(g => g.isFeatured);
  const regularGroups = groups.filter(g => !g.isFeatured);

  const handleToggleFeatured = (groupId: number) => {
    setGroups(prevGroups => {
      // Entferne den Featured-Status von allen anderen Gruppen
      const updatedGroups = prevGroups.map(g => ({
        ...g,
        isFeatured: false
      }));

      // Setze den Featured-Status für die ausgewählte Gruppe
      const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
      if (groupIndex !== -1) {
        updatedGroups[groupIndex].isFeatured = true;
      }

      return updatedGroups;
    });
  };

  const filteredGroups = regularGroups.filter(group =>
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
      {featuredGroup && (
        <div className="relative mb-6 rounded-lg overflow-hidden group">
          <img
            src={featuredGroup.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format"}
            alt={featuredGroup.name}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {featuredGroup.name}
                <Pin className="h-4 w-4 text-primary" />
              </h2>
              {currentUser?.isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleFeatured(featuredGroup.id)}
                >
                  Featured entfernen
                </Button>
              )}
            </div>
            <p className="text-white/90 mb-4">{featuredGroup.description}</p>
            <Button variant="secondary">
              <Users className="h-4 w-4 mr-2" />
              Gruppe beitreten
            </Button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredGroups.map(group => (
            <div key={group.id} className="relative">
              <GroupPreview group={group} />
              {currentUser?.isAdmin && !group.isFeatured && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  onClick={() => handleToggleFeatured(group.id)}
                >
                  <Pin className="h-4 w-4 mr-1" />
                  Featured
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}