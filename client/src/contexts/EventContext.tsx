import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date | string;
  endDate?: Date | string;
  image: string;
  gallery?: string[];
  type: "event" | "course";
  creatorId: number;
  location: string;
  currentParticipants?: number;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringType?: "daily" | "weekly" | "monthly";
  isHighlight?: boolean;
  isArchived?: boolean;
  isActive?: boolean;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  groupId?: number | null;
  likes?: number;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  addEvent: (event: Omit<Event, "id">) => Promise<Event>;
  updateEvent: (event: Event) => Promise<Event>;
  archiveEvent: (id: number) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Lade Events von der API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error(`Fehler beim Laden der Events: ${response.statusText}`);
      }
      const data = await response.json();
      setEvents(data);
      saveEventsToLocalStorage(data);
      console.log("Events von der API geladen:", data);
    } catch (error) {
      console.error("Fehler beim Laden der Events:", error);
      // Versuche, Events aus dem lokalen Speicher zu laden
      const storedEvents = loadEventsFromLocalStorage();
      if (storedEvents.length > 0) {
        console.log("Events aus lokalem Speicher geladen:", storedEvents);
        setEvents(storedEvents);
      }
      toast({
        title: "Fehler",
        description: "Events konnten nicht geladen werden. Verwendet werden lokal gespeicherte Daten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Speichern und Laden von Events im lokalen Speicher
  const saveEventsToLocalStorage = (eventsData: Event[]) => {
    localStorage.setItem('events', JSON.stringify(eventsData));
  };

  const loadEventsFromLocalStorage = (): Event[] => {
    try {
      const storedEvents = localStorage.getItem('events');
      return storedEvents ? JSON.parse(storedEvents) : [];
    } catch (error) {
      console.error("Fehler beim Laden der Events aus dem lokalen Speicher:", error);
      return [];
    }
  };

  // Lade Events beim ersten Rendern
  useEffect(() => {
    fetchEvents();

    // Automatische Aktualisierung alle 5 Minuten
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatische Archivierung von abgelaufenen Events
  useEffect(() => {
    const checkExpiredEvents = () => {
      const now = new Date();
      setEvents(prevEvents =>
        prevEvents.map(event => {
          const eventDate = new Date(event.date);
          // Wenn das Event abgelaufen ist und nicht wiederkehrend
          if (!event.isRecurring && eventDate < now && !event.isArchived) {
            return { ...event, isArchived: true, isActive: false };
          }
          // Wenn das Event wiederkehrend ist, prüfen wir basierend auf dem Typ
          if (event.isRecurring && !event.isArchived) {
            const daysPassed = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
            let shouldArchive = false;

            switch (event.recurringType) {
              case "daily":
                shouldArchive = daysPassed > 1;
                break;
              case "weekly":
                shouldArchive = daysPassed > 7;
                break;
              case "monthly":
                shouldArchive = daysPassed > 30;
                break;
            }

            if (shouldArchive) {
              return { ...event, isArchived: true, isActive: false };
            }
          }
          return event;
        })
      );
    };

    // Prüfe alle 5 Minuten auf abgelaufene Events
    const interval = setInterval(checkExpiredEvents, 5 * 60 * 1000);
    checkExpiredEvents(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const refreshEvents = async () => {
    await fetchEvents();
  };

  const addEvent = async (eventData: Omit<Event, "id">): Promise<Event> => {
    try {
      const response = await apiRequest("POST", "/api/events", eventData);
      if (!response.ok) {
        throw new Error(`Fehler beim Erstellen des Events: ${response.statusText}`);
      }
      
      const newEvent = await response.json();
      setEvents(prev => {
        const updated = [...prev, newEvent];
        saveEventsToLocalStorage(updated);
        return updated;
      });
      
      toast({
        title: "Event erstellt",
        description: "Das Event wurde erfolgreich erstellt.",
      });
      
      return newEvent;
    } catch (error) {
      console.error("Fehler beim Erstellen des Events:", error);
      toast({
        title: "Fehler",
        description: "Das Event konnte nicht erstellt werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEvent = async (updatedEvent: Event): Promise<Event> => {
    try {
      const response = await apiRequest("PATCH", `/api/events/${updatedEvent.id}`, updatedEvent);
      if (!response.ok) {
        throw new Error(`Fehler beim Aktualisieren des Events: ${response.statusText}`);
      }
      
      const updated = await response.json();
      
      setEvents(prev => {
        const updatedEvents = prev.map(event => 
          event.id === updated.id ? updated : event
        );
        saveEventsToLocalStorage(updatedEvents);
        return updatedEvents;
      });
      
      toast({
        title: "Event aktualisiert",
        description: "Das Event wurde erfolgreich aktualisiert.",
      });
      
      return updated;
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Events:", error);
      toast({
        title: "Fehler",
        description: "Das Event konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const archiveEvent = async (id: number): Promise<void> => {
    try {
      const response = await apiRequest("PATCH", `/api/events/${id}`, { 
        isArchived: true, 
        isActive: false 
      });
      
      if (!response.ok) {
        throw new Error(`Fehler beim Archivieren des Events: ${response.statusText}`);
      }
      
      setEvents(prev => {
        const updatedEvents = prev.map(event =>
          event.id === id ? { ...event, isArchived: true, isActive: false } : event
        );
        saveEventsToLocalStorage(updatedEvents);
        return updatedEvents;
      });
      
      toast({
        title: "Event archiviert",
        description: "Das Event wurde erfolgreich archiviert.",
      });
    } catch (error) {
      console.error("Fehler beim Archivieren des Events:", error);
      toast({
        title: "Fehler",
        description: "Das Event konnte nicht archiviert werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEvent = async (id: number): Promise<void> => {
    try {
      const response = await apiRequest("DELETE", `/api/events/${id}`);
      if (!response.ok) {
        throw new Error(`Fehler beim Löschen des Events: ${response.statusText}`);
      }
      
      setEvents(prev => {
        const updatedEvents = prev.filter(event => event.id !== id);
        saveEventsToLocalStorage(updatedEvents);
        return updatedEvents;
      });
      
      toast({
        title: "Event gelöscht",
        description: "Das Event wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error("Fehler beim Löschen des Events:", error);
      toast({
        title: "Fehler",
        description: "Das Event konnte nicht gelöscht werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{ 
      events, 
      loading,
      addEvent, 
      updateEvent, 
      archiveEvent, 
      deleteEvent,
      refreshEvents
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
}