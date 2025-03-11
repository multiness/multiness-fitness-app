import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "./VerifiedBadge";
import { useState } from "react";
import { mockUsers } from "../data/mockData";

export default function UserSlider() {
  const [users, setUsers] = useState(mockUsers);

  // Prototyp-Funktion zum Umschalten des Verifizierungsstatus
  const toggleVerification = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isVerified: !user.isVerified }
        : user
    ));
  };

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {users.map((user) => (
          <CarouselItem key={user.id} className="basis-1/5 md:basis-1/6 lg:basis-1/8">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge />
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm truncate max-w-full p-1 h-auto"
                onClick={() => toggleVerification(user.id)}
              >
                {user.username}
              </Button>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}