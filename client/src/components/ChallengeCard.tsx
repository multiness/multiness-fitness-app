import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { Trophy, Share2, MessageCircle, Users, Timer } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareDialog from "./ShareDialog";
import { useChallengeStore } from "../lib/challengeStore";

interface ChallengeCardProps {
  challenge: any;
  variant?: "compact" | "full";
}

export default function ChallengeCard({ challenge, variant = "full" }: ChallengeCardProps) {
  const challengeStore = useChallengeStore();
  const { users } = useUsers();
  
  // Holen der echten Teilnehmer für die Challenge aus dem Store
  const actualParticipants = challengeStore.getParticipants(challenge.id);
  const participantCount = challenge.participantIds?.length || actualParticipants.length || 0;
  
  // Erste Person auswählen für die Anzeige - falls vorhanden
  const firstParticipant = actualParticipants.length > 0 ? actualParticipants[0] : null;
  
  // Information über den Ersteller der Challenge
  const creatorId = challenge.creatorId;
  const creator = users.find(user => user.id === creatorId);
  
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

              {/* Challenge Info */}
              <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  {/* Ersteller-Avatar anzeigen */}
                  <UserAvatar
                    userId={creatorId}
                    size="sm"
                    disableLink={true}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Erstellt von {creator?.username || 'Unbekannt'}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {challenge.type.toUpperCase()} Challenge
                    </p>
                  </div>
                </div>
                
                {/* Teilnehmeranzahl anzeigen */}
                <div className="flex items-center gap-1 ml-auto">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{participantCount}</span>
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
                <div>
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