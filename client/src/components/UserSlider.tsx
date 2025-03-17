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
          <CarouselItem key={user.id} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                userId={user.id}
                size="md"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs leading-tight min-h-[2.5rem] px-1 h-auto w-full whitespace-normal text-center"
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