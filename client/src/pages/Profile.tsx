import { useState } from "react";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Image, Trophy } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockPosts, mockChallenges } from "../data/mockData";

export default function Profile() {
  const { id } = useParams();
  const userId = parseInt(id || "1");
  const user = mockUsers.find(u => u.id === userId);
  const userPosts = mockPosts.filter(p => p.userId === userId);
  const userChallenges = mockChallenges.filter(c => c.creatorId === userId);

  const [selectedTab, setSelectedTab] = useState("all");

  if (!user) return <div>User not found</div>;

  return (
    <div className="container max-w-2xl mx-auto p-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.username[0]}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
        <h2 className="text-lg text-muted-foreground mb-2">@{user.username}</h2>
        <p className="text-center mb-4">{user.bio}</p>
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <div className="font-bold">{userPosts.length}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{userChallenges.length}</div>
            <div className="text-sm text-muted-foreground">Challenges</div>
          </div>
        </div>
        <Button>Edit Profile</Button>
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            <Grid3X3 className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="posts">
            <Image className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {userPosts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {userPosts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="challenges" className="grid grid-cols-2 gap-4">
          {userChallenges.map(challenge => (
            <div key={challenge.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={challenge.image}
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}