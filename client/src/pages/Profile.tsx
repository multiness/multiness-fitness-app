import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Trophy, Users2, Image } from "lucide-react";
import FeedPost from "@/components/FeedPost";
import { mockUsers, mockPosts, mockChallenges, mockGroups } from "../data/mockData";
import { Badge } from "@/components/ui/badge";
import EditProfileDialog from "@/components/EditProfileDialog";
import { usePostStore } from "../lib/postStore";
import DailyGoalDisplay from "@/components/DailyGoalDisplay";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "@/components/UserAvatar"; // Fix: Use named import

export default function Profile() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const userId = parseInt(id || "1");
  const [user, setUser] = useState(() => mockUsers.find(u => u.id === userId));
  const userPosts = mockPosts.filter(p => p.userId === userId);
  const userChallenges = mockChallenges.filter(c => c.creatorId === userId);
  const userGroups = mockGroups.filter(g => g.participantIds?.includes(userId));
  const activeUserChallenges = userChallenges.filter(c => new Date() <= new Date(c.endDate));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const postStore = usePostStore();

  // Get the active goal for the current profile's user
  const activeGoal = postStore.getDailyGoal(userId);
  console.log('Active goal for user:', userId, activeGoal);

  useEffect(() => {
    console.log('Profile page - userId:', userId);
    console.log('Profile page - activeGoal:', activeGoal);
  }, [userId, activeGoal]);

  if (!user) return <div>User not found</div>;

  const handleProfileUpdate = (updatedData: { name: string; bio?: string; avatar?: string }) => {
    setUser(currentUser => {
      if (!currentUser) return currentUser;
      return {
        ...currentUser,
        ...updatedData,
      };
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg" />

        <div className="flex flex-col items-center -mt-12">
          <div className="relative">
            <UserAvatar
              userId={userId}
              avatar={user.avatar}
              username={user.username}
              size="lg"
              showActiveGoal={true}
            />
            {user.isVerified && (
              <VerifiedBadge className="absolute bottom-0 right-0" />
            )}
          </div>

          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <h2 className="text-lg text-muted-foreground">@{user.username}</h2>

          {/* Rest of the component remains unchanged */}
        </div>
      </div>
      {/* Rest of the component remains unchanged */}
    </div>
  );
}
