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
import { UsernameWithVerification } from "./UserAvatar";

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
                className="w-12 h-12"
              />
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] truncate max-w-[60px] p-1 h-auto hover:bg-transparent"
                  onClick={() => toggleVerification(user.id)}
                >
                  <span className="truncate">{user.username}</span>
                </Button>
                {user.isVerified && (
                  <svg
                    className="w-3 h-3 text-primary flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}