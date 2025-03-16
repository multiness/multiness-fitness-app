import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Share2, Flag } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { useToast } from "@/hooks/use-toast";

const commentSchema = z.object({
  content: z.string().min(1, "Kommentar darf nicht leer sein"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

interface EventCommentsProps {
  eventId: number;
}

export default function EventComments({ eventId }: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      userId: 1,
      content: "Tolles Event! Ich freue mich schon sehr darauf.",
      createdAt: new Date(),
      likes: 5,
      isLiked: false,
    },
  ]);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = (data: CommentFormData) => {
    const newComment: Comment = {
      id: comments.length + 1,
      userId: 1, // Current user ID
      content: data.content,
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
    };
    setComments([...comments, newComment]);
    form.reset();
    toast({
      title: "Kommentar hinzugefügt",
      description: "Dein Kommentar wurde erfolgreich veröffentlicht.",
    });
  };

  const handleLike = (commentId: number) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const handleEventLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Like entfernt" : "Event geliked",
      description: isLiked ? "Du hast deinen Like entfernt." : "Du hast das Event geliked.",
    });
  };

  const handleShare = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link kopiert",
      description: "Der Event-Link wurde in die Zwischenablage kopiert.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4">
        <Button 
          variant="outline" 
          className="w-full sm:flex-1"
          onClick={handleEventLike}
        >
          <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? "text-primary" : ""}`} />
          Like
        </Button>
        <Button 
          variant="outline" 
          className="w-full sm:flex-1"
          onClick={() => form.setFocus("content")}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Kommentieren
        </Button>
        <Button 
          variant="outline" 
          className="w-full sm:flex-1"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Teilen
        </Button>
      </div>

      {/* Comment Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Textarea
          placeholder="Schreibe einen Kommentar..."
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
        <Button type="submit">Kommentar senden</Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const user = mockUsers.find(u => u.id === comment.userId);
          return (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  <Avatar>
                    <img src={user?.avatar} alt={user?.name} />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(comment.createdAt, "dd. MMMM yyyy 'um' HH:mm", { locale: de })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id)}
                        className={comment.isLiked ? "text-primary" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        Antworten
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}