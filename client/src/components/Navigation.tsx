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
      <div className="grid grid-cols-5 h-full">
        <Link href="/">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
            className="w-full h-full rounded-none"
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        
        <Link href="/challenges">
          <Button
            variant={isActive("/challenges") ? "default" : "ghost"}
            size="icon"
            className="w-full h-full rounded-none"
          >
            <Award className="h-5 w-5" />
          </Button>
        </Link>

        <Button
          variant="default"
          size="icon"
          className="w-full h-full rounded-none bg-primary"
          onClick={onCreateClick}
        >
          <Plus className="h-6 w-6" />
        </Button>

        <Link href="/groups">
          <Button
            variant={isActive("/groups") ? "default" : "ghost"}
            size="icon"
            className="w-full h-full rounded-none"
          >
            <Users className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/chat">
          <Button
            variant={isActive("/chat") ? "default" : "ghost"}
            size="icon"
            className="w-full h-full rounded-none"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}
