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

export default function UserSlider() {
  const { users, toggleVerification } = useUsers();

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
              <UserAvatar
                userId={user.id}
                size="md"
              />
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