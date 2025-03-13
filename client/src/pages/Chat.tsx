import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Image as ImageIcon, ArrowLeft, Users } from "lucide-react";
import { mockUsers, mockGroups } from "../data/mockData";
import { format } from "date-fns";
import { useChatStore, getChatId } from "../lib/chatService";
import { usePostStore } from "../lib/postStore";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const currentUser = mockUsers[0];
  const chatStore = useChatStore();
  const postStore = usePostStore();

  const hasActiveGoal = (userId: number) => {
    return Boolean(postStore.getDailyGoal(userId));
  };

  const chatPreviews: ChatPreview[] = [
    ...mockUsers.slice(1).map(user => {
      const chatId = user.id.toString();
      const messages = chatStore.getMessages(chatId);
      const unreadCount = messages.filter(m => m.userId !== currentUser.id).length;
      return {
        id: chatId,
        name: user.username,
        avatar: user.avatar,
        isGroup: false,
        isOnline: true,
        lastMessage: messages[messages.length - 1],
        unreadCount,
      };
    }),
    ...mockGroups.map(group => {
      const chatId = getChatId(group.id);
      const messages = chatStore.getMessages(chatId);
      const unreadCount = messages.filter(m => m.userId !== currentUser.id).length;
      return {
        id: chatId,
        name: group.name,
        avatar: group.image,
        isGroup: true,
        lastMessage: messages[messages.length - 1],
        unreadCount,
      };
    }),
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedImage || !selectedChat) return;

    const message = {
      id: Date.now(),
      userId: currentUser.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      groupId: selectedChat.isGroup ? parseInt(selectedChat.id.substring(1)) : undefined,
    };

    chatStore.addMessage(selectedChat.id, message);
    setMessageInput("");
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
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
              const messages = chatStore.getMessages(chat.id);
              const lastMessage = messages[messages.length - 1];
              const userId = parseInt(chat.id);

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
                          : hasActiveGoal(userId)
                            ? 'ring-4 ring-blue-500/50'
                            : ''
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
                          {chat.unreadCount > 0 && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </p>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lastMessage.timestamp), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className={`text-sm truncate ${
                          chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        }`}>
                          {lastMessage.userId === currentUser.id ? 'Du: ' : ''}{lastMessage.content}
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

      <div className={`flex-1 ${!selectedChat ? 'hidden md:block' : 'block'}`}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-background h-full">
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
                  ? 'bg-green-50' 
                  : 'bg-blue-50'
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

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatStore.getMessages(selectedChat.id).map(message => {
                  const isCurrentUser = message.userId === currentUser.id;
                  const sender = mockUsers.find(u => u.id === message.userId);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={sender?.avatar || undefined} />
                            <AvatarFallback>{sender?.username[0]}</AvatarFallback>
                          </Avatar>
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
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={handleImageSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
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

interface Message {
  id: number;
  userId: number;
  content: string;
  timestamp: string;
  imageUrl?: string;
  groupId?: number;
}

interface ChatPreview {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  isOnline?: boolean;
  lastMessage?: Message;
  unreadCount?: number;
}