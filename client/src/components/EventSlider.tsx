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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { mockEvents, mockUsers } from "../data/mockData";

export default function EventSlider() {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {mockEvents.map((event) => {
          const trainer = mockUsers.find(u => u.id === event.trainer);
          return (
            <CarouselItem key={event.id} className="basis-full md:basis-1/2 lg:basis-1/3 pl-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge 
                    variant={event.type === "event" ? "default" : "secondary"}
                    className="absolute top-4 right-4"
                  >
                    {event.type === "event" ? "Event" : "Kurs"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {format(event.date, "dd. MMMM", { locale: de })}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                  
                  {trainer && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={trainer.avatar} />
                        <AvatarFallback>{trainer.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{trainer.name}</div>
                        <div className="text-xs text-muted-foreground">{trainer.username}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
