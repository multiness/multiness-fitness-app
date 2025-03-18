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
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { useEvents } from "@/contexts/EventContext";
import { useUsers } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";

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
              <CarouselItem key={event.id} className="pl-2 basis-[85%]">
                <EventCard event={event} users={users} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-2 flex justify-center gap-1">
            <span className="text-xs text-muted-foreground">←</span>
            <span className="text-xs text-muted-foreground">Horizontal scrollen für mehr</span>
            <span className="text-xs text-muted-foreground">→</span>
          </div>
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

  return (
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

          <div className="mt-3 flex justify-end">
            <Link href={`/events/${event.id}`}>
              <Button size="sm" variant="default">
                Teilnehmen
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}