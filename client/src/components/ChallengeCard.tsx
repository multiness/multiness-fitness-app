import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { Crown, Heart, Share2, Users, CheckCircle } from "lucide-react";
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
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          {/* Header with Status and Creator */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {creator && (
                <>
                  <UserAvatar
                    userId={creator.id}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{creator?.username}</span>
                      {creator.isVerified && (
                        <CheckCircle className="h-3.5 w-3.5 text-primary fill-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Endet am {format(new Date(challenge.endDate), "dd.MM.yyyy")}
                    </span>
                  </div>
                </>
              )}
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Aktiv" : "Beendet"}
            </Badge>
          </div>

          {/* Challenge Title */}
          <h3 className="text-base font-semibold mb-3">{challenge.title}</h3>

          {/* Participants Section */}
          <div className="flex items-center gap-2 mb-4">
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

          {/* Top 3 Ranking */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3].map(rank => {
              const medalColor = 
                rank === 1 ? "text-yellow-400" :
                rank === 2 ? "text-gray-400" :
                "text-amber-700";

              return (
                <div key={rank} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                  <div className="relative">
                    <Crown className={`absolute -top-1 -left-1 h-4 w-4 ${medalColor}`} />
                    <UserAvatar
                      userId={mockUsers[rank]?.id || 0}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{mockUsers[rank]?.username}</p>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-medium ${medalColor}`}>#{rank}</span>
                      <span className="text-xs text-muted-foreground">{1000 - (rank * 50)}P</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-auto pt-2 border-t">
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
      </CardContent>
    </Card>
  );
}