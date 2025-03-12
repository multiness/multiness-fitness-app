import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockGroups, mockUsers } from "../data/mockData";
import { format } from "date-fns";
import { Send } from "lucide-react";

// Mock messages for demonstration
const mockMessages = [
  {
    id: 1,
    userId: 1,
    content: "Willkommen in der Gruppe!",
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 2,
    content: "Danke! Freue mich dabei zu sein.",
    timestamp: new Date().toISOString(),
  },
];

export default function GroupPage() {
  const { id } = useParams();
  const group = mockGroups.find(g => g.id === parseInt(id || ""));
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const currentUser = mockUsers[0]; // Mock current user

  if (!group) return <div>Gruppe nicht gefunden</div>;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      userId: currentUser.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Group Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <img
              src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
              alt={group.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <CardTitle>{group.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Section */}
      <Card>
        <CardContent className="p-6">
          {/* Messages */}
          <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
            {messages.map(message => {
              const user = mockUsers.find(u => u.id === message.userId);
              const isCurrentUser = message.userId === currentUser.id;

              return (
                <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <Avatar>
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>{user?.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''} max-w-[70%]`}>
                    <div className={`rounded-lg p-3 break-words ${
                      isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Schreibe eine Nachricht..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
