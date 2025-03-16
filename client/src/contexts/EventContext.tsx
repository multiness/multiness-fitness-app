import { createContext, useContext, useState } from "react";
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
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
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
