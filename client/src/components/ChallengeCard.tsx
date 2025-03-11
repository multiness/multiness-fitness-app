import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Gift } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;

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

          {/* Prize Section */}
          <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
            <Gift className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium text-sm">{challenge.prize}</div>
              <div className="text-xs text-muted-foreground">{challenge.prizeDescription}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}