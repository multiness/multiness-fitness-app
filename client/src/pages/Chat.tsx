import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send } from "lucide-react";
import { mockUsers } from "../data/mockData";

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: Date;
}

// Mock messages
const mockMessages: Message[] = [
  {
    id: 1,
    senderId: 2,
    content: "Hey! How's your fitness journey going?",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 2,
    senderId: 1,
    content: "Great! Just completed today's challenge 💪",
    timestamp: new Date(Date.now() - 3000000),
  },
];

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(mockUsers[1]);
  const [messageInput, setMessageInput] = useState("");
  const currentUser = mockUsers[0]; // Using first mock user as current user

  return (
    <div className="container max-w-2xl mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-3 h-full gap-4">
        {/* Users List */}
        <Card className="col-span-1">
          <CardHeader className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search chats..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-250px)]">
              {mockUsers.slice(1).map(user => (
                <Button
                  key={user.id}
                  variant={selectedUser.id === user.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-3 py-6"
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-xs text-muted-foreground">Active now</div>
                  </div>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{selectedUser.username}</div>
                <div className="text-sm text-muted-foreground">Online</div>
              </div>
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockMessages.map(message => {
                const isCurrentUser = message.senderId === currentUser.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                      <p>{message.content}</p>
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <CardContent className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
