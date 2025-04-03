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
import { Bell, Home, Award, Users, MessageSquare, Plus, Check, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotificationStore, getNotificationIcon } from "../lib/notificationStore";

// Lokale Definition des Notification-Typs, falls der importierte nicht funktioniert
interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  time: Date;
  unread: boolean;
  link: string;
  entityId?: number;
  iconName: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { currentUser } = useUsers();
  const [isMobile, setIsMobile] = useState(false);
  
  // Ermittle, ob wir uns auf einem Mobilgerät befinden
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Event-Listener für Fenstergrößenänderungen
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  // Verwende den Notification Store statt Mock-Daten
  const { 
    notifications,
    markAllAsRead,
    markAsRead,
    getUnreadCount
  } = useNotificationStore();
  
  // Berechne diese Werte in einem useEffect oder einer Memo-Funktion,
  // um ungewollte Re-Renders zu vermeiden
  const [groupedNotifications, setGroupedNotifications] = useState<Record<string, any>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Aktualisiere die Werte, wenn sich die Benachrichtigungen ändern
  useEffect(() => {
    setUnreadCount(getUnreadCount());
    setGroupedNotifications(useNotificationStore.getState().getGroupedNotifications());
  }, [notifications, getUnreadCount]);

  // Keine Init-Benachrichtigungen mehr nötig, werden durch Events erzeugt

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Gerade eben";
    if (diffInMinutes < 60) return `Vor ${diffInMinutes} Minuten`;
    if (diffInMinutes < 1440) return `Vor ${Math.floor(diffInMinutes / 60)} Stunden`;
    return format(date, "dd.MM.yyyy");
  };

  if (!currentUser) return null;
  
  // Diese Funktion prüft, ob ein Navigationspfad aktiv ist
  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header - für Mobile und Desktop */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className={cn(
          "flex items-center justify-between h-full",
          isMobile ? "px-4" : "container px-4 mx-auto"
        )}>
          {/* Logo - für Mobile und Desktop */}
          <Link href="/" className="flex items-center">
            <img
              src="/assets/logo.png"
              alt="Multiness Logo"
              className="h-12 w-auto object-contain hover:opacity-80 transition-opacity py-1.5 dark:invert dark:brightness-200 dark:contrast-200"
            />
          </Link>

          {/* Desktop-Navigation in der Kopfzeile */}
          {!isMobile && (
            <div className="flex items-center space-x-1">
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
              
              {/* Erstellen-Button für Desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="ml-2 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Erstellen</span>
              </Button>
            </div>
          )}

          {/* Rechte Seite mit Benachrichtigungen und User-Menü - für Mobile und Desktop */}
          <div className="flex items-center gap-2">
            {/* Suchknopf - nur auf Desktop */}
            {!isMobile && (
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
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
                  {Object.keys(groupedNotifications).length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Keine Benachrichtigungen vorhanden
                    </div>
                  ) : (
                    Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                      <div key={type}>
                        <div className="px-3 py-2 bg-muted/50">
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {type === 'challenge' ? 'Challenges' :
                              type === 'group' ? 'Gruppen' :
                              type === 'event' ? 'Events' :
                              type === 'post' ? 'Beiträge' :
                              type === 'admin' ? 'Admin-Mitteilungen' :
                              type === 'product' ? 'Produkte' : type}
                          </span>
                        </div>
                        {typeNotifications.map((notification: any) => {
                          const IconComponent = getNotificationIcon(notification.iconName);
                          return (
                            <DropdownMenuItem
                              key={notification.id}
                              className={cn(
                                "p-3 cursor-pointer flex items-start gap-3",
                                notification.unread && "bg-muted/50"
                              )}
                              onClick={() => {
                                markAsRead(notification.id);
                                setLocation(notification.link);
                              }}
                            >
                              <div className="mt-1">
                                <IconComponent className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
                                    {notification.title}
                                    {notification.unread && (
                                      <span className="ml-2">
                                        <Badge variant="secondary" className="text-xs">Neu</Badge>
                                      </span>
                                    )}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatNotificationTime(notification.time)}
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
                    ))
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
                <DropdownMenuItem>
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content - angepasst für Mobile und Desktop */}
      <main className={cn(
        "min-h-screen bg-background",
        isMobile ? "pt-14 pb-16" : "pt-14 pb-4",
        !isMobile && "container mx-auto px-4"
      )}>
        {children}
      </main>

      {/* Bottom Navigation - nur für Mobile sichtbar */}
      {isMobile && <Navigation onCreateClick={() => setCreateModalOpen(true)} />}

      {/* Create Modal */}
      <CreateModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}