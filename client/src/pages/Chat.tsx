import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Image as ImageIcon, ArrowLeft, Users2, Plus, FileText, Video } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { format } from "date-fns";
import { useChatStore, getChatId } from "../lib/chatService";
import { useGroupStore } from "../lib/groupStore";
import { UserAvatar } from "@/components/UserAvatar";
import { useLocation, useParams } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { id } = useParams();
  const chatStore = useChatStore();
  const { users, currentUser } = useUsers();
  const groupStore = useGroupStore();
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if we're in direct chat mode
  const isDirect = window.location.pathname.endsWith('/direct');
  const directUserId = isDirect ? parseInt(id?.replace('chat-', '') || '0') : null;
  const directUser = directUserId ? users.find(u => u.id === directUserId) : null;

  // Get all chats including direct chats and groups
  const allChats = [
    ...users.map(user => ({
      id: getChatId(user.id),
      name: user.username,
      avatar: user.avatar,
      isGroup: false,
      userId: user.id
    })),
    ...Object.values(groupStore.groups).map(group => ({
      id: getChatId(group.id),
      name: group.name,
      avatar: group.image,
      isGroup: true,
      groupId: group.id
    }))
  ];

  // Get the current chat based on the URL parameters
  const [selectedChat, setSelectedChat] = useState(
    id ? (directUser ? {
      id: getChatId(directUser.id),
      name: directUser.username,
      avatar: directUser.avatar,
      isGroup: false,
      userId: directUser.id
    } : allChats.find(c => c.id === id)) : null
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedImage) || !selectedChat) return;

    const message = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      content: messageInput,
      timestamp: new Date().toISOString(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      groupId: selectedChat.isGroup ? selectedChat.groupId : undefined
    };

    chatStore.addMessage(selectedChat.id, message);
    setMessageInput("");
    setSelectedImage(null);
  };

  const handleFileSelect = (type: 'image' | 'file' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' :
                  type === 'video' ? 'video/*' :
                  '*/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && type === 'image') {
        setSelectedImage(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat List Sidebar - Only show if not in direct chat mode */}
      {!isDirect && (
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
              {allChats.map(chat => {
                const messages = chatStore.getMessages(chat.id);
                const lastMessage = messages[messages.length - 1];

                return (
                  <button
                    key={chat.id}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex items-center gap-3">
                      {chat.isGroup ? (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <UserAvatar
                          userId={chat.userId}
                          size="md"
                          clickable={false}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.name}</p>
                        {lastMessage && (
                          <p className="text-sm truncate text-muted-foreground">
                            {lastMessage.content}
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
      )}

      {/* Chat Area */}
      <div className={`flex-1 ${!selectedChat ? 'hidden md:block' : 'block'}`}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-background h-full">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => isDirect ? setLocation('/chat') : setSelectedChat(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedChat.isGroup ? (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <UserAvatar
                    userId={selectedChat.userId}
                    size="sm"
                    clickable={true}
                  />
                )}
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.isGroup ? 'Gruppen-Chat' : 'Online'}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatStore.getMessages(selectedChat.id).map(message => {
                  const isCurrentUser = message.userId === currentUser?.id;
                  const sender = users.find(u => u.id === message.userId);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        {!isCurrentUser && sender && (
                          <UserAvatar
                            userId={message.userId}
                            size="sm"
                            clickable={true}
                          />
                        )}
                        <div>
                          <div className={`rounded-lg px-4 py-2 ${
                            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {message.imageUrl && (
                              <img
                                src={message.imageUrl}
                                alt="Shared"
                                className="rounded-md mb-2 max-w-full"
                              />
                            )}
                            <p className="break-words">{message.content}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${
                            isCurrentUser ? 'text-right' : ''
                          }`}>
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleFileSelect('image')}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <span>Bild senden</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect('file')}>
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Datei senden</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect('video')}>
                      <Video className="h-4 w-4 mr-2" />
                      <span>Video senden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Schreibe eine Nachricht..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {selectedImage && (
                <div className="mt-2 p-2 bg-muted rounded-md flex items-center gap-2">
                  <span className="text-sm">{selectedImage.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    Entfernen
                  </Button>
                </div>
              )}
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