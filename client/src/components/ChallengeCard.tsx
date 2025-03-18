import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { Trophy, Share2, MessageCircle, Users, Timer } from "lucide-react";
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
    console.log(`Sharing challenge ${challenge.id} to ${shareType} ${id}`);
  };

  const sharedContent = {
    type: 'challenge' as const,
    id: challenge.id,
    title: challenge.title,
    preview: `Aktive Challenge bis ${format(new Date(challenge.endDate), "dd.MM.yyyy")}`
  };

  return (
    <>
      <Link href={`/challenges/${challenge.id}`}>
        <Card className="overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-primary/10 hover:border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Aktiv" : "Beendet"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>Endet {format(new Date(challenge.endDate), "dd.MM.")}</span>
                </div>
              </div>

              {/* Challenge Title */}
              <h3 className="text-lg font-semibold mb-3">{challenge.title}</h3>

              {/* Top 3 */}
              <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    userId={participants[0]?.id}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {participants[0]?.username}
                    </p>
                    <p className="text-xs text-yellow-500 font-medium">
                      1. Platz • {1000}P
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {participants.length}
                  </div>
                  <Button size="sm" variant="secondary">Details</Button>
                </div>
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
        content={sharedContent}
      />
    </>
  );
}