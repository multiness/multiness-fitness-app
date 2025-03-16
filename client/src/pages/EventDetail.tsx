import { useParams, useLocation } from "wouter";
import { useEvents } from "@/contexts/EventContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Edit, Trash2, Link as LinkIcon, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventGallery from "@/components/EventGallery";
import EventComments from "@/components/EventComments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import { Input } from "@/components/ui/input";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { events, deleteEvent, updateEvent } = useEvents();
  const { toast } = useToast();
  const event = events.find(e => e.id === parseInt(id));

  const handleDelete = () => {
    if (!event) return;
    deleteEvent(event.id);
    toast({
      title: "Event gelöscht",
      description: "Das Event wurde erfolgreich gelöscht.",
    });
    setLocation("/events/manager");
  };

  const handleAddImage = (image: string) => {
    if (!event) return;
    const updatedEvent = {
      ...event,
      gallery: [...(event.gallery || []), image],
    };
    updateEvent(updatedEvent);
    toast({
      title: "Bild hinzugefügt",
      description: "Das Bild wurde erfolgreich zur Galerie hinzugefügt.",
    });
  };

  const handleRemoveImage = (index: number) => {
    if (!event) return;
    const gallery = [...(event.gallery || [])];
    gallery.splice(index, 1);
    const updatedEvent = {
      ...event,
      gallery,
    };
    updateEvent(updatedEvent);
    toast({
      title: "Bild entfernt",
      description: "Das Bild wurde erfolgreich aus der Galerie entfernt.",
    });
  };

  const handleCopyLink = async () => {
    if (!event.slug) return;
    const publicUrl = `${window.location.origin}/events/p/${event.slug}`;
    await navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Link kopiert",
      description: "Der öffentliche Event-Link wurde in die Zwischenablage kopiert.",
    });
  };

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
        {/* Admin Actions */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation(`/events/edit/${event.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Event wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Das Event wird permanent gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Public URL Section - only show if event is public */}
        {event.isPublic && event.slug && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Öffentlicher Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/events/p/${event.slug}`}
                  className="font-mono"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dieser Link kann mit externen Teilnehmern geteilt werden.
              </p>
            </CardContent>
          </Card>
        )}

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

          {/* Event Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Event Galerie</CardTitle>
            </CardHeader>
            <CardContent>
              <EventGallery
                images={[event.image, ...(event.gallery || [])].filter(Boolean)}
                onAddImage={handleAddImage}
                onRemoveImage={handleRemoveImage}
                isEditable={true}
              />
            </CardContent>
          </Card>

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
                    {event.currentParticipants} von {event.maxParticipants || "∞"} Plätzen belegt
                  </p>
                  {event.isPublic ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          Teilnehmen
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
                  ) : (
                    <Button disabled={event.currentParticipants === event.maxParticipants}>
                      {event.currentParticipants === event.maxParticipants ? "Ausgebucht" : "Teilnehmen"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Kommentare & Diskussion</CardTitle>
            </CardHeader>
            <CardContent>
              <EventComments eventId={event.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}