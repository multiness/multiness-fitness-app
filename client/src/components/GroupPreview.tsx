import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Group } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GroupPreviewProps {
  group: Group;
}

export default function GroupPreview({ group }: GroupPreviewProps) {
  const creator = mockUsers.find(u => u.id === group.creatorId);
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);
  const [isJoined, setIsJoined] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setIsJoined(!isJoined);
    toast({
      title: isJoined ? "Gruppe verlassen" : "Gruppe beigetreten",
      description: isJoined 
        ? "Du hast die Gruppe erfolgreich verlassen."
        : "Du bist der Gruppe erfolgreich beigetreten.",
    });

    // Wenn der Benutzer beitritt, direkt zur Gruppenseite navigieren
    if (!isJoined) {
      setLocation(`/groups/${group.id}`);
    }
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <img
            src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
            alt={group.name}
            className="w-full h-32 object-cover"
          />
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-2">{group.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {group.description}
          </p>

          {/* Creator Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator?.avatar || undefined} />
              <AvatarFallback>{creator?.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Created by {creator?.username}
            </span>
          </div>

          {/* Participants Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((user, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                {participants.length} Mitglieder
              </span>
            </div>
            <Button
              variant={isJoined ? "outline" : "default"}
              size="sm"
              onClick={handleJoin}
              className="ml-2"
            >
              {isJoined ? "Verlassen" : "Beitreten"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}