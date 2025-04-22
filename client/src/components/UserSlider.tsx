import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function UserSlider() {
  const { toggleVerification } = useUsers();
  const [users, setUsers] = useState<any[]>([]);
  
  // Lade Benutzer vom Server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
      }
    };
    
    fetchUsers();
  }, []);

  return (
    <>
      {/* Mobile: Karussell-Layout */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {users.map((user) => (
              <CarouselItem key={user.id} className="pl-2 basis-[30%]">
                <UserCard user={user} onVerify={toggleVerification} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: Grid-Layout - Größere Karten mit weniger Spalten */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {users.slice(0, 10).map((user) => (
          <UserCard key={user.id} user={user} onVerify={toggleVerification} />
        ))}
      </div>
    </>
  );
}

function UserCard({ user, onVerify }: { user: any, onVerify: (id: number) => void }) {
  return (
    <Card className="border-primary/10 hover:border-primary/20 transition-colors overflow-hidden shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col items-center gap-4">
          {/* Größerer Avatar-Container für bessere Sichtbarkeit */}
          <div className="flex justify-center items-center">
            <UserAvatar
              userId={user.id}
              size="lg"
              className="w-full h-full scale-125" // Vergrößerter Avatar
              disableLink={true}
            />
          </div>
          
          {/* Verbesserte Benutzernamendarstellung mit größerem Text */}
          <div className="w-full text-center mt-1">
            <h3 className="font-medium text-sm mb-1">
              {user.name || user.username}
            </h3>
            
            {/* Position/Rolle anzeigen wenn verfügbar */}
            {user.position && (
              <p className="text-xs text-muted-foreground mb-2">
                {user.position}
              </p>
            )}
            
            {/* Verifikations-Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm py-1.5 px-3 h-auto w-full mt-1"
              onClick={() => onVerify(user.id)}
            >
              {user.isVerified ? "Verifiziert" : "Verifizieren"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}