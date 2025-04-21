import { Home, Award, Users, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "../lib/chatService";

interface NavigationProps {
  onCreateClick: () => void;
}

export default function Navigation({ onCreateClick }: NavigationProps) {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(true);
  const chatStore = useChatStore();
  
  // Holen der Gesamtanzahl ungelesener Nachrichten
  const totalUnreadCount = chatStore.getTotalUnreadCount();
  
  // Prüfe Bildschirmgröße für responsives Layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const isActive = (path: string) => location === path;

  // Auf Desktop-Geräten einen unauffälligeren Footer anzeigen
  if (!isMobile) {
    return (
      <footer className="mt-8 py-4 border-t text-center text-sm text-muted-foreground">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-2">
            <p>© 2023 Multiness. Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-4">
              <Link href="/">Startseite</Link>
              <Link href="/challenges">Challenges</Link>
              <Link href="/groups">Gruppen</Link>
              <div className="relative inline-block">
                <Link href="/chat">Chat</Link>
                {totalUnreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center bg-primary text-primary-foreground rounded-full min-w-4 h-4 px-1 text-xs font-medium">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
              </div>
              <button 
                className="inline underline cursor-pointer"
                onClick={onCreateClick}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Auf mobilen Geräten die ursprüngliche Navigation anzeigen
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
              type="button"
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

            <Link href="/chat">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-none relative"
              >
                <MessageSquare className={`h-6 w-6 ${isActive("/chat") ? "text-primary" : "text-muted-foreground"}`} />
                {totalUnreadCount > 0 && (
                  <div className="absolute top-3 right-3 flex items-center justify-center bg-primary text-primary-foreground rounded-full min-w-5 h-5 px-1 text-xs font-medium">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}