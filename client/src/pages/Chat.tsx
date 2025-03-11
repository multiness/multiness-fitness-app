import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Image as ImageIcon, ArrowLeft, Users } from "lucide-react";
import { mockUsers, mockGroups } from "../data/mockData";
import { format } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  isGroupMessage?: boolean;
  groupId?: number;
}

// Mock messages
const mockMessages: Record<string, Message[]> = {
  // Direkte Nachrichten (userId als Key)
  "2": [
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
  // Gruppen-Nachrichten (groupId als Key mit "g" Prefix)
  "g1": [
    {
      id: 3,
      senderId: 3,
      receiverId: 0,
      content: "Willkommen in der Fitness-Gruppe! 🏋️‍♂️",
      timestamp: new Date(Date.now() - 7200000),
      isGroupMessage: true,
      groupId: 1,
    },
  ],
};

interface ChatPreview {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  isOnline?: boolean;
  lastMessage?: Message;
}

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const currentUser = mockUsers[0]; // Using first mock user as current user
  const [messages, setMessages] = useState(mockMessages);

  // Kombiniere User und Gruppen für die Chat-Liste
  const chatPreviews: ChatPreview[] = [
    ...mockUsers.slice(1).map(user => ({
      id: user.id.toString(),
      name: user.username,
      avatar: user.avatar,
      isGroup: false,
      isOnline: true,
      lastMessage: messages[user.id.toString()]?.at(-1),
    })),
    ...mockGroups.map(group => ({
      id: `g${group.id}`,
      name: group.name,
      avatar: group.image,
      isGroup: true,
      lastMessage: messages[`g${group.id}`]?.at(-1),
    })),
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: parseInt(selectedChat.id),
      content: messageInput,
      timestamp: new Date(),
      isGroupMessage: selectedChat.isGroup,
      groupId: selectedChat.isGroup ? parseInt(selectedChat.id.substring(1)) : undefined,
    };

    setMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));
    setMessageInput("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Contact List - Hidden on mobile when chat is open */}
      <div className={`w-full md:w-[320px] md:border-r ${selectedChat ? 'hidden md:block' : 'block'}`}>
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
            {chatPreviews.map(chat => {
              const isSelected = selectedChat?.id === chat.id;

              return (
                <button
                  key={chat.id}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={`h-12 w-12 ${
                        chat.isGroup 
                          ? 'ring-4 ring-green-500/50' 
                          : 'ring-4 ring-blue-500/50'
                      }`}>
                        <AvatarImage src={chat.avatar || undefined} />
                        <AvatarFallback className={chat.isGroup ? 'bg-green-50' : 'bg-blue-50'}>
                          {chat.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isGroup ? (
                        <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                      ) : chat.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate flex items-center gap-2">
                          {chat.name}
                        </p>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(chat.lastMessage.timestamp, 'HH:mm')}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage.senderId === currentUser.id ? 'Du: ' : ''}{chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area - Full screen on mobile when open */}
      <div className={`flex-1 ${!selectedChat ? 'hidden md:block' : 'block'}`}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-background h-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className={`h-10 w-10 ${
                selectedChat.isGroup 
                  ? 'ring-4 ring-green-500/50' 
                  : 'ring-4 ring-blue-500/50'
              }`}>
                <AvatarImage src={selectedChat.avatar || undefined} />
                <AvatarFallback className={selectedChat.isGroup ? 'bg-green-50' : 'bg-blue-50'}>
                  {selectedChat.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{selectedChat.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedChat.isGroup ? 'Gruppen-Chat' : 'Online'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(messages[selectedChat.id] || []).map(message => {
                  const isCurrentUser = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedChat.avatar || undefined} />
                            <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
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
        ) : (
          <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
            Wähle einen Chat aus, um die Konversation zu beginnen
          </div>
        )}
      </div>
    </div>
  );
}