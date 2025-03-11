import { Home, Award, Users, MessageSquare, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationProps {
  onCreateClick: () => void;
}

// Mock notifications for testing
const mockNotifications = [
  {
    id: 1,
    title: "Neue Challenge",
    message: "Eine neue Fitness Challenge wurde erstellt",
    time: "Vor 5 Minuten",
    unread: true,
  },
  {
    id: 2,
    title: "Gruppeneinladung",
    message: "Du wurdest zur Gruppe 'Morning Workout' eingeladen",
    time: "Vor 30 Minuten",
    unread: true,
  },
  {
    id: 3,
    title: "Trainingserinnerung",
    message: "Dein geplantes Training beginnt in 15 Minuten",
    time: "Vor 1 Stunde",
    unread: false,
  },
];

export default function Navigation({ onCreateClick }: NavigationProps) {
  const [location] = useLocation();
  const unreadCount = mockNotifications.filter(n => n.unread).length;

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container max-w-xl mx-auto h-full">
        {/* Navigation Items with Plus Button in the middle */}
        <div className="grid grid-cols-5 h-full">
          {/* First two items */}
          <div className="col-span-2 grid grid-cols-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-none"
              >
                <Home className={`h-6 w-6 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </Link>

            <Link href="/challenges">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-none"
              >
                <Award className={`h-6 w-6 ${isActive("/challenges") ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </Link>
          </div>

          {/* Center column for Plus Button */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/3 w-14 h-14 rounded-full bg-background border-2 hover:bg-muted"
              onClick={onCreateClick}
            >
              <Plus className="h-6 w-6 text-primary" />
            </Button>
          </div>

          {/* Last two items */}
          <div className="col-span-2 grid grid-cols-2">
            <Link href="/groups">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-none"
              >
                <Users className={`h-6 w-6 ${isActive("/groups") ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </Link>

            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-full h-full rounded-none"
                  >
                    <Bell className={`h-6 w-6 ${isActive("/notifications") ? "text-primary" : "text-muted-foreground"}`} />
                    {unreadCount > 0 && (
                      <span className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center text-xs bg-blue-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <ScrollArea className="h-[300px]">
                    {mockNotifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-3 cursor-pointer ${notification.unread ? 'bg-muted/50' : ''}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{notification.title}</p>
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}