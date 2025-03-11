import { useState } from "react";
import Navigation from "./Navigation";
import CreateModal from "./CreateModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { mockUsers } from "../data/mockData";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const currentUser = mockUsers[0]; // Using first mock user as current user

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <h1 className="text-xl font-bold">Multiness</h1>

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