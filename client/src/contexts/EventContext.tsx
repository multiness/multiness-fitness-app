import { createContext, useContext, useState, useEffect } from "react";
import { mockEvents as initialEvents } from "@/data/mockData";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  image: string;
  type: "event" | "course";
  trainer: number;
  location: string;
  currentParticipants?: number;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringType?: "daily" | "weekly" | "monthly";
  isArchived?: boolean;
  isActive?: boolean;
}

interface EventContextType {
  events: Event[];
  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (event: Event) => void;
  archiveEvent: (id: number) => void;
  deleteEvent: (id: number) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);

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

  const addEvent = (event: Omit<Event, "id">) => {
    const newEvent = {
      ...event,
      id: Math.max(...events.map(e => e.id)) + 1,
      isActive: true,
      isArchived: false
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => {
      if (event.id === updatedEvent.id) {
        // Wenn das Datum in der Zukunft liegt, aktiviere das Event wieder
        const eventDate = new Date(updatedEvent.date);
        const now = new Date();
        const isInFuture = eventDate > now;

        return {
          ...updatedEvent,
          isArchived: isInFuture ? false : updatedEvent.isArchived,
          isActive: isInFuture ? true : updatedEvent.isActive
        };
      }
      return event;
    }));
  };

  const archiveEvent = (id: number) => {
    setEvents(prev => prev.map(event =>
      event.id === id ? { ...event, isArchived: true, isActive: false } : event
    ));
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, archiveEvent, deleteEvent }}>
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