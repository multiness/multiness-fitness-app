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
import { Search } from "lucide-react";
import { mockUsers, mockGroups } from "../data/mockData"; // TODO: Replace with real data

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chat' | 'group';
  title: string;
  onShare: (id: number) => void;
}

export default function ShareDialog({
  open,
  onOpenChange,
  type,
  title,
  onShare,
}: ShareDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filter items based on search
  const items = type === 'chat'
    ? mockUsers.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.name.toLowerCase().includes(search.toLowerCase())
      )
    : mockGroups.filter(group =>
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.description.toLowerCase().includes(search.toLowerCase())
      );

  const handleShare = () => {
    if (selectedId) {
      onShare(selectedId);
      onOpenChange(false);
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
            {items.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                  ${selectedId === item.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                onClick={() => setSelectedId(item.id)}
              >
                <UserAvatar
                  userId={type === 'chat' ? item.id : item.creatorId}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {type === 'chat' ? item.username : item.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {type === 'chat' ? item.name : item.description}
                  </p>
                </div>
              </div>
            ))}
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
