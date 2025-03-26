import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Crown, Heart, Share2, Users, Trophy, Package } from "lucide-react";
import { mockGroups, mockChallenges, mockUsers, mockProducts } from "../data/mockData";
import { useLocation, Link } from "wouter";
import { usePostStore } from "../lib/postStore";
import { getChatId } from "../lib/chatService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import GroupCarousel from "@/components/GroupCarousel";
import { UserAvatar } from "@/components/UserAvatar";
import ProductSlider from "@/components/ProductSlider";

const format = (date: Date, formatStr: string) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function Home() {
  const [, setLocation] = useLocation();
  const postStore = usePostStore();
  const activeChallenges = mockChallenges.filter(
    challenge => new Date() <= new Date(challenge.endDate)
  );

  // Lade Posts aus dem postStore statt mockPosts
  const allPosts = Object.values(postStore.posts).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId);
    setLocation(`/chat/${chatId}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Linke Spalte - Feed */}
        <div className="lg:col-span-8 space-y-8">
          {/* Marketing Banner */}
          <section>
            <Card className="relative aspect-video overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format"
                alt="Summer Fitness Challenge"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

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

          {/* Feed */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Neueste Beiträge</h2>
            <div className="space-y-6 w-full">
              {allPosts.map(post => (
                <div key={post.id} className="w-full max-w-xl mx-auto">
                  <FeedPost post={post} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Rechte Spalte - Events, Gruppen, etc. */}
        <div className="lg:col-span-4 space-y-8">
          {/* Events & Kurse */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Events & Kurse</h2>
              <Link href="/events" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                Alle Events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <EventSlider />
          </section>

          {/* Neue Mitglieder */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Neue Mitglieder</h2>
              <Link href="/members" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                Alle Mitglieder <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <UserSlider />
          </section>

          {/* Beliebte Gruppen */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Beliebte Gruppen</h2>
              <Link href="/groups" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                Alle Gruppen <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {mockGroups.slice(0, 3).map(group => (
                <div key={group.id} className="cursor-pointer" onClick={() => navigateToGroupChat(group.id)}>
                  <GroupPreview group={group} />
                </div>
              ))}
            </div>
          </section>
          {/* Aktive Challenges - Hervorgehobenes Design */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Aktive Challenges</h2>
              </div>
              <Link href="/challenges" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                Alle Challenges <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {activeChallenges.slice(0, 3).map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
          {/* Products Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Shop</h2>
              </div>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                Alle Produkte <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ProductSlider products={mockProducts} />
          </section>

        </div>
      </div>
    </div>
  );
}