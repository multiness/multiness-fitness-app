import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UserSlider() {
  const { users, toggleVerification } = useUsers();

  return (
    <div className="relative group">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {users.map((user) => (
            <CarouselItem key={user.id} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
              <Card className="border-primary/10 hover:border-primary/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2">
                    <UserAvatar
                      userId={user.id}
                      size="md"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs leading-tight h-auto w-full whitespace-normal text-center"
                      onClick={() => toggleVerification(user.id)}
                    >
                      {user.username}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity -left-12 bg-background border-primary/20 hover:bg-primary/5 hover:border-primary/30">
            <ChevronLeft className="h-4 w-4" />
          </CarouselPrevious>
          <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity -right-12 bg-background border-primary/20 hover:bg-primary/5 hover:border-primary/30">
            <ChevronRight className="h-4 w-4" />
          </CarouselNext>
        </div>
      </Carousel>
      <div className="mt-2 flex justify-center gap-1">
        <span className="text-xs text-muted-foreground">←</span>
        <span className="text-xs text-muted-foreground">Horizontal scrollen für mehr</span>
        <span className="text-xs text-muted-foreground">→</span>
      </div>
    </div>
  );
}