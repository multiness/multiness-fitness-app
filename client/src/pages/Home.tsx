import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { MarketingBanner } from "@/components/MarketingBanner";
import { mockGroups, mockChallenges, mockPosts } from "../data/mockData";
import { useLocation } from "wouter";

// Mock Banner Data
const mockBanner = {
  name: "Summer Body Challenge 2025",
  description: "Starte jetzt deine Fitness-Journey mit unserem 12-Wochen Programm.",
  webImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format",
  buttons: [
    {
      text: "Jetzt teilnehmen",
      url: "/challenges"
    },
    {
      text: "Mehr erfahren",
      url: "/events/1"
    }
  ]
};

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="container max-w-2xl mx-auto p-4">
      {/* Marketing Banner */}
      <section className="mb-12">
        <MarketingBanner banner={mockBanner} />
      </section>

      {/* Events & Kurse */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Events & Kurse</h2>
        <EventSlider />
      </section>

      {/* Neue Mitglieder */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Neue Mitglieder</h2>
        <UserSlider />
      </section>

      {/* Beliebte Gruppen */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Beliebte Gruppen</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockGroups.slice(0, 4).map(group => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </div>
      </section>

      {/* Aktive Challenges */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Aktive Challenges</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockChallenges.slice(0, 4).map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>

      {/* Feed */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Neueste Beiträge</h2>
        <div className="space-y-6">
          {mockPosts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}