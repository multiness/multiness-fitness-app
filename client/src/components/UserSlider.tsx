import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useUsers } from "../contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
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
              <CarouselItem key={user.id} className="pl-2 basis-[30%]">
                <UserCard user={user} onVerify={toggleVerification} />
              </CarouselItem>
            ))}
          </CarouselContent>
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