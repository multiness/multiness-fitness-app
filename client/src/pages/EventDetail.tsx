import { useParams, useLocation } from "wouter";
import { useEvents } from "@/contexts/EventContext";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Edit, Trash2, MessageSquare } from "lucide-react";
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

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { events, deleteEvent, updateEvent } = useEvents();
  const { toast } = useToast();
  const { user } = useUser();
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

  if (!event) {
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Admin Actions */}
        {user?.isAdmin && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/events/edit/${event.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Event löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden.
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
        )}

        {/* Event Header */}
        <Card className="overflow-hidden">
          <div className="h-64 relative">
            <img
              src={event.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {event.isRecurring && (
              <Badge variant="secondary" className="absolute top-4 right-4">
                Wiederkehrend
              </Badge>
            )}
          </div>
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{event.type === "event" ? "Event" : "Kurs"}</Badge>
              {event.isRecurring && (
                <Badge variant="outline">
                  {event.recurringType === "daily" ? "Täglich" :
                   event.recurringType === "weekly" ? "Wöchentlich" : "Monatlich"}
                </Badge>
              )}
              {event.isPublic && (
                <Badge variant="outline" className="bg-primary text-primary-foreground">
                  Öffentlich
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-lg mb-2">
                <CalendarDays className="h-5 w-5" />
                <span>Termin</span>
              </div>
              <p>{format(new Date(event.date), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
              <p>{format(new Date(event.date), "HH:mm", { locale: de })} Uhr</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-lg mb-2">
                <MapPin className="h-5 w-5" />
                <span>Ort</span>
              </div>
              <p>{event.location}</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
          </CardContent>
        </Card>

        {/* Participants */}
        {(event.maxParticipants || event.currentParticipants) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  <span>Teilnehmer</span>
                </div>
                <p className="text-muted-foreground">
                  {event.currentParticipants} von {event.maxParticipants || "∞"}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                {!user && event.isPublic && event.requiresRegistration ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        Anmelden
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Anmeldung: {event.title}</DialogTitle>
                        <DialogDescription>
                          Bitte füllen Sie das Formular aus, um sich für dieses Event anzumelden.
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
                  <Button 
                    disabled={event.currentParticipants === event.maxParticipants}
                    onClick={() => {
                      if (user) {
                        toast({
                          title: "Info",
                          description: "Sie sind bereits als Mitglied angemeldet.",
                        });
                      }
                    }}
                  >
                    {event.currentParticipants === event.maxParticipants ? "Ausgebucht" : 
                     user ? "Teilnehmen" : "Login erforderlich"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Galerie</CardTitle>
          </CardHeader>
          <CardContent>
            <EventGallery
              images={[event.image, ...(event.gallery || [])].filter(Boolean)}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              isEditable={user?.isAdmin}
            />
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Kommentare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventComments eventId={event.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}