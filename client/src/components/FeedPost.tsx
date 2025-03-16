import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  AlertTriangle, 
  Send, 
  Pencil, 
  Trash2,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { Post } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post: initialPost }: FeedPostProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [editContent, setEditContent] = useState(initialPost.content);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { currentUser } = useUsers();
  const postStore = usePostStore();
  const queryClient = useQueryClient();

  // Lade den Post aus der Datenbank
  const { data: post = initialPost, isLoading } = useQuery({
    queryKey: ['/api/posts', initialPost.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/posts/${initialPost.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Post wurde gelöscht, aus dem Store und Cache entfernen
            postStore.deletePost(initialPost.id);
            queryClient.setQueryData(['/api/posts'], (oldData: Post[] = []) => 
              oldData.filter(p => p.id !== initialPost.id)
            );
            return null;
          }
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching post:", error);
        return null; // Bei Fehler null zurückgeben
      }
    },
    retry: false, // Keine Wiederholungsversuche bei Fehlern
    staleTime: 30000, // Cache für 30 Sekunden behalten
  });

  const isLiked = postStore.hasLiked(post?.id || initialPost.id, currentUser?.id || 1);
  const likes = postStore.getLikes(post?.id || initialPost.id);
  const comments = postStore.getComments(post?.id || initialPost.id);
  const user = mockUsers.find(u => u.id === (post?.userId || initialPost.userId));
  const isOwnPost = currentUser?.id === (post?.userId || initialPost.userId);

  useEffect(() => {
    if (post) {
      setEditContent(post.content);
    }
  }, [post]);

  // Wenn der Post nicht mehr existiert, nichts anzeigen
  if (!post) {
    return null;
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Ungültiges Datum';
      }
      return format(dateObj, "dd. MMM yyyy", { locale: de });
    } catch (error) {
      console.error("Fehler beim Formatieren des Datums:", error);
      return 'Ungültiges Datum';
    }
  };

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

  const handleEdit = async () => {
    try {
      const response = await apiRequest("PATCH", `/api/posts/${post.id}`, {
        content: editContent
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const updatedPost = await response.json();
      postStore.updatePost(post.id, editContent);
      queryClient.setQueryData(['/api/posts', post.id], updatedPost);

      setIsEditDialogOpen(false);
      toast({
        title: "Post bearbeitet",
        description: "Dein Post wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Fehler",
        description: "Dein Post konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiRequest("DELETE", `/api/posts/${post.id}`);

      // Wenn der Post nicht gefunden wird (404), nehmen wir an, dass er bereits gelöscht wurde
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete post');
      }

      // Post aus dem Store und Query-Cache entfernen
      postStore.deletePost(post.id);

      // Aktualisiere die Postliste im Cache
      queryClient.setQueryData(['/api/posts'], (oldData: Post[] = []) => 
        oldData.filter(p => p.id !== post.id)
      );

      // Entferne den einzelnen Post aus dem Cache
      queryClient.removeQueries({ queryKey: ['/api/posts', post.id] });

      setIsDeleteDialogOpen(false);
      toast({
        title: "Post gelöscht",
        description: "Dein Post wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Fehler",
        description: "Dein Post konnte nicht gelöscht werden.",
        variant: "destructive",
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
    toast({
      title: "Link kopiert",
      description: "Der Link zum Post wurde in die Zwischenablage kopiert.",
    });
  };

  const nextImage = () => {
    if (post.images && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const previewComments = comments.slice(-2);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {user && (
            <UserAvatar
              userId={user.id}
              avatar={user.avatar}
              username={user.username}
              size="sm"
            />
          )}
          <div>
            <h3 className="font-semibold">{user?.username}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(post.createdAt)}
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

      <CardContent className="p-4 space-y-4">
        <div className="space-y-1">
          <p>
            <span className="font-semibold mr-2">{user?.username}</span>
            {post.content}
          </p>
        </div>

        {post.dailyGoal && (
          <div className="mt-4">
            <DailyGoalDisplay
              goal={post.dailyGoal}
              userId={post.userId}
              variant="compact"
            />
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div className="relative">
            <img
              src={post.images[currentImageIndex]}
              alt=""
              className="w-full aspect-square object-cover rounded-lg"
            />
            {post.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={nextImage}
                  disabled={currentImageIndex === post.images.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {post.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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

        {likes.length > 0 && (
          <p className="font-semibold text-sm">
            {likes.length} {likes.length === 1 ? "Like" : "Likes"}
          </p>
        )}

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
              const commentUser = mockUsers.find(u => u.id === comment.userId);
              return (
                <p key={comment.id} className="text-sm">
                  <span className="font-semibold mr-2">{commentUser?.username}</span>
                  {comment.content}
                </p>
              );
            })}
          </div>
        )}

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

      <Dialog open={showAllComments} onOpenChange={setShowAllComments}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kommentare</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map(comment => {
                const commentUser = mockUsers.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex gap-3">
                    {commentUser && (
                      <UserAvatar
                        userId={commentUser.id}
                        avatar={commentUser.avatar}
                        username={commentUser.username}
                        size="sm"
                      />
                    )}
                    <div className="flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{commentUser?.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                );
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
    </Card>
  );
}