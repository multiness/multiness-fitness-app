import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import { Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GroupSlider() {
  const { currentUser } = useUsers();
  const groupStore = useGroupStore();
  const groups = Object.values(groupStore.groups);

  // Sortiere Gruppen: Zuerst die, wo der User Mitglied ist
  const sortedGroups = [...groups].sort((a, b) => {
    const aIsMember = a.participantIds?.includes(currentUser?.id || 0);
    const bIsMember = b.participantIds?.includes(currentUser?.id || 0);
    return bIsMember ? 1 : aIsMember ? -1 : 0;
  });

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {sortedGroups.map((group) => {
            const isCreator = group.creatorId === currentUser?.id;
            const isAdmin = group.adminIds?.includes(currentUser?.id || 0);
            const isMember = group.participantIds?.includes(currentUser?.id || 0);

            return (
              <CarouselItem key={group.id} className="pl-2 basis-[80%] sm:basis-[40%] md:basis-[30%]">
                <Link href={`/chat/group-${group.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {group.image ? (
                          <img 
                            src={group.image} 
                            alt={group.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Users2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate">{group.name}</h3>
                            <Badge variant={isCreator ? "default" : "secondary"} className="ml-2">
                              {isCreator ? 'Admin' : (isAdmin ? 'Co-Admin' : (isMember ? 'Mitglied' : ''))}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex -space-x-2">
                              {group.participantIds?.slice(0, 3).map((participantId) => (
                                <UserAvatar
                                  key={participantId}
                                  userId={participantId}
                                  size="xs"
                                />
                              ))}
                              {(group.participantIds?.length || 0) > 3 && (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                  +{(group.participantIds?.length || 0) - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {group.participantIds?.length || 0} Mitglieder
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
