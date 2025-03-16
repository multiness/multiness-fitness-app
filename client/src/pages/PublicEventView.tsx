import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import { useToast } from "@/hooks/use-toast";

export default function PublicEventView({ slug }: { slug: string }) {
  const { toast } = useToast();
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['/api/events/public', slug],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-xl mb-6"></div>
          <div className="h-8 bg-muted rounded mb-4 w-2/3"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-8">
            <h1 className="text-2xl font-bold mb-4">Event nicht gefunden</h1>
            <p className="text-muted-foreground">
              Das angeforderte Event existiert nicht oder wurde gelöscht.
            </p>
          </CardContent>
        </Card>
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
        </div>

        {/* Event Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{event.type === "event" ? "Event" : "Kurs"}</Badge>
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
                <p>{format(new Date(event.date), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
                <p>{format(new Date(event.date), "HH:mm", { locale: de })} Uhr</p>
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

          {/* Registration Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anmeldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p>
                  {event.currentParticipants} von {event.maxParticipants || "∞"} Plätzen belegt
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      Jetzt anmelden
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Anmeldung: {event.title}</DialogTitle>
                      <DialogDescription>
                        Bitte füllen Sie das Formular aus, um sich für dieses Event anzumelden.
                        Sie erhalten eine Bestätigung per E-Mail.
                      </DialogDescription>
                    </DialogHeader>
                    <EventRegistrationForm 
                      eventId={event.id} 
                      onSuccess={() => {
                        toast({
                          title: "Anmeldung erfolgreich",
                          description: "Sie erhalten in Kürze eine Bestätigung per E-Mail.",
                        });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}