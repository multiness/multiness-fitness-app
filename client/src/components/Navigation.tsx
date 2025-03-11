import { Home, Award, Users, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface NavigationProps {
  onCreateClick: () => void;
}

export default function Navigation({ onCreateClick }: NavigationProps) {
  const [location] = useLocation();

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

            <Link href="/chat">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-none"
              >
                <MessageSquare className={`h-6 w-6 ${isActive("/chat") ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}