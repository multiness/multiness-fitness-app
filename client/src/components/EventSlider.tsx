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
import { Calendar, MapPin } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { useEvents } from "@/contexts/EventContext";

export default function EventSlider() {
  const { events } = useEvents();

  // Sort events by date and filter out archived events
  const activeEvents = events
    .filter(event => !event.isArchived)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {activeEvents.map((event) => {
          const trainer = mockUsers.find(u => u.id === event.trainer);
          return (
            <CarouselItem key={event.id} className="basis-full md:basis-1/2 lg:basis-1/3 pl-4">
              <Link href={`/events/${event.id}`}>
                <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
                  <CardHeader className="p-0 relative">
                    <img
                      src={event.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge 
                        variant={event.type === "event" ? "default" : "secondary"}
                      >
                        {event.type === "event" ? "Event" : "Kurs"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.date), "dd. MMMM", { locale: de })}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{event.description}</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>

                    {trainer && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <UserAvatar
                          userId={trainer.id}
                          avatar={trainer.avatar}
                          username={trainer.username}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm font-medium">{trainer.name}</div>
                          <div className="text-xs text-muted-foreground">{trainer.username}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}