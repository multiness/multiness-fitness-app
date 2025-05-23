import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/contexts/EventContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, Plus, Search, Archive, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function EventManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { events, archiveEvent, deleteEvent } = useEvents();

  const filteredEvents = events.filter(event => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "active" && !event.isArchived) ||
      (filter === "archived" && event.isArchived);

    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleArchive = (eventId: number) => {
    archiveEvent(eventId);
    toast({
      title: "Event archiviert",
      description: "Das Event wurde erfolgreich archiviert.",
    });
  };

  const handleDelete = (eventId: number) => {
    deleteEvent(eventId);
    toast({
      title: "Event gelöscht",
      description: "Das Event wurde erfolgreich gelöscht.",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Manager</h1>
        <Button onClick={() => setLocation("/create/event")}>
          <Plus className="mr-2 h-4 w-4" /> Event erstellen
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Event Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Events durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Events</SelectItem>
                <SelectItem value="active">Aktive Events</SelectItem>
                <SelectItem value="archived">Archivierte Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Teilnehmer</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link href={`/events/${event.id}`} className="hover:underline">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.description.substring(0, 50)}...
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(event.date, "dd. MMMM yyyy", { locale: de })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.isArchived ? "secondary" : "default"}>
                        {event.isArchived ? "Archiviert" : "Aktiv"}
                      </Badge>
                      {event.isRecurring && (
                        <Badge variant="outline" className="ml-2">
                          Wiederkehrend ({event.recurringType})
                          {event.recurringType === "weekly" && event.recurringDays && event.recurringDays.length > 0 && (
                            <span className="ml-1">
                              ({event.recurringDays.map(day => {
                                const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
                                return days[day];
                              }).join(", ")})
                            </span>
                          )}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {event.type === "event" ? "Event" : "Kurs"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.currentParticipants}/{event.maxParticipants}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/events/${event.id}`}><Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button></Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleArchive(event.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}