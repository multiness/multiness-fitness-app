import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@shared/schema";
import { format } from "date-fns";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;

  return (
    <Card className="overflow-hidden">
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
        <div className="text-xs text-muted-foreground">
          {format(challenge.startDate, "MMM d")} - {format(challenge.endDate, "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}
