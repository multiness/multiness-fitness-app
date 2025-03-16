import { useParams } from "wouter";
import { useEvents } from "@/contexts/EventContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Target } from "lucide-react";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { events } = useEvents();
  const event = events.find(e => e.id === parseInt(id));

  if (!event) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Event nicht gefunden</h1>
        <p>Das angeforderte Event existiert nicht oder wurde gelöscht.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <div className="relative h-64 rounded-t-xl overflow-hidden mb-6">
          <img
            src={event.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.isRecurring && (
            <Badge variant="secondary" className="absolute top-4 right-4">
              Wiederkehrendes Event
            </Badge>
          )}
        </div>

        {/* Event Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{event.type === "event" ? "Event" : "Kurs"}</Badge>
              {event.isRecurring && (
                <Badge variant="outline">
                  {event.recurringType === "daily" ? "Täglich" : 
                   event.recurringType === "weekly" ? "Wöchentlich" : "Monatlich"}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-muted-foreground">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Termin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{format(event.date, "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                <p>{format(event.date, "HH:mm", { locale: de })} Uhr</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ort
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.location}</p>
              </CardContent>
            </Card>
          </div>

          {/* Teilnehmer Info */}
          {(event.maxParticipants || event.currentParticipants) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teilnehmer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p>
                    {event.currentParticipants} von {event.maxParticipants} Plätzen belegt
                  </p>
                  <Button disabled={event.currentParticipants === event.maxParticipants}>
                    {event.currentParticipants === event.maxParticipants ? 
                      "Ausgebucht" : "Teilnehmen"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
