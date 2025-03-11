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

// Mock Events (In einer echten App würden diese aus der DB kommen)
const mockEvents = [
  {
    id: 1,
    title: "Yoga im Park",
    description: "Starte deinen Tag mit einer energiegeladenen Yoga-Session im Stadtpark.",
    date: new Date(2025, 2, 15, 8, 0),
    location: "Stadtpark",
    type: "Kurs",
    isRecurring: true,
    recurringType: "weekly",
    maxParticipants: 20,
    currentParticipants: 12,
  },
  {
    id: 2,
    title: "HIIT Workout",
    description: "Intensives Intervalltraining für maximale Fettverbrennung.",
    date: new Date(2025, 2, 16, 18, 30),
    location: "Fitness Studio",
    type: "Kurs",
    isRecurring: true,
    recurringType: "weekly",
    maxParticipants: 15,
    currentParticipants: 8,
  },
  // Weitere Events hier...
];

export default function Events() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Gruppiere Events nach Datum
  const upcomingEvents = mockEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Filter Events für den ausgewählten Tag
  const selectedDayEvents = date 
    ? mockEvents.filter(event => 
        format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
    : [];

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Events & Kurse</h1>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
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
              <CardTitle>Kommende Events</CardTitle>
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

function EventCard({ event }: { event: typeof mockEvents[0] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{event.title}</h3>
              {event.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  Wöchentlich
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {event.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(event.date, "dd. MMMM yyyy", { locale: de })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(event.date, "HH:mm")} Uhr
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event.currentParticipants}/{event.maxParticipants} Teilnehmer
              </div>
            </div>
          </div>
          <Button>
            Teilnehmen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
