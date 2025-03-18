import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users } from "lucide-react";
import { useLocation } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { mockUsers } from "../data/mockData";

interface SharedContentProps {
  content: {
    type: 'challenge' | 'event' | 'post';
    id: number;
    title: string;
    preview?: string;
  };
}

export default function SharedContent({ content }: SharedContentProps) {
  const [, setLocation] = useLocation();
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);

  const handleClick = () => {
    const route = content.type === 'challenge' ? 'challenges' :
                 content.type === 'event' ? 'events' : 'posts';
    setLocation(`/${route}/${content.id}`);
  };

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          {/* Header mit Icon und Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {content.type === 'challenge' && <Trophy className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <h4 className="text-sm font-medium">{content.title}</h4>
                {content.preview && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {content.preview}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Challenge
            </Badge>
          </div>

          {/* Teilnehmer */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((user, i) => (
                <UserAvatar
                  key={i}
                  userId={user.id}
                  size="sm"
                  className="-ml-2 first:ml-0"
                />
              ))}
              {participants.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium -ml-2">
                  +{participants.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participants.length} Teilnehmer
            </span>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs">
              Challenge öffnen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}