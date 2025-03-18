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

export default function EventSlider() {
  const { events } = useEvents();
  const { users } = useUsers();

  // Sort events by date and filter out archived events
  const activeEvents = events
    .filter(event => !event.isArchived)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative group">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {activeEvents.map((event) => {
            const trainer = users.find(u => u.id === event.trainer);
            return (
              <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
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
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{trainer.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{trainer.username}</div>
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
        <div className="hidden sm:block">
          <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity -left-12 bg-background border-primary/20 hover:bg-primary/5 hover:border-primary/30">
            <ChevronLeft className="h-4 w-4" />
          </CarouselPrevious>
          <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity -right-12 bg-background border-primary/20 hover:bg-primary/5 hover:border-primary/30">
            <ChevronRight className="h-4 w-4" />
          </CarouselNext>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-background/80 to-background/0" />
      </Carousel>
      <div className="mt-2 flex justify-center gap-1">
        <span className="text-xs text-muted-foreground">←</span>
        <span className="text-xs text-muted-foreground">Horizontal scrollen für mehr</span>
        <span className="text-xs text-muted-foreground">→</span>
      </div>
    </div>
  );
}