import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { usePostStore } from "../lib/postStore";
import FeedPost from "@/components/FeedPost";

export default function Home() {
  const postStore = usePostStore();

  // Debug: Log the posts when component mounts or postStore changes
  useEffect(() => {
    console.log("Home: Current posts in store:", postStore.posts);
    const posts = Object.values(postStore.posts);
    console.log("Home: Number of posts:", posts.length);
    console.log("Home: Posts array:", posts);
  }, [postStore.posts]);

  // Get all posts from postStore, sorted by date
  const allPosts = Object.values(postStore.posts).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neueste Beiträge</h2>
          <Link href="/create/post" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Beitrag erstellen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-6">
          {Object.keys(postStore.posts).length > 0 ? (
            allPosts.map(post => (
              <div key={post.id} className="w-full max-w-xl mx-auto">
                <FeedPost post={post} />
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Noch keine Beiträge vorhanden (Posts im Store: {Object.keys(postStore.posts).length})
            </div>
          )}
        </div>
      </section>
    </div>
  );
}