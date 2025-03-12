import { useState } from "react";
import Navigation from "./Navigation";
import CreateModal from "./CreateModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { mockUsers } from "../data/mockData";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const currentUser = mockUsers[0]; // Using first mock user as current user
  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <Link href="/" className="flex items-center">
            <img 
              src="/assets/logo.png" 
              alt="Multiness Logo" 
              className="h-12 w-auto object-contain hover:opacity-80 transition-opacity py-1.5"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs bg-blue-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <h4 className="font-semibold">Benachrichtigungen</h4>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Alle als gelesen markieren
                  </Button>
                </div>
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

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.username} />
                    <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation(`/profile/${currentUser.id}`)}>
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {currentUser.isAdmin && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <Navigation onCreateClick={() => setCreateModalOpen(true)} />

      {/* Create Modal */}
      <CreateModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}