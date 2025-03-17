import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, AlertTriangle, Send, Pencil, Trash2 } from "lucide-react";
import { Post } from "@shared/schema";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { UserAvatar } from "./UserAvatar";
import DailyGoalDisplay from './DailyGoalDisplay';
import { UsernameWithVerification } from "./UserAvatar";

interface FeedPostProps {
  post: {
    id: number;
    userId: number;
    content: string;
    image?: string | null;
    createdAt: Date;
    dailyGoal?: {
      type: 'water' | 'steps' | 'distance' | 'custom';
      target: number;
      unit: string;
      progress: number;
      completed: boolean;
      customName?: string;
      createdAt: Date;
    };
  };
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [editContent, setEditContent] = useState(post.content);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { currentUser, users } = useUsers();
  const postStore = usePostStore();
  const isLiked = postStore.hasLiked(post.id, currentUser?.id || 1);
  const likes = postStore.getLikes(post.id);
  const comments = postStore.getComments(post.id);
  const user = users.find(u => u.id === post.userId);
  const isOwnPost = currentUser?.id === post.userId;

  if (!user) return null;

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

  const handleEdit = () => {
    if (!editContent.trim()) return;
    postStore.updatePost(post.id, editContent);
    setIsEditDialogOpen(false);
    toast({
      title: "Post bearbeitet",
      description: "Dein Post wurde erfolgreich aktualisiert.",
    });
  };

  const handleDelete = () => {
    postStore.deletePost(post.id);
    setIsDeleteDialogOpen(false);
    toast({
      title: "Post gelöscht",
      description: "Dein Post wurde erfolgreich gelöscht.",
    });
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
    toast({
      title: "Link kopiert",
      description: "Der Link zum Post wurde in die Zwischenablage kopiert.",
    });
  };

  const previewComments = comments.slice(-2);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={user.id}
            size="sm"
          />
          <UsernameWithVerification userId={user.id} />
        </div>
        <div className="text-sm text-muted-foreground">
          {format(post.createdAt, "dd. MMM yyyy")}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500 focus:text-red-500">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
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

      <CardContent className="p-4 space-y-4">
        {/* Post Content */}
        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <UsernameWithVerification userId={user.id} />
            <span>{post.content}</span>
          </p>
        </div>

        {/* Daily Goal Display */}
        {post.dailyGoal && (
          <div className="mt-4">
            <DailyGoalDisplay 
              goal={post.dailyGoal} 
              userId={post.userId}
              variant="compact" 
            />
          </div>
        )}

        {/* Interaction Buttons */}
        <div className="flex gap-4 items-center -ml-2">
          <Button
            variant="ghost"
            size="sm"
            className={isLiked ? "text-red-500 hover:text-red-600" : ""}
            onClick={handleLike}
          >
            <Heart className={`h-6 w-6 transition-transform hover:scale-110 ${isLiked ? "fill-current" : ""}`} />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAllComments(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Likes Display */}
        {likes.length > 0 && (
          <p className="font-semibold text-sm">
            {likes.length} {likes.length === 1 ? "Like" : "Likes"}
          </p>
        )}

        {/* Comments Preview */}
        {comments.length > 0 && (
          <div className="space-y-2">
            {comments.length > 2 && (
              <button 
                className="text-muted-foreground text-sm"
                onClick={() => setShowAllComments(true)}
              >
                Alle {comments.length} Kommentare anzeigen
              </button>
            )}
            {previewComments.map(comment => {
              const commentUser = users.find(u => u.id === comment.userId);
              return commentUser ? (
                <p key={comment.id} className="text-sm flex items-center gap-2">
                  <UsernameWithVerification userId={commentUser.id} />
                  <span>{comment.content}</span>
                </p>
              ) : null;
            })}
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleComment} className="flex gap-2 pt-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentieren..."
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="ghost">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beitrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beitrag löschen</DialogTitle>
            <DialogDescription>
              Möchtest du diesen Beitrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Comments Dialog */}
      <Dialog open={showAllComments} onOpenChange={setShowAllComments}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kommentare</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map(comment => {
                const commentUser = users.find(u => u.id === comment.userId);
                return commentUser ? (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatar
                      userId={commentUser.id}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UsernameWithVerification userId={commentUser.id} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.timestamp), "dd. MMM")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2 border-t">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Kommentieren..."
              className="flex-1"
            />
            <Button onClick={handleComment} size="icon" variant="ghost">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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