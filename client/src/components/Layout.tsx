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
import { Bell, Dumbbell, Users2, Calendar, Package, Clock, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extended notifications interface
interface Notification {
  id: number;
  type: 'challenge' | 'group' | 'event' | 'product';
  title: string;
  message: string;
  time: Date;
  unread: boolean;
  link: string;
  icon: any;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { currentUser } = useUsers();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load and sync notifications
  useEffect(() => {
    const loadNotifications = () => {
      const savedNotifications = localStorage.getItem('fitness-app-notifications');
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      }
    };

    // Initial load
    loadNotifications();

    // Listen for updates
    const handleStorageChange = () => loadNotifications();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notificationAdded', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationAdded', handleStorageChange);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = [];
    }
    acc[notification.type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updatedNotifications);
    localStorage.setItem('fitness-app-notifications', JSON.stringify(updatedNotifications));
  };

  const markAsRead = (id: number) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, unread: false } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('fitness-app-notifications', JSON.stringify(updatedNotifications));
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Gerade eben";
    if (diffInMinutes < 60) return `Vor ${diffInMinutes} Minuten`;
    if (diffInMinutes < 1440) return `Vor ${Math.floor(diffInMinutes / 60)} Stunden`;
    return format(date, "dd.MM.yyyy");
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <Link href="/" className="flex items-center">
            <img
              src="/assets/logo.png"
              alt="Multiness Logo"
              className="h-12 w-auto object-contain hover:opacity-80 transition-opacity py-1.5 dark:invert dark:brightness-200 dark:contrast-200"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Notifications */}
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
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <div key={type}>
                      <div className="px-3 py-2 bg-muted/50">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {type === 'challenge' ? 'Challenges' :
                            type === 'group' ? 'Gruppen' :
                            type === 'event' ? 'Events' :
                            type === 'product' ? 'Produkte' : type}
                        </span>
                      </div>
                      {typeNotifications.map((notification) => (
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
                            <notification.icon className="h-5 w-5 text-muted-foreground" />
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
                      ))}
                    </div>
                  ))}
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