import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import FeedPost from "@/components/FeedPost";
import CreatePost from "@/components/CreatePost";
import { useEffect } from "react";

export default function HomePage() {
  const { data: posts = [], isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      console.log("Fetching posts...");
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      console.log("Fetched posts:", data);
      return data;
    },
  });

  // Automatically refetch posts every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch]);

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
        Fehler beim Laden der Beiträge. Bitte versuchen Sie es später erneut.
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-4 py-2 bg-primary text-white rounded-md"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <CreatePost />
      <div className="space-y-6">
        {Array.isArray(posts) && posts.length > 0 ? (
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