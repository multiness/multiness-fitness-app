import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface SharedContentProps {
  content: {
    type: 'challenge' | 'event' | 'post';
    id: number;
    title: string;
    preview?: string;
  };
}

export default function SharedContent({ content }: SharedContentProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    const route = content.type === 'challenge' ? 'challenges' :
                 content.type === 'event' ? 'events' : 'posts';
    setLocation(`/${route}/${content.id}`);
  };

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {content.type === 'challenge' && <Trophy className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{content.title}</h4>
            {content.preview && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {content.preview}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            Öffnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
