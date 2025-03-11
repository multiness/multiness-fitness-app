import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Post } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { format } from "date-fns";

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const user = mockUsers.find(u => u.id === post.userId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Avatar>
          <AvatarImage src={user?.avatar} />
          <AvatarFallback>{user?.username[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user?.username}</h3>
          <p className="text-sm text-muted-foreground">
            {format(post.createdAt, "MMM d, yyyy")}
          </p>
        </div>
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
      
      <CardContent className="p-4">
        <p>{post.content}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={liked ? "text-red-500" : ""}
          onClick={() => setLiked(!liked)}
        >
          <Heart className="h-5 w-5 mr-1" />
          {liked ? "Liked" : "Like"}
        </Button>
        
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-5 w-5 mr-1" />
          Comment
        </Button>
        
        <Button variant="ghost" size="sm">
          <Share2 className="h-5 w-5 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
