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
              <CarouselItem key={user.id} className="pl-2 basis-1/3">
                <UserCard user={user} onVerify={toggleVerification} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-2 flex justify-center gap-1">
            <span className="text-xs text-muted-foreground">←</span>
            <span className="text-xs text-muted-foreground">Horizontal scrollen für mehr</span>
            <span className="text-xs text-muted-foreground">→</span>
          </div>
        </Carousel>
      </div>

      {/* Desktop: Grid-Layout */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-4">
        {users.slice(0, 12).map((user) => (
          <UserCard key={user.id} user={user} onVerify={toggleVerification} />
        ))}
      </div>
    </>
  );
}

function UserCard({ user, onVerify }: { user: any, onVerify: (id: number) => void }) {
  return (
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
            onClick={() => onVerify(user.id)}
          >
            {user.username}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}