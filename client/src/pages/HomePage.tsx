import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import FeedPost from "@/components/FeedPost";
import CreatePost from "@/components/CreatePost";
import { usePostStore } from "../lib/postStore";
import { useEffect } from "react";

export default function HomePage() {
  const postStore = usePostStore();

  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      try {
        console.log("Starting posts fetch...");
        const response = await fetch('/api/posts', {
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Posts received from API:', data);

        // Initialize posts in the store
        if (Array.isArray(data)) {
          data.forEach(post => postStore.initializePost(post));
        }

        return data;
      } catch (error) {
        console.error('Error in posts query:', error);
        throw error;
      }
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Debug logging
  useEffect(() => {
    if (Array.isArray(posts)) {
      console.log('Current posts:', posts);
    }
  }, [posts]);

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
        <div>Fehler beim Laden der Beiträge</div>
        <div className="text-sm mt-2">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CreatePost />
      <div className="mt-6 space-y-4">
        {/* Debug info */}
        <div className="bg-muted p-2 rounded text-sm">
          Posts geladen: {posts.length}
        </div>

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