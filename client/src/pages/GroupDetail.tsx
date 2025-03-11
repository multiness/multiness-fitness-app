import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, Image as ImageIcon } from "lucide-react";
import { mockGroups, mockUsers } from "../data/mockData";
import { format } from "date-fns";

// Mock messages for the chat
const mockMessages = [
  {
    id: 1,
    userId: 1,
    content: "Willkommen in der Gruppe! 👋",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 2,
    userId: 2,
    content: "Danke! Freue mich auf den Austausch!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
  },
  {
    id: 3,
    userId: 3,
    content: "Hat jemand Tipps für das morgige Training?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
];

export default function GroupDetail() {
  const { id } = useParams();
  const group = mockGroups.find(g => g.id === parseInt(id || ""));
  const creator = group ? mockUsers.find(u => u.id === group.creatorId) : null;
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const currentUser = mockUsers[0]; // Mock current user

  if (!group || !creator) return <div>Gruppe nicht gefunden</div>;

  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      userId: currentUser.id,
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Group Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <img
              src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
              alt={group.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{group.name}</CardTitle>
              <p className="text-muted-foreground mb-4">{group.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={creator.avatar || undefined} />
                    <AvatarFallback>{creator.username[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    Created by <span className="font-medium">{creator.username}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{participants.length} Mitglieder</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gruppen-Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messages.map(message => {
                const user = mockUsers.find(u => u.id === message.userId);
                const isCurrentUser = message.userId === currentUser.id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback>{user?.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                      <div className={`rounded-lg p-3 ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.content}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {user?.username} • {format(message.timestamp, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nachricht schreiben..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle>Mitglieder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={participant.avatar || undefined} />
                    <AvatarFallback>{participant.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{participant.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {participant.id === creator.id ? 'Admin' : 'Mitglied'}
                    </p>
                  </div>
                </div>
                {participant.id !== creator.id && (
                  <Button variant="outline" size="sm">
                    Nachricht
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
