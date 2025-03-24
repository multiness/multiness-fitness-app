import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Crown, Heart, Share2, Users, Trophy, Package, Calendar } from "lucide-react";
import { mockGroups, mockChallenges, mockUsers, mockProducts } from "../data/mockData";
import { useLocation, Link } from "wouter";
import { usePostStore } from "../lib/postStore";
import { getChatId } from "../lib/chatService";
import { useUsers } from "../contexts/UserContext"; 
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import GroupCarousel from "@/components/GroupCarousel";
import { UserAvatar } from "@/components/UserAvatar";
import ProductSlider from "@/components/ProductSlider";

export default function Home() {
  const [, setLocation] = useLocation();
  const postStore = usePostStore();
  const { currentUser } = useUsers();
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);

  // Load and sync data
  useEffect(() => {
    const loadData = () => {
      // Load posts from localStorage
      const savedPosts = localStorage.getItem('fitness-app-posts');
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts);
          setPosts(parsedPosts);
        } catch (error) {
          console.error('Error loading posts:', error);
        }
      }

      // Load challenges from localStorage
      const savedChallenges = localStorage.getItem('fitness-app-challenges');
      if (savedChallenges) {
        try {
          const parsedChallenges = JSON.parse(savedChallenges);
          setChallenges(parsedChallenges);
        } catch (error) {
          console.error('Error loading challenges:', error);
        }
      }
    };

    // Initial load
    loadData();

    // Listen for updates
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userDataUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleStorageChange);
    };
  }, []);

  const activeChallenges = challenges.length > 0 
    ? challenges.filter(challenge => new Date() <= new Date(challenge.endDate))
    : mockChallenges.filter(challenge => new Date() <= new Date(challenge.endDate));

  const allPosts = posts.length > 0 
    ? posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : Object.values(postStore.posts).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId);
    setLocation(`/chat/${chatId}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Marketing Banner */}
      <section className="mb-12">
        <Card className="relative aspect-square overflow-hidden">
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
        {/* Mobile: Karussell-Layout */}
        <div className="block md:hidden">
          <GroupCarousel groups={mockGroups.slice(0, 6)} />
        </div>
        {/* Desktop: Grid-Layout mit gleichem Design wie Mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockGroups.slice(0, 6).map(group => (
            <div key={group.id} className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => navigateToGroupChat(group.id)}>
              <GroupPreview group={group} />
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Shop</h2>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Produkte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductSlider products={mockProducts} />
      </section>

      {/* Aktive Challenges - Hervorgehobenes Design */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Aktive Challenges</h2>
          </div>
          <Link href="/challenges" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Challenges <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile: Karussell-Layout */}
        <div className="block md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {activeChallenges.map(challenge => (
                <CarouselItem key={challenge.id} className="pl-2 basis-[80%]">
                  <ChallengeCard challenge={challenge} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: Grid-Layout mit gleichem Design wie Mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.slice(0, 6).map(challenge => (
            <div key={challenge.id} className="transition-transform hover:scale-[1.02]">
              <ChallengeCard challenge={challenge} />
            </div>
          ))}
        </div>
      </section>

      {/* Events Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Events</h2>
          </div>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <EventSlider />
      </section>


      {/* Feed */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Neueste Beiträge</h2>
        <div className="space-y-6">
          {allPosts.map(post => (
            <div key={post.id} className="w-full max-w-xl mx-auto transition-transform hover:scale-[1.01]">
              <FeedPost post={post} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}