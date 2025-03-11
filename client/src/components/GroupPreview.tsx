import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Group } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";
import { Globe, Lock, Users } from "lucide-react";

interface GroupPreviewProps {
  group: Group;
}

export default function GroupPreview({ group }: GroupPreviewProps) {
  const creator = mockUsers.find(u => u.id === group.creatorId);
  // Simuliere Teilnehmer (in einer echten App würde dies aus der DB kommen)
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);
  const isPrivate = Math.random() > 0.5; // Simuliert private/öffentliche Gruppen

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <img
            src={group.image}
            alt={group.name}
            className="w-full h-32 object-cover"
          />
          <Badge 
            variant={isPrivate ? "secondary" : "default"}
            className="absolute top-2 right-2 flex items-center gap-1"
          >
            {isPrivate ? (
              <>
                <Lock className="h-3 w-3" />
                Privat
              </>
            ) : (
              <>
                <Globe className="h-3 w-3" />
                Öffentlich
              </>
            )}
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg mb-2">{group.name}</CardTitle>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {group.description}
          </p>

          {/* Creator Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator?.avatar} />
              <AvatarFallback>{creator?.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Created by {creator?.username}
            </span>
          </div>

          {/* Participants Preview */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((user, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={user.avatar} />
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
        </CardContent>
      </Card>
    </Link>
  );
}