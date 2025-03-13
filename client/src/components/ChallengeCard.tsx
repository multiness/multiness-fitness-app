import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Crown, Heart, Share2, Users, Trophy, Gift } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";

interface ChallengeCardProps {
  challenge: Challenge;
  variant?: "compact" | "full";
}

export default function ChallengeCard({ challenge, variant = "full" }: ChallengeCardProps) {
  const currentDate = new Date();
  const isActive = currentDate >= challenge.startDate && currentDate <= challenge.endDate;
  const isEnded = currentDate > challenge.endDate;
  const creator = mockUsers.find(u => u.id === challenge.creatorId);
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);

  // Für beendete Challenges
  const winners = isEnded ? participants.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3) : [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <CardContent className="p-4">
        {/* Challenge Info Section */}
        <div className="flex items-start gap-3 mb-4">
          {creator && (
            <UserAvatar
              userId={creator.id}
              avatar={creator.avatar}
              username={creator.username}
              size="sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{creator?.username}</p>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Aktiv" : "Beendet"}
              </Badge>
            </div>
            <h3 className="text-lg font-bold truncate">{challenge.title}</h3>
            <p className="text-sm text-muted-foreground">
              {isEnded ? "Beendet am" : "Endet am"} {format(challenge.endDate, "dd.MM.yyyy")}
            </p>
          </div>
        </div>

        {/* Conditional Content based on Challenge Status */}
        {isEnded ? (
          // Gewinner Anzeige für beendete Challenges
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Gewinner</span>
            </div>
            <div className="space-y-2">
              {winners.map((winner, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                    <UserAvatar
                      userId={winner.id}
                      avatar={winner.avatar}
                      username={winner.username}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{winner.username}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {index === 0 && (
                      <>
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">Gewinner</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Aktive Teilnehmer & Stats für laufende Challenges
          <div className="bg-card rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((user, i) => (
                    <UserAvatar
                      key={i}
                      userId={user.id}
                      avatar={user.avatar}
                      username={user.username}
                      size="sm"
                      className="border-2 border-background"
                    />
                  ))}
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{participants.length - 3}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {participants.length} Teilnehmer
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Top 3 Ranking */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(rank => (
                <div key={rank} className="flex items-center gap-2 bg-muted rounded-md p-2">
                  <div className="relative">
                    {rank === 1 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-yellow-400" />}
                    {rank === 2 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-gray-400" />}
                    {rank === 3 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-amber-700" />}
                    <UserAvatar
                      userId={mockUsers[rank]?.id || 0}
                      avatar={mockUsers[rank]?.avatar}
                      username={mockUsers[rank]?.username || ''}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{mockUsers[rank]?.username}</p>
                    <p className="text-xs text-muted-foreground">{1000 - (rank * 50)} Punkte</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Challenge Image */}
        {variant === "full" && challenge.image && (
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <img
              src={challenge.image}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Image Placeholder for Full Variant */}
        {variant === "full" && !challenge.image && (
          <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted flex items-center justify-center">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Kein Bild verfügbar</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="default"
          className="w-full mt-4"
          asChild
        >
          <Link href={`/challenges/${challenge.id}`}>
            {isEnded ? "Details anzeigen" : "Challenge beitreten"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}