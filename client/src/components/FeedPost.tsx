import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Post } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "../contexts/UserContext";

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { toast } = useToast();
  const { currentUser } = useUsers();
  const user = mockUsers.find(u => u.id === post.userId);

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Grund für die Meldung an.",
        variant: "destructive",
      });
      return;
    }

    // Hier würde der Report in einer echten App gespeichert werden
    toast({
      title: "Beitrag gemeldet",
      description: "Danke für deine Meldung. Wir werden den Beitrag überprüfen.",
    });
    setIsReportDialogOpen(false);
    setReportReason("");
  };

  const handleHidePost = () => {
    // Hier würde der Post in einer echten App ausgeblendet werden
    toast({
      title: "Beitrag ausgeblendet",
      description: "Der Beitrag wurde erfolgreich ausgeblendet.",
    });
  };

  const handleDeletePost = () => {
    // Hier würde der Post in einer echten App gelöscht werden
    toast({
      title: "Beitrag gelöscht",
      description: "Der Beitrag wurde erfolgreich gelöscht.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback>{user?.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user?.username}</h3>
              <p className="text-sm text-muted-foreground">
                {format(post.createdAt, "dd. MMM yyyy")}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {currentUser?.isAdmin ? (
                <>
                  <DropdownMenuItem onClick={handleHidePost} className="text-orange-500">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Beitrag ausblenden
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Beitrag löschen
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Beitrag melden
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {post.image && (
          <CardContent className="p-0">
            <img
              src={post.image}
              alt=""
              className="w-full aspect-square object-cover"
            />
          </CardContent>
        )}

        <CardContent className="p-4">
          <p>{post.content}</p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={liked ? "text-red-500" : ""}
            onClick={() => setLiked(!liked)}
          >
            <Heart className="h-5 w-5 mr-1" />
            {liked ? "Gefällt mir" : "Gefällt mir"}
          </Button>

          <Button variant="ghost" size="sm">
            <MessageCircle className="h-5 w-5 mr-1" />
            Kommentieren
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="h-5 w-5 mr-1" />
            Teilen
          </Button>
        </CardFooter>
      </Card>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beitrag melden</DialogTitle>
            <DialogDescription>
              Bitte gib einen Grund für deine Meldung an. Wir werden den Beitrag überprüfen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Grund für die Meldung..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleReport}>
              Melden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}