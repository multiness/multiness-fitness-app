import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight } from "lucide-react";
import { mockGroups, mockChallenges, mockPosts } from "../data/mockData";
import { useLocation, Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="container max-w-2xl mx-auto p-4">
      {/* Marketing Banner */}
      <section className="mb-12">
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
              <Button 
                size="lg" 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => setLocation("/challenges")}
              >
                Jetzt teilnehmen
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white hover:bg-white/90 text-black border-white"
                onClick={() => setLocation("/events/1")}
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Events & Kurse */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Events & Kurse</h2>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <EventSlider />
      </section>

      {/* Neue Mitglieder */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neue Mitglieder</h2>
          <Link href="/members" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Mitglieder <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <UserSlider />
      </section>

      {/* Beliebte Gruppen */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Beliebte Gruppen</h2>
          <Link href="/groups" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Gruppen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {mockGroups.slice(0, 4).map(group => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </div>
      </section>

      {/* Aktive Challenges */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Aktive Challenges</h2>
          <Link href="/challenges" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Challenges <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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