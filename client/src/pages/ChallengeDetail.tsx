import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, Timer, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { mockChallenges, mockUsers } from "../data/mockData";

export default function ChallengeDetail() {
  const { id } = useParams();
  const challenge = mockChallenges.find(c => c.id === parseInt(id || ""));
  const creator = challenge ? mockUsers.find(u => u.id === challenge.creatorId) : null;

  if (!challenge || !creator) return <div>Challenge not found</div>;

  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;

  return (
    <div className="container max-w-2xl mx-auto p-4">
      {/* Challenge Header */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
        <img
          src={challenge.image}
          alt={challenge.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant={isActive ? "default" : "secondary"} className="mb-2">
            {isActive ? "Active" : "Ended"}
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">{challenge.title}</h1>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(challenge.startDate, "MMM d")} - {format(challenge.endDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={creator.avatar} />
            <AvatarFallback>{creator.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{creator.name}</div>
            <div className="text-sm text-muted-foreground">@{creator.username}</div>
          </div>
          <Button variant="secondary" className="ml-auto">Follow</Button>
        </CardContent>
      </Card>

      {/* Challenge Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>About this Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{challenge.description}</p>
        </CardContent>
      </Card>

      {/* Prize Details */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle>Prize</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {challenge.prizeImage && (
              <img
                src={challenge.prizeImage}
                alt={challenge.prize}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg mb-1">{challenge.prize}</h3>
              <p className="text-muted-foreground">{challenge.prizeDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participation Button */}
      <Button className="w-full" size="lg">
        Join Challenge
      </Button>
    </div>
  );
}
