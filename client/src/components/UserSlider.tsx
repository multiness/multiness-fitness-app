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
import { Link } from "wouter";

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
      {/* Mobile: Karussell-Layout mit optimiertem Abstand und Styling */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 px-2">
            {users.map((user) => (
              <CarouselItem key={user.id} className="pl-3 pr-1 basis-[40%]">
                <UserCard user={user} onVerify={toggleVerification} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: Grid-Layout - Größere Karten mit optimiertem Abstand */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-4">
        {users.slice(0, 10).map((user) => (
          <UserCard key={user.id} user={user} onVerify={toggleVerification} />
        ))}
      </div>
    </>
  );
}

function UserCard({ user, onVerify }: { user: any, onVerify: (id: number) => void }) {
  return (
    <Link href={`/profile/${user.id}`} className="block transition-all hover:opacity-90">
      <div className="flex flex-col items-center gap-6 p-4 md:p-5 cursor-pointer">
        {/* Größerer Avatar-Container für bessere Sichtbarkeit */}
        <div className="flex justify-center items-center relative">
          <UserAvatar
            userId={user.id}
            size="lg"
            className="w-full h-full scale-125" // Vergrößerter Avatar
            disableLink={true} // Wir verwenden jetzt Link oben statt im Avatar
            hideVerifiedBadge={false} // Zeige Verifizierungsbadge wenn der Nutzer verifiziert ist
            clickable={false} // Deaktiviere interne Klickbarkeit, da wir Link oben verwenden
          />
        </div>
        
        {/* Benutzerinformationen untereinander */}
        <div className="w-full text-center">
          <h3 className="font-medium text-base mb-2">
            {user.name || user.username}
          </h3>
          
          {/* Position/Rolle anzeigen wenn verfügbar */}
          {user.position && (
            <p className="text-sm text-muted-foreground">
              {user.position}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}