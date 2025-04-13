import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEvents } from "@/contexts/EventContext";
import { Link } from "wouter";
import { useUsers } from "@/contexts/UserContext";

export default function Events() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { events } = useEvents();
  const { currentUser } = useUsers();

  // Filter Events für verschiedene Ansichten
  const today = new Date();
  const highlightEvents = events.filter(event => event.isHighlight);
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate > today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedDayEvents = date
    ? events.filter(event => {
        const eventDate = new Date(event.date);
        return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      })
    : [];

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Events & Kurse</h1>

      {/* Highlight Events Karussell */}
      {highlightEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Highlight Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlightEvents.map(event => {
              const eventDate = new Date(event.date);
              return (
                <Card key={event.id} className="overflow-hidden">
                  {event.image && (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant="secondary">{event.type}</Badge>
                      <Badge variant="default" className="bg-primary">Highlight</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {format(eventDate, "dd. MMMM", { locale: de })}
                      </div>
                      <Button asChild>
                        <Link href={`/events/${event.id}`}>
                          Mehr erfahren
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Events Heute */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Heute</h2>
        {todayEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Keine Events für heute geplant
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todayEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Demnächst</h2>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Kalender View */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Kalenderansicht</TabsTrigger>
          <TabsTrigger value="upcoming">Eventliste</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-6">
            <Card>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={de}
                  showOutsideDays={false}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {date ? format(date, "dd. MMMM yyyy", { locale: de }) : "Wähle ein Datum"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Keine Events an diesem Tag
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedDayEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Alle Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date | string;
  location: string;
  type: string;
  isRecurring?: boolean;
  recurringType?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  image?: string;
  isHighlight?: boolean;
}

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.date);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{event.title}</h3>
              {event.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  {event.recurringType === "weekly" ? "Wöchentlich" : 
                   event.recurringType === "monthly" ? "Monatlich" :
                   event.recurringType === "daily" ? "Täglich" : "Wiederkehrend"}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {event.type === "course" ? "Kurs" : "Event"}
              </Badge>
              {event.isHighlight && (
                <Badge variant="default" className="bg-primary">Highlight</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(eventDate, "dd. MMMM yyyy", { locale: de })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(eventDate, "HH:mm")} Uhr
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
              {event.maxParticipants && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {event.currentParticipants || 0}/{event.maxParticipants} Teilnehmer
                </div>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/events/${event.id}`}>
              Mehr erfahren
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}