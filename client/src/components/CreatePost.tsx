import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "../contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { UserAvatar } from "./UserAvatar";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/posts", {
        userId: currentUser?.id || 1,
        content: content.trim()
      });

      // Clear form and invalidate posts query
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });

      toast({
        title: "Beitrag erstellt",
        description: "Dein Beitrag wurde erfolgreich veröffentlicht.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Fehler",
        description: "Dein Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          {currentUser && (
            <UserAvatar
              userId={currentUser.id}
              avatar={currentUser.avatar}
              username={currentUser.username}
              size="sm"
            />
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Was möchtest du teilen?"
            className="flex-1 min-h-[100px]"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Wird gepostet..." : "Posten"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
