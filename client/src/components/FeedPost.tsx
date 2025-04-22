import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, AlertTriangle, Send, Pencil, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
import { UserAvatar } from "@/components/UserAvatar";
import DailyGoalDisplay from './DailyGoalDisplay';

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

function CommentItem({ comment, postId, onReplyClick }: any) {
  const { users, currentUser } = useUsers();
  const postStore = usePostStore();
  const { toast } = useToast();
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const commentUser = users.find(u => u.id === comment.userId);
  const replies = postStore.getComments(postId, comment.id);
  const isLiked = postStore.hasLikedComment(postId, comment.id, currentUser?.id || 1);

  const handleLike = () => {
    const userId = currentUser?.id || 1;
    if (isLiked) {
      postStore.removeCommentLike(postId, comment.id, userId);
    } else {
      postStore.addCommentLike(postId, comment.id, userId);
      toast({
        title: "Kommentar gefällt dir",
        description: "Der Kommentar wurde zu deinen Likes hinzugefügt.",
      });
    }
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    postStore.addComment(postId, currentUser?.id || 1, replyContent, comment.id);
    setReplyContent("");
    setIsReplying(false);
    toast({
      title: "Antwort hinzugefügt",
      description: "Deine Antwort wurde erfolgreich hinzugefügt.",
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <UserAvatar
          userId={commentUser?.id || 0}
          size="sm"
          disableLink={true}
        />
        <div className="flex-1 space-y-1">
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{commentUser?.username}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.timestamp), "dd. MMM", { locale: de })}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`px-0 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likes?.length || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => setIsReplying(!isReplying)}
            >
              Antworten
            </Button>
            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Antworten ausblenden' : `${replies.length} Antworten`}
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="flex gap-2 mt-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Schreibe eine Antwort..."
                className="flex-1"
              />
              <Button onClick={handleReply} size="sm">
                Senden
              </Button>
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="ml-8 mt-2 space-y-2">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplyClick={onReplyClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
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

  const handleNativeShare = async () => {
    const shareData = {
      title: "Post von " + user.username,
      text: post.content,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link kopiert",
          description: "Der Link wurde in die Zwischenablage kopiert.",
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await postStore.updatePost(post.id, editContent);
      setIsEditDialogOpen(false);
      toast({
        title: "Post bearbeitet",
        description: "Dein Post wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error("Fehler beim Bearbeiten des Posts:", error);
      toast({
        title: "Fehler",
        description: "Beim Bearbeiten des Posts ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      console.log("Starte Löschvorgang für Post ID:", post.id);
      await postStore.deletePost(post.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Post gelöscht",
        description: "Dein Post wurde erfolgreich gelöscht.",
      });
      
      // Eine kurze Verzögerung, damit der State aktualisiert werden kann
      setTimeout(() => {
        console.log("Post wurde gelöscht, aktualisiere die Ansicht...");
        // Trigger ein Event, das den gelöschten Post auch in anderen Bereichen entfernt
        const deleteEvent = new CustomEvent('post-deleted', { 
          detail: { postId: post.id } 
        });
        window.dispatchEvent(deleteEvent);
        
        // Optional: Seite neu laden, um sicherzustellen, dass die UI aktualisiert wird
        // Dies kann in der Produktion entfernt werden, wenn die Synchronisierung stabil ist
        // window.location.reload();
      }, 300);
      
    } catch (error) {
      console.error("Fehler beim Löschen des Posts:", error);
      toast({
        title: "Fehler",
        description: "Beim Löschen des Posts ist ein Fehler aufgetreten.",
        variant: "destructive"
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

  const renderLikesText = () => {
    if (likes.length === 0) return null;

    const likers = likes.map(userId => users.find(u => u.id === userId))
      .filter(user => user !== undefined);

    if (likers.length === 0) return null;

    const firstLiker = likers[0];

    if (likers.length === 1) {
      return (
        <button 
          className="text-sm hover:underline"
          onClick={() => setShowLikesDialog(true)}
        >
          Gefällt <span className="font-semibold">{firstLiker?.username}</span>
        </button>
      );
    }

    return (
      <button 
        className="text-sm hover:underline"
        onClick={() => setShowLikesDialog(true)}
      >
        Gefällt <span className="font-semibold">{firstLiker?.username}</span>
        {" "}und{" "}
        <span className="font-semibold">
          {likers.length - 1} weiteren {likers.length - 1 === 1 ? "Person" : "Personen"}
        </span>
      </button>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={user.id}
            size="sm"
            disableLink={true}
          />
          <div>
            <h3 className="font-semibold">{user.username}</h3>
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
          <p>
            <span className="font-semibold mr-2">{user.username}</span>
            {post.content}
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

          <Button variant="ghost" size="sm" onClick={handleNativeShare}>
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Likes Display */}
        {renderLikesText()}


        {/* Comments Section */}
        <div className="space-y-4">
          {comments.length > 0 && (
            <div>
              {comments.length > 2 && !showAllComments && (
                <button 
                  className="text-muted-foreground text-sm"
                  onClick={() => setShowAllComments(true)}
                >
                  Alle {comments.length} Kommentare anzeigen
                </button>
              )}
              {(showAllComments ? comments : comments.slice(-2)).map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                />
              ))}
            </div>
          )}

          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-2">
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
        </div>
      </CardContent>

      {/* Dialogs */}
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

      {/* Likes Dialog */}
      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gefällt</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {likes.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                return (
                  <div key={userId} className="flex items-center gap-3">
                    <UserAvatar
                      userId={user.id}
                      size="sm"
                      disableLink={true}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}