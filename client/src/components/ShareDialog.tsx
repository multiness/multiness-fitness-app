import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import { Search, Users2 } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useChatStore } from "../lib/chatService";

// Grundlegende Schnittstellendefinitionen für User und Group
interface IUser {
  id: number;
  username: string;
  name: string;
}

interface IGroup {
  id: number;
  name: string;
  description: string;
  image?: string;
  participantIds?: number[];
}

interface SharedContent {
  id: number;
  type: 'challenge' | 'event' | 'post' | 'group';
  title: string;
  preview?: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chat' | 'group';
  title: string;
  onShare: (id: number) => void;
  content?: SharedContent;
}

export default function ShareDialog({
  open,
  onOpenChange,
  type,
  title,
  onShare,
  content
}: ShareDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { users, currentUser } = useUsers();
  const groupStore = useGroupStore();
  const chatStore = useChatStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Filtere die Benutzer/Gruppen basierend auf der Suche
  const items: (IUser | IGroup)[] = type === 'chat'
    ? users.filter(user =>
        user.id !== currentUser?.id && (
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.name.toLowerCase().includes(search.toLowerCase())
        )
      ) as IUser[]
    : Object.values(groupStore.groups).filter(group =>
        group.participantIds?.includes(currentUser?.id || 0) && (
          group.name.toLowerCase().includes(search.toLowerCase()) ||
          group.description.toLowerCase().includes(search.toLowerCase())
        )
      ) as IGroup[];

  const handleShare = () => {
    if (selectedId && currentUser && content) {
      // Chat-ID generieren
      const chatId = type === 'group' ? `group-${selectedId}` : `chat-${selectedId}`;

      // Inhalt im Chat speichern
      // Hier behandeln wir den Fall für 'group' in der content.type explizit,
      // da dies in der Schnittstelle der chatService.shareContent nicht direkt unterstützt wird
      const compatibleContent = {
        ...content,
        type: content.type === 'group' ? 'challenge' as const : content.type
      };
      
      chatStore.shareContent(chatId, currentUser.id, compatibleContent);

      // Toast anzeigen
      toast({
        title: "Erfolgreich geteilt!",
        description: `Der Inhalt wurde ${type === 'chat' ? 'an den Chat' : 'in die Gruppe'} gesendet.`,
      });

      // Dialog schließen
      onOpenChange(false);

      // Zum Chat navigieren
      setLocation(`/chat/${chatId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${type === 'chat' ? 'Chat' : 'Gruppe'} suchen...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Items List */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {items.map(item => {
              const isGroup = type === 'group';

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                    ${selectedId === item.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  {isGroup ? (
                    (item as IGroup).image ? (
                      <img 
                        src={(item as IGroup).image} 
                        alt={(item as IGroup).name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )
                  ) : (
                    <UserAvatar
                      userId={item.id}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isGroup ? (item as IGroup).name : (item as IUser).username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isGroup ? (item as IGroup).description : (item as IUser).name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleShare} disabled={!selectedId}>
            Teilen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}