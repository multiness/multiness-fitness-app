import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserSlider from "@/components/UserSlider";
import GroupPreview from "@/components/GroupPreview";
import ChallengeCard from "@/components/ChallengeCard";
import FeedPost from "@/components/FeedPost";
import EventSlider from "@/components/EventSlider";
import { ArrowRight, Trophy, Users2 } from "lucide-react";
import { useGroupStore } from "../lib/groupStore";
import { usePostStore } from "../lib/postStore";
import { getChatId } from "../lib/chatService";
import { useUsers } from "../contexts/UserContext";
import { useLocation, Link } from "wouter";
import GroupCarousel from "@/components/GroupCarousel";

export default function Home() {
  const [, setLocation] = useLocation();
  const postStore = usePostStore();
  const groupStore = useGroupStore();
  const { users, currentUser } = useUsers();

  // Lade Posts aus dem postStore
  const allPosts = Object.values(postStore.posts).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Lade Gruppen aus dem groupStore
  const groups = Object.values(groupStore.groups);

  const navigateToGroupChat = (groupId: number) => {
    const chatId = getChatId(groupId);
    setLocation(`/chat/${chatId}`);
  };

  // Lade aktive Challenges
  const activeChallenges = users
    .filter(user => user.challenges)
    .flatMap(user => user.challenges)
    .filter(challenge => new Date() <= new Date(challenge.endDate));


  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Feed - Direkt am Anfang für schnellen Zugriff auf neue Posts */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neueste Beiträge</h2>
          <Link href="/create/post" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Beitrag erstellen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-6">
          {allPosts.map(post => (
            <div key={post.id} className="w-full max-w-xl mx-auto">
              <FeedPost post={post} />
            </div>
          ))}
          {allPosts.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Noch keine Beiträge vorhanden
            </div>
          )}
        </div>
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
          <div className="flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Beliebte Gruppen</h2>
          </div>
          <Link href="/groups" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            Alle Gruppen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* Mobile: Karussell-Layout */}
        <div className="block md:hidden">
          <GroupCarousel groups={groups.slice(0, 6)} />
        </div>
        {/* Desktop: Grid-Layout */}
        <div className="hidden md:grid grid-cols-2 gap-4">
          {groups.slice(0, 4).map(group => (
            <div key={group.id} className="cursor-pointer" onClick={() => navigateToGroupChat(group.id)}>
              <GroupPreview group={group} />
            </div>
          ))}
          {groups.length === 0 && (
            <div className="text-center text-muted-foreground py-8 col-span-2">
              Noch keine Gruppen vorhanden
            </div>
          )}
        </div>
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

      {/* Aktive Challenges */}
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

        {/* Desktop: Grid-Layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.slice(0, 6).map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>
    </div>
  );
}