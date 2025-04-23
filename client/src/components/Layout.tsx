import { useState, useEffect } from "react";
import Navigation from "./Navigation";
import CreateModal from "./CreateModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation, Link } from "wouter";
import { Bell, Check, Home, Award, Users, MessageSquare, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotificationStore, getNotificationIcon } from "../lib/notificationStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { currentUser } = useUsers();
  
  // Hilfsfunktion zur Bestimmung des aktiven Menüpunkts
  const isActive = (path: string) => location === path;
  
  // Responsives Design - prüfe Bildschirmgröße
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    // Funktion zur Prüfung der Bildschirmgröße
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Unter 768px gilt als mobil
    };
    
    // Event-Listener für Größenänderungen
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup beim Unmount
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Verwende den Notification Store
  const { 
    notifications,
    markAllAsRead,
    markAsRead,
    getUnreadCount
  } = useNotificationStore();
  
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Aktualisiere den Unread-Count, wenn sich die Benachrichtigungen ändern
  useEffect(() => {
    setUnreadCount(getUnreadCount());
  }, [notifications, getUnreadCount]);
  
  const formatNotificationTime = (date: Date | string) => {
    // Stelle sicher, dass date ein Date-Objekt ist
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Prüfe auf gültiges Datum
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "Unbekannt";
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Gerade eben";
    if (diffInMinutes < 60) return `Vor ${diffInMinutes} Minuten`;
    if (diffInMinutes < 1440) return `Vor ${Math.floor(diffInMinutes / 60)} Stunden`;
    return format(dateObj, "dd.MM.yyyy");
  };

  if (!currentUser) return null;

  // Sortiere Benachrichtigungen nach Zeitstempel (neueste zuerst)
  const sortedNotifications = Object.values(notifications).sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    // Fallback falls ein oder beide Datumswerte ungültig sind
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1; // A ist ungültig, B nach vorne
    if (isNaN(dateB.getTime())) return -1; // B ist ungültig, A nach vorne
    // Normale Sortierung wenn beide Datumsangaben gültig sind
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className={cn(
          "flex items-center justify-between h-full",
          isMobile ? "px-4" : "container mx-auto px-4"
        )}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/assets/logo.png"
                alt="Multiness Logo"
                className="h-12 w-auto object-contain hover:opacity-80 transition-opacity py-1.5 dark:invert dark:brightness-200 dark:contrast-200"
              />
            </Link>
            
            {/* Desktop-Navigation im Header */}
            {!isMobile && (
              <div className="flex items-center ml-8 space-x-1">
                <Link href="/">
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Start</span>
                  </Button>
                </Link>
                
                <Link href="/challenges">
                  <Button
                    variant={isActive("/challenges") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    <span>Challenges</span>
                  </Button>
                </Link>
                
                <Link href="/groups">
                  <Button
                    variant={isActive("/groups") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Gruppen</span>
                  </Button>
                </Link>
                
                <Link href="/chat">
                  <Button
                    variant={isActive("/chat") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Erstellen-Button für Desktop */}
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 mr-2"
              >
                <Plus className="h-4 w-4" />
                <span>Erstellen</span>
              </Button>
            )}
            
            {/* Benachrichtigungen */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <h4 className="font-semibold">Benachrichtigungen</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3" />
                    Alle als gelesen markieren
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  {sortedNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Keine Benachrichtigungen vorhanden
                    </div>
                  ) : (
                    <div>
                      {sortedNotifications.map((notification) => {
                        const IconComponent = getNotificationIcon(notification.type);
                        return (
                          <DropdownMenuItem
                            key={notification.id}
                            className={cn(
                              "p-3 cursor-pointer flex items-start gap-3",
                              !notification.read && "bg-muted/50"
                            )}
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.actionUrl) {
                                setLocation(notification.actionUrl);
                              }
                            }}
                          >
                            <div className="mt-1">
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                  {!notification.read && (
                                    <span className="ml-2">
                                      <Badge variant="secondary" className="text-xs">Neu</Badge>
                                    </span>
                                  )}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatNotificationTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <UserAvatar
                    userId={currentUser.id}
                    size="sm"
                    showActiveGoal={false}
                    hideVerifiedBadge={true}
                  />
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
                <DropdownMenuItem onClick={() => {
                  const { logoutMutation } = require("../hooks/use-auth").useAuth();
                  logoutMutation.mutate();
                  setTimeout(() => {
                    setLocation("/auth");
                  }, 500);
                }}>
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content - angepasst für Desktop/Mobile */}
      <main className={cn(
        "pt-14", // Gemeinsame Einstellung
        isMobile ? "pb-20" : "pb-4", // Mehr Padding unten für mobile Ansicht
        !isMobile && "container mx-auto px-4" // Zusätzliche Styles für Desktop
      )}>
        {children}
        {/* Zusätzlicher Spacer für die mobile Ansicht */}
        {isMobile && <div className="h-16 w-full"></div>}
      </main>

      {/* Navigation wird auch im Desktop-Modus angezeigt, wird aber intern angepasst */}
      <Navigation onCreateClick={() => setCreateModalOpen(true)} />

      {/* Create Modal */}
      <CreateModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}