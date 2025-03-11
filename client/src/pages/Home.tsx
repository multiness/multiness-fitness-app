import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Crown, Heart, Share2 } from "lucide-react";
import { mockGroups, mockChallenges, mockPosts, mockUsers } from "../data/mockData";
import { useLocation, Link } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const format = (date: Date, formatStr: string) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function Home() {
  const [, setLocation] = useLocation();
  const activeChallenges = mockChallenges.filter(
    challenge => new Date() <= new Date(challenge.endDate)
  );

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

      {/* Aktive Challenges - Neu gestaltet mit Carousel */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Aktive Challenges</h2>
          <Link href="/challenges" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Challenges <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {activeChallenges.map(challenge => (
              <CarouselItem key={challenge.id} className="md:basis-1/2 lg:basis-1/2">
                <Card className="overflow-hidden hover:shadow-lg transition-all">
                  {/* Challenge Image Section */}
                  {challenge.image && (
                    <div className="aspect-[16/9] relative">
                      <img
                        src={challenge.image}
                        alt={challenge.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardContent className="p-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mockUsers[0]?.avatar || undefined} />
                        <AvatarFallback>{mockUsers[0]?.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{mockUsers[0]?.username}</p>
                        <p className="text-xs text-muted-foreground">Challenge Creator</p>
                      </div>
                      <Badge variant="secondary">Aktiv</Badge>
                    </div>

                    {/* Challenge Title & Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-1">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Endet am {format(new Date(challenge.endDate), "dd.MM.yyyy")}
                      </p>
                    </div>

                    {/* Participants Preview */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {mockUsers.slice(0, 3).map((user, i) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>{user.username[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{mockUsers.length -3}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{mockUsers.length} Teilnehmer</span>
                      </div>

                      {/* Social Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Heart className={`h-4 w-4`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Top 3 Ranking - kompakter */}
                    <div className="space-y-1 mb-4">
                      <p className="text-sm font-medium mb-2">Top 3 Ranking</p>
                      {[1, 2, 3].map(rank => (
                        <div key={rank} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            {rank === 1 && <Crown className="h-4 w-4 text-yellow-400" />}
                            {rank === 2 && <Crown className="h-4 w-4 text-gray-400" />}
                            {rank === 3 && <Crown className="h-4 w-4 text-amber-700" />}
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={mockUsers[rank]?.avatar || undefined} />
                              <AvatarFallback>{mockUsers[rank]?.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{mockUsers[rank]?.username}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {1000 - (rank * 50)} Punkte
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation(`/challenges/${challenge.id}`);
                      }}
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
        <div className="space-y-6">
          {mockPosts.map(post => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}