import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Image as ImageIcon, ArrowLeft, Users, Plus, FileText, Video, Target } from "lucide-react";
import { mockUsers, mockGroups } from "../data/mockData";
import { format } from "date-fns";
import { useChatStore, getChatId } from "../lib/chatService";
import { usePostStore } from "../lib/postStore";
import { UserAvatar } from "@/components/UserAvatar";
import { Progress } from "@/components/ui/progress";
import { useLocation, useParams } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddGroupGoalModal from "@/components/AddGroupGoalModal";
import AddGroupProgress from "@/components/AddGroupProgress";
import PerformanceBoard from "@/components/PerformanceBoard"; // Import the PerformanceBoard component


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

export default function Chat() {
  const { id } = useParams();
  const chatStore = useChatStore();
  const postStore = usePostStore();
  const currentUser = mockUsers[0];

  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGroupGoalModalOpen, setIsGroupGoalModalOpen] = useState(false);
  const [isAddProgressModalOpen, setIsAddProgressModalOpen] = useState(false);
  const [isPerformanceBoardOpen, setIsPerformanceBoardOpen] = useState(false); // Add state for Performance Board

  const chatPreviews: ChatPreview[] = [
    ...mockUsers.slice(1).map(user => {
      const chatId = user.id.toString();
      const messages = chatStore.getMessages(chatId);
      const unreadCount = messages.filter(m => m.userId !== currentUser.id).length;
      return {
        id: chatId,
        name: user.username,
        avatar: user.avatar || undefined,
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
        avatar: group.image || undefined,
        isGroup: true,
        lastMessage: messages[messages.length - 1],
        unreadCount,
      };
    }),
  ];

  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(
    id ? chatPreviews.find(c => c.id === id) || null : null
  );

  useEffect(() => {
    if (id && (!selectedChat || selectedChat.id !== id)) {
      const chat = chatPreviews.find(c => c.id === id);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedImage) || !selectedChat) return;

    const message = {
      id: Date.now(),
      userId: currentUser.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      groupId: selectedChat.isGroup ? parseInt(selectedChat.id.substring(6)) : undefined,
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
      if (file) {
        if (type === 'image') {
          setSelectedImage(file);
        }
        // Hier können weitere Datei-Typ-Handler hinzugefügt werden
      }
    };
    input.click();
  };

  const handleAddGroupGoal = (data: { title: string; description?: string; targetDate: string }) => {
    if (!selectedChat?.isGroup) return;

    const goal = {
      id: Date.now(),
      groupId: selectedChat.id,
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      contributions: [], // Initialize empty contributions array
    };

    chatStore.setGroupGoal(selectedChat.id, goal);

    const message = {
      id: Date.now(),
      userId: currentUser.id,
      content: `🎯 Neues Gruppenziel erstellt: ${data.title}`,
      timestamp: new Date().toISOString(),
      groupId: parseInt(selectedChat.id.substring(6)),
    };

    chatStore.addMessage(selectedChat.id, message);
  };

  const handleAddGroupProgress = (progress: number) => {
    if (!selectedChat?.isGroup || !currentGroupGoal) return;

    const contribution = {
      userId: currentUser.id,
      progress,
      timestamp: new Date().toISOString(),
    };

    chatStore.updateGroupGoalProgress(selectedChat.id, contribution);

    const message = {
      id: Date.now(),
      userId: currentUser.id,
      content: `📈 Hat ${progress}% zum Gruppenziel "${currentGroupGoal.title}" beigetragen!`,
      timestamp: new Date().toISOString(),
      groupId: parseInt(selectedChat.id.substring(6)),
    };

    chatStore.addMessage(selectedChat.id, message);
  };

  const currentGroupGoal = selectedChat?.isGroup ? chatStore.getGroupGoal(selectedChat.id) : undefined;

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
            {chatPreviews.map(chat => (
              <button
                key={chat.id}
                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <UserAvatar
                      userId={parseInt(chat.id)}
                      avatar={chat.avatar}
                      username={chat.name}
                      size="md"
                      isGroup={chat.isGroup}
                      clickable={!chat.isGroup}
                    />
                    {chat.isGroup && (
                      <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <Users className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {!chat.isGroup && chat.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chat.name}</p>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chat.lastMessage.timestamp), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className={`text-sm truncate ${
                        chat.unreadCount && chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {chat.lastMessage.userId === currentUser.id ? 'Du: ' : ''}{chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      </div>

      <div className={`flex-1 ${!selectedChat ? 'hidden md:block' : 'block'}`}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-background h-full">
            <div className="p-4 border-b space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <UserAvatar
                    userId={parseInt(selectedChat.id)}
                    avatar={selectedChat.avatar}
                    username={selectedChat.name}
                    size="sm"
                    isGroup={selectedChat.isGroup}
                    clickable={!selectedChat.isGroup}
                  />
                </div>
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.isGroup ? 'Gruppen-Chat' : 'Online'}
                  </p>
                </div>
              </div>

              {selectedChat.isGroup && currentGroupGoal && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{currentGroupGoal.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ziel bis {format(new Date(currentGroupGoal.targetDate), 'dd.MM.yyyy')}
                    </span>
                  </div>
                  {currentGroupGoal.description && (
                    <p className="text-xs text-muted-foreground">{currentGroupGoal.description}</p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{currentGroupGoal.progress}%</span>
                        {currentGroupGoal.progress >= 100 && (
                          <span className="text-yellow-500">
                            🎉 Ziel erreicht!
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => setIsPerformanceBoardOpen(true)}
                        >
                          👥 Performance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => setIsAddProgressModalOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Fortschritt
                        </Button>
                      </div>
                    </div>
                    <Progress 
                      value={currentGroupGoal.progress} 
                      className={`h-1.5 ${
                        currentGroupGoal.progress >= 100 
                          ? "bg-yellow-500" 
                          : ""
                      }`}
                    />
                  </div>
                </div>
              )}
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
                        {!isCurrentUser && sender && (
                          <UserAvatar
                            userId={message.userId}
                            avatar={sender.avatar}
                            username={sender.username}
                            size="sm"
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
                      <span>Bild hochladen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect('file')}>
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Datei hochladen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect('video')}>
                      <Video className="h-4 w-4 mr-2" />
                      <span>Video hochladen</span>
                    </DropdownMenuItem>
                    {selectedChat?.isGroup && (
                      <DropdownMenuItem onClick={() => setIsGroupGoalModalOpen(true)}>
                        <Target className="h-4 w-4 mr-2" />
                        <span>Gruppenziel hinzufügen</span>
                      </DropdownMenuItem>
                    )}
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

      {selectedChat?.isGroup && currentGroupGoal && (
        <>
          <AddGroupGoalModal
            open={isGroupGoalModalOpen}
            onOpenChange={setIsGroupGoalModalOpen}
            onSave={handleAddGroupGoal}
          />
          <AddGroupProgress
            open={isAddProgressModalOpen}
            onOpenChange={setIsAddProgressModalOpen}
            onSave={handleAddGroupProgress}
            currentProgress={currentGroupGoal.progress}
            goalTitle={currentGroupGoal.title}
          />
          <PerformanceBoard
            open={isPerformanceBoardOpen}
            onOpenChange={setIsPerformanceBoardOpen}
            goal={currentGroupGoal}
          />
        </>
      )}
    </div>
  );
}