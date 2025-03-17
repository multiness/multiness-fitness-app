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
        {/* Desktop: Grid-Layout */}
        <div className="hidden md:grid grid-cols-2 gap-4">
          {mockGroups.slice(0, 4).map(group => {
            const chatId = getChatId(group.id);
            return (
              <div key={group.id} className="cursor-pointer" onClick={() => navigateToGroupChat(group.id)}>
                <GroupPreview group={group} />
              </div>
            );
          })}
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

        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {activeChallenges.map(challenge => (
              <CarouselItem key={challenge.id} className="md:basis-3/4 lg:basis-3/4">
                <Card className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    {/* Challenge Info Section */}
                    <div className="flex items-start gap-3 mb-4">
                      {mockUsers[0] && (
                        <UserAvatar
                          userId={mockUsers[0].id}
                          avatar={mockUsers[0].avatar}
                          username={mockUsers[0].username}
                          size="sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{mockUsers[0]?.username}</p>
                          <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">Aktiv</Badge>
                        </div>
                        <h3 className="text-lg font-bold truncate">{challenge.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Endet am {format(new Date(challenge.endDate), "dd.MM.yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Participants & Stats */}
                    <div className="bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {mockUsers.slice(0, 3).map((user, i) => (
                              <UserAvatar
                                key={i}
                                userId={user.id}
                                avatar={user.avatar}
                                username={user.username}
                                size="sm"
                                className="-ml-2 first:ml-0"
                              />
                            ))}
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                              +{mockUsers.length - 3}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {mockUsers.length} Teilnehmer
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Top 3 Ranking */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(rank => (
                          <div key={rank} className="flex items-center gap-2 bg-background/50 rounded-md p-2">
                            <div className="relative">
                              {rank === 1 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-yellow-400" />}
                              {rank === 2 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-gray-400" />}
                              {rank === 3 && <Crown className="absolute -top-2 -left-2 h-4 w-4 text-amber-700" />}
                              <UserAvatar
                                userId={mockUsers[rank]?.id || 0}
                                avatar={mockUsers[rank]?.avatar}
                                username={mockUsers[rank]?.username || ''}
                                size="sm"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{mockUsers[rank]?.username}</p>
                              <p className="text-xs text-muted-foreground">{1000 - (rank * 50)} Punkte</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="default"
                      className="w-full mt-4"
                      onClick={() => setLocation(`/challenges/${challenge.id}`)}
                    >
                      Challenge beitreten
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
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
  );
}