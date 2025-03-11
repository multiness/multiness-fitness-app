import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { format } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
}

// Mock messages
const mockMessages: Record<number, Message[]> = {
  2: [
    {
      id: 1,
      senderId: 2,
      receiverId: 1,
      content: "Hey! Wie läuft dein Training? 💪",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      senderId: 1,
      receiverId: 2,
      content: "Super! Hab heute mein Ziel erreicht! 🎯",
      timestamp: new Date(Date.now() - 3000000),
    },
  ],
  3: [
    {
      id: 3,
      senderId: 3,
      receiverId: 1,
      content: "Kommst du morgen zum Gruppentraining?",
      timestamp: new Date(Date.now() - 7200000),
    },
  ],
};

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const currentUser = mockUsers[0]; // Using first mock user as current user
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const newMessage: Message = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: messageInput,
      timestamp: new Date(),
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
    }));
    setMessageInput("");
  };

  // Get the last message for each contact for preview
  const getLastMessage = (userId: number) => {
    const userMessages = messages[userId] || [];
    return userMessages[userMessages.length - 1];
  };

  const ContactList = () => (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Nach Nachrichten suchen..."
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {mockUsers.slice(1).map(user => {
          const lastMessage = getLastMessage(user.id);

          return (
            <button
              key={user.id}
              className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{user.username}</p>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {format(lastMessage.timestamp, 'HH:mm')}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.senderId === currentUser.id ? 'Du: ' : ''}{lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </div>
  );

  const ChatView = () => {
    if (!selectedUser) return null;

    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatar || undefined} />
            <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{selectedUser.username}</h2>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {(messages[selectedUser.id] || []).map(message => {
              const isCurrentUser = message.senderId === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedUser.avatar || undefined} />
                        <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className={`rounded-lg px-4 py-2 ${
                        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <p className="break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 ${
                        isCurrentUser ? 'text-right' : ''
                      }`}>
                        {format(message.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Schreibe eine Nachricht..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Contact List - Hidden on mobile when chat is open */}
      <div className={`w-full md:w-[320px] md:border-r ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <ContactList />
      </div>

      {/* Chat Area - Full screen on mobile when open */}
      <div className={`flex-1 ${!selectedUser ? 'hidden md:block' : 'block'}`}>
        <ChatView />
      </div>
    </div>
  );
}
