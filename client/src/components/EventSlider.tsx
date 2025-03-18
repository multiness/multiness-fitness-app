import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Share2, MessageCircle, Users2 } from "lucide-react";
import { Link } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { useEvents } from "@/contexts/EventContext";
import { useUsers } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareDialog from "./ShareDialog";
import { useState } from "react";

export default function EventSlider() {
  const { events } = useEvents();
  const { users } = useUsers();

  // Sort events by date and filter out archived events
  const activeEvents = events
    .filter(event => !event.isArchived)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
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
            {activeEvents.map((event) => (
              <CarouselItem key={event.id} className="pl-2 basis-[80%]">
                <EventCard event={event} users={users} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: Grid-Layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {activeEvents.slice(0, 6).map((event) => (
          <EventCard key={event.id} event={event} users={users} />
        ))}
      </div>
    </>
  );
}

function EventCard({ event, users }: { event: any, users: any[] }) {
  const trainer = users.find(u => u.id === event.trainer);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'chat' | 'group'>('chat');

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInternalShare = (type: 'chat' | 'group', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareType(type);
    setShareDialogOpen(true);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: event.title,
      text: `Schau dir dieses Event an: ${event.title}`,
      url: `${window.location.origin}/events/${event.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback für Browser ohne Web Share API
        const url = `${window.location.origin}/events/${event.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title} - ${url}`)}`);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const sharedContent = {
    type: 'event' as const,
    id: event.id,
    title: event.title,
    preview: format(new Date(event.date), "dd. MMMM", { locale: de }),
    image: event.image,
    location: event.location,
    description: event.description
  };

  return (
    <>
      <Link href={`/events/${event.id}`}>
        <Card className="overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-primary/10 hover:border-primary/20">
          <CardHeader className="p-0 relative aspect-[16/9]">
            <img
              src={event.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge 
                variant={event.type === "event" ? "default" : "secondary"}
                className="text-xs"
              >
                {event.type === "event" ? "Event" : "Kurs"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.date), "dd. MMMM", { locale: de })}
                </div>
                <h3 className="font-medium text-sm line-clamp-1 mb-1">{event.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>

                {trainer && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                    <UserAvatar
                      userId={trainer.id}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{trainer.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{trainer.username}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={handleShare}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleInternalShare('chat', e)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span>An Chat senden</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleInternalShare('group', e)}>
                        <Users2 className="h-4 w-4 mr-2" />
                        <span>In Gruppe teilen</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button size="sm">
                  Teilnehmen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        type={shareType}
        title={shareType === 'chat' ? 'An Chat senden' : 'In Gruppe teilen'}
        onShare={() => {}}
        content={sharedContent}
      />
    </>
  );
}