import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Challenge } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Gift, Trophy, Users } from "lucide-react";
import { mockUsers } from "../data/mockData";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;
  const creator = mockUsers.find(u => u.id === challenge.creatorId);
  // Simuliere Teilnehmer (in einer echten App würde dies aus der DB kommen)
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <img
            src={challenge.image}
            alt={challenge.title}
            className="w-full h-32 object-cover"
          />
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Aktiv" : "Beendet"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {challenge.description}
          </p>
          <div className="text-xs text-muted-foreground mb-3">
            {format(challenge.startDate, "MMM d")} - {format(challenge.endDate, "MMM d, yyyy")}
          </div>

          {/* Prize Preview */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            <span>{challenge.prize}</span>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Created by <span className="font-medium">{creator?.username}</span>
            </span>
          </div>

          {/* Participants Preview */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
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
              {participants.length} Teilnehmer
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}