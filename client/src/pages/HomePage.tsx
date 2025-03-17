import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import FeedPost from "@/components/FeedPost";
import CreatePost from "@/components/CreatePost";

export default function HomePage() {
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      console.log("Received posts in HomePage:", data);
      return data;
    },
    refetchInterval: 3000, // Automatische Aktualisierung alle 3 Sekunden
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Fehler beim Laden der Beiträge. Bitte aktualisieren Sie die Seite.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <CreatePost />
      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center text-muted-foreground p-4">
            Noch keine Beiträge vorhanden. Erstellen Sie den ersten Beitrag!
          </div>
        )}
      </div>
    </div>
  );
}