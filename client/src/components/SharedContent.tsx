import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, ArrowRight, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { usePostStore } from "../lib/postStore";

interface SharedContentProps {
  content: {
    type: 'challenge' | 'event' | 'post';
    id: number;
    title: string;
    preview?: string;
    image?: string;
    location?: string;
    description?: string;
  };
}

export default function SharedContent({ content }: SharedContentProps) {
  const [, setLocation] = useLocation();
  const { users } = useUsers();
  const groupStore = useGroupStore();
  const postStore = usePostStore();

  // Hole die tatsächlichen Teilnehmer basierend auf dem Typ
  const getParticipants = () => {
    if (content.type === 'challenge') {
      return users.filter(u => groupStore.isGroupParticipant(content.id, u.id));
    } else if (content.type === 'event') {
      // Verwende die Event-Teilnehmer aus dem entsprechenden Store
      return users.slice(0, Math.floor(Math.random() * 5) + 3); // Temporär, bis Event-Store implementiert ist
    } else {
      // Für Posts, zeige Likes oder Kommentare
      const postLikes = postStore.getLikes(content.id);
      return users.filter(u => postLikes.includes(u.id));
    }
  };

  const participants = getParticipants();

  const handleClick = () => {
    const route = content.type === 'challenge' ? 'challenges' :
                 content.type === 'event' ? 'events' : 'posts';
    setLocation(`/${route}/${content.id}`);
  };

  if (content.type === 'event') {
    return (
      <Card className="cursor-pointer overflow-hidden hover:bg-muted/50 transition-all" onClick={handleClick}>
        <CardContent className="p-0">
          {/* Event Image */}
          <div className="relative aspect-[16/9]">
            <img
              src={content.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge className="absolute top-3 right-3">
              Event
            </Badge>
          </div>

          {/* Event Info */}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{content.title}</h3>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{content.preview}</span>
              </div>
              {content.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{content.location}</span>
                </div>
              )}
              {content.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content.description}
                </p>
              )}
            </div>

            {/* Participants */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((user, i) => (
                    <UserAvatar
                      key={i}
                      userId={user.id}
                      size="sm"
                      className="-ml-2 first:ml-0"
                    />
                  ))}
                </div>
                {participants.length > 3 && (
                  <span className="text-sm text-muted-foreground">
                    +{participants.length - 3} weitere
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{participants.length} Teilnehmer</span>
              </div>
            </div>

            {/* Call to Action */}
            <Button 
              className="w-full group" 
              variant="default"
            >
              <span className="mr-2">Jetzt teilnehmen und dabei sein</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Challenge Card Design
  return (
    <Card className="cursor-pointer overflow-hidden hover:bg-muted/50 transition-all" onClick={handleClick}>
      <CardContent className="p-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              Neue Challenge
            </Badge>
          </div>
          <h3 className="text-lg font-semibold mb-1">{content.title}</h3>
          {content.preview && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {content.preview}
            </p>
          )}
        </div>

        {/* Social Proof Section */}
        <div className="p-4 bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((user, i) => (
                  <UserAvatar
                    key={i}
                    userId={user.id}
                    size="sm"
                    className="-ml-2 first:ml-0"
                  />
                ))}
              </div>
              {participants.length > 3 && (
                <span className="text-sm text-muted-foreground">
                  +{participants.length - 3} weitere
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} Teilnehmer</span>
            </div>
          </div>

          {/* Call to Action */}
          <Button 
            className="w-full group" 
            variant="default"
          >
            <span className="mr-2">Sei dabei und starte die Challenge</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}