import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { Crown, Share2, Users, CheckCircle, MessageCircle } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { UserAvatar } from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareDialog from "./ShareDialog";

interface ChallengeCardProps {
  challenge: any;
  variant?: "compact" | "full";
}

export default function ChallengeCard({ challenge, variant = "full" }: ChallengeCardProps) {
  const creator = mockUsers.find(u => u.id === challenge.creatorId);
  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);
  const currentDate = new Date();
  const isActive = currentDate >= challenge.startDate && currentDate <= challenge.endDate;

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'chat' | 'group'>('chat');

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shareData = {
      title: challenge.title,
      text: `Schau dir diese Challenge an: ${challenge.title}`,
      url: `${window.location.origin}/challenges/${challenge.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback für Browser ohne Web Share API
        const url = `${window.location.origin}/challenges/${challenge.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${challenge.title} - ${url}`)}`);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleInternalShare = (type: 'chat' | 'group', e: React.MouseEvent) => {
    e.preventDefault();
    setShareType(type);
    setShareDialogOpen(true);
  };

  const handleShare = (id: number) => {
    // TODO: Implement actual sharing logic
    console.log(`Sharing challenge ${challenge.id} to ${shareType} ${id}`);
  };

  return (
    <>
      <Link href={`/challenges/${challenge.id}`}>
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

              {/* Share Buttons */}
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleNativeShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => handleInternalShare('chat', e)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <span>An Chat senden</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleInternalShare('group', e)}>
                      <Users className="h-4 w-4 mr-2" />
                      <span>In Gruppe teilen</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        type={shareType}
        title={shareType === 'chat' ? 'An Chat senden' : 'In Gruppe teilen'}
        onShare={handleShare}
      />
    </>
  );
}