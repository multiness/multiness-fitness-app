import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { Crown, Heart, Share2, Users } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { UserAvatar } from "./UserAvatar";

interface ChallengeCardProps {
  challenge: any;
  variant?: "compact" | "full";
}

export default function ChallengeCard({ challenge, variant = "full" }: ChallengeCardProps) {
  const creator = mockUsers.find(u => u.id === challenge.creatorId);
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);
  const currentDate = new Date();
  const isActive = currentDate >= challenge.startDate && currentDate <= challenge.endDate;

  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-primary/10 hover:border-primary/20">
      <CardHeader className="p-0 relative aspect-[16/9]">
        <img
          src={challenge.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
          alt={challenge.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {isActive ? "Aktiv" : "Beendet"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            {/* Creator Info */}
            <div className="flex items-center gap-2 mb-2">
              {creator && (
                <UserAvatar
                  userId={creator.id}
                  size="sm"
                />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{creator?.username}</div>
                <div className="text-xs text-muted-foreground">
                  Endet am {format(new Date(challenge.endDate), "dd.MM.yyyy")}
                </div>
              </div>
            </div>

            <h3 className="font-medium text-sm mb-2">{challenge.title}</h3>

            {/* Participants Preview */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((user, i) => (
                  <UserAvatar
                    key={i}
                    userId={user.id}
                    size="xs"
                    className="-ml-2 first:ml-0 border-2 border-background"
                  />
                ))}
                {participants.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium -ml-2 border-2 border-background">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {participants.length} Teilnehmer
              </span>
            </div>

            {/* Top 3 Ranking */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {[1, 2, 3].map(rank => (
                <div key={rank} className="flex items-center gap-1 bg-muted rounded p-1">
                  <div className="relative">
                    {rank === 1 && <Crown className="absolute -top-1 -left-1 h-3 w-3 text-yellow-400" />}
                    {rank === 2 && <Crown className="absolute -top-1 -left-1 h-3 w-3 text-gray-400" />}
                    {rank === 3 && <Crown className="absolute -top-1 -left-1 h-3 w-3 text-amber-700" />}
                    <UserAvatar
                      userId={mockUsers[rank]?.id || 0}
                      size="xs"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{mockUsers[rank]?.username}</p>
                    <p className="text-[10px] text-muted-foreground">{1000 - (rank * 50)}P</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/challenges/${challenge.id}`}>
                <Button size="sm">
                  Challenge beitreten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}