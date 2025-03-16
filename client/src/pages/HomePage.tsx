import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import FeedPost from "@/components/FeedPost";
import { usePostStore } from "@/lib/postStore";
import { useEffect } from "react";

export default function HomePage() {
  const postStore = usePostStore();
  
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      // Initialize each post in the store
      data.forEach((post: Post) => postStore.initializePost(post));
      return data;
    }
  });

  // Migrate existing posts when component mounts
  useEffect(() => {
    postStore.migrateExistingPosts().catch(console.error);
  }, []);

  return (
    <div className="space-y-4 p-4">
      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </div>
  );
}
