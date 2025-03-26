import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePostStore } from "../lib/postStore";
import FeedPost from "@/components/FeedPost";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const postStore = usePostStore();

  // Clear localStorage on component mount
  useEffect(() => {
    localStorage.clear();
    console.log('PostStore State:', {
      posts: postStore.posts,
      totalPosts: Object.keys(postStore.posts).length
    });
  }, []);

  // Sort posts by date
  const posts = Object.values(postStore.posts).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Mobile Layout */}
      <div className="block md:hidden space-y-6">
        {posts.map(post => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6">
        {posts.map(post => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Store Status:</p>
        <p>Posts im Store: {Object.keys(postStore.posts).length}</p>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify({ posts: posts }, null, 2)}
        </pre>
      </div>
    </div>
  );
}