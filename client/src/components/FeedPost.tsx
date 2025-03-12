import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, AlertTriangle, Send } from "lucide-react";
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
import { usePostStore } from "../lib/postStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { currentUser } = useUsers();
  const postStore = usePostStore();
  const isLiked = postStore.hasLiked(post.id, currentUser?.id || 1);
  const likes = postStore.getLikes(post.id);
  const comments = postStore.getComments(post.id);
  const user = mockUsers.find(u => u.id === post.userId);

  const handleLike = () => {
    const userId = currentUser?.id || 1;
    if (isLiked) {
      postStore.removeLike(post.id, userId);
    } else {
      postStore.addLike(post.id, userId);
      toast({
        title: "Post gefällt dir",
        description: "Der Post wurde zu deinen Likes hinzugefügt.",
      });
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    postStore.addComment(post.id, currentUser?.id || 1, newComment);
    setNewComment("");
    toast({
      title: "Kommentar hinzugefügt",
      description: "Dein Kommentar wurde erfolgreich hinzugefügt.",
    });
  };

  const handleShare = () => {
    // In einer echten App würde hier der Sharing-Dialog geöffnet
    toast({
      title: "Link kopiert",
      description: "Der Link zum Post wurde in die Zwischenablage kopiert.",
    });
  };

  return (
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
            <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Beitrag melden
            </DropdownMenuItem>
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

      <CardFooter className="p-4 pt-0 flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            className={isLiked ? "text-red-500 hover:text-red-600" : ""}
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {likes.length > 0 && likes.length}
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            {comments.length > 0 && comments.length}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-5 w-5 mr-1" />
          </Button>
        </div>

        {/* Kommentarbereich */}
        {showComments && (
          <div className="w-full space-y-4">
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {comments.map(comment => {
                const commentUser = mockUsers.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex gap-2 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={commentUser?.avatar || undefined} />
                      <AvatarFallback>{commentUser?.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p className="font-medium text-sm">{commentUser?.username}</p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(comment.timestamp), "dd. MMM yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>

            <form onSubmit={handleComment} className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schreibe einen Kommentar..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardFooter>

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
            <Button onClick={() => {
              toast({
                title: "Beitrag gemeldet",
                description: "Danke für deine Meldung. Wir werden den Beitrag überprüfen.",
              });
              setIsReportDialogOpen(false);
              setReportReason("");
            }}>
              Melden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}