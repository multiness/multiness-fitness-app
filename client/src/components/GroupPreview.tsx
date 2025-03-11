import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Group } from "@shared/schema";
import { mockUsers } from "../data/mockData";
import { Link } from "wouter";

interface GroupPreviewProps {
  group: Group;
}

export default function GroupPreview({ group }: GroupPreviewProps) {
  const creator = mockUsers.find(u => u.id === group.creatorId);

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <img
            src={group.image}
            alt={group.name}
            className="w-full h-32 object-cover"
          />
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg mb-2">{group.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator?.avatar} />
              <AvatarFallback>{creator?.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Created by {creator?.username}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}