import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Gift, Trophy } from "lucide-react";
import { mockUsers } from "../data/mockData";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;
  const creator = mockUsers.find(u => u.id === challenge.creatorId);

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
              {isActive ? "Active" : "Ended"}
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
        </CardContent>
      </Card>
    </Link>
  );
}