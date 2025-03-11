import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { mockGroups, mockChallenges, mockPosts } from "../data/mockData";

export default function Home() {
  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Marketing Banner */}
      <Card className="relative aspect-square overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format"
          alt="Summer Fitness Challenge"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

        {/* Marketing Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <span className="text-sm font-semibold uppercase tracking-wider mb-2">Limitiertes Angebot</span>
          <h1 className="text-3xl font-bold mb-4">Summer Body Challenge 2025</h1>
          <p className="text-lg mb-6 text-white/90">Starte jetzt deine Fitness-Journey mit unserem 12-Wochen Programm.</p>
          <div className="flex gap-3">
            <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90">
              Jetzt teilnehmen
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
              Mehr erfahren
            </Button>
          </div>
        </div>
      </Card>

      {/* Events & Kurse */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Events & Kurse</h2>
        <EventSlider />
      </div>

      {/* New Members */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Neue Mitglieder</h2>
        <UserSlider />
      </div>

      {/* Groups Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Beliebte Gruppen</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockGroups.slice(0, 4).map(group => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Challenges Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Aktive Challenges</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockChallenges.slice(0, 4).map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Neueste Beiträge</h2>
        {mockPosts.map(post => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}