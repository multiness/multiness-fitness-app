import { Card } from "@/components/ui/card";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import { mockGroups, mockChallenges, mockPosts } from "../data/mockData";

export default function Home() {
  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Marketing Banner */}
      <Card className="w-full aspect-[21/9] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format"
          alt="Join our summer fitness challenge!"
          className="w-full h-full object-cover"
        />
      </Card>

      {/* New Members */}
      <div>
        <h2 className="text-lg font-semibold mb-3">New Members</h2>
        <UserSlider />
      </div>

      {/* Groups Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Popular Groups</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockGroups.slice(0, 4).map(group => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Challenges Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Challenges</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockChallenges.slice(0, 4).map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Latest Posts</h2>
        {mockPosts.map(post => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
