import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Image as ImageIcon, ArrowLeft, Users2, Plus, FileText, Video, Target, Pencil } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { format } from "date-fns";
import { useChatStore, getChatIdSync } from "../lib/chatService"; // Nur synchrone Funktion importieren
import { useGroupStore } from "../lib/groupStore";
import { UserAvatar } from "@/components/UserAvatar";
import { Progress } from "@/components/ui/progress";
import { useLocation, useParams } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AddGroupGoalModal from "@/components/AddGroupGoalModal";
import AddGroupProgress from "@/components/AddGroupProgress";
import PerformanceBoard from "@/components/PerformanceBoard";
import SharedContent from "@/components/SharedContent";
import EditGroupDialog from "@/components/EditGroupDialog";

export default function Chat() {
  const { id } = useParams();
  const chatStore = useChatStore();
  const { users, currentUser } = useUsers();
  const groupStore = useGroupStore();
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const userId = currentUser?.id || 1; // Standardmäßig Benutzer mit ID 1 für Testzwecke
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGroupGoalModalOpen, setIsGroupGoalModalOpen] = useState(false);
  const [isAddProgressModalOpen, setIsAddProgressModalOpen] = useState(false);
  const [isPerformanceBoardOpen, setIsPerformanceBoardOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  
  // Einfachere Initialisierung für die Chat-Komponente
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [allChats, setAllChats] = useState<any[]>([]);
  
  // Ist dies ein direkter Benutzerchat?
  const isDirect = window.location.pathname.endsWith('/direct');
  const directUserId = isDirect ? parseInt(id?.replace('chat-', '') || '0') : null;
  const directUser = directUserId ? users.find(u => u.id === directUserId) : null;
  
  // Markiere den aktuellen Chat als gelesen, wenn er geöffnet wird
  useEffect(() => {
    if (id) {
      chatStore.setCurrentOpenChat(id);
    }
    
    return () => {
      // Beim Verlassen der Chat-Ansicht den aktuellen Chat zurücksetzen
      chatStore.setCurrentOpenChat(null);
    };
  }, [id, chatStore]);
  
  // Laden der Chat-Liste - einmalig und bei Änderungen
  useEffect(() => {
    if (!users.length || !currentUser) return;
    
    // Chat-Liste generieren
    try {
      console.log("Generiere Chat-Liste...");
      
      // Benutzer-Chats
      const userChats = users
        .filter(user => user.id !== currentUser?.id)
        .map(user => {
          const chatId = getChatIdSync(user.id, 'user');
          return {
            id: chatId,
            chatId: chatId,
            name: user.username,
            avatar: user.avatar,
            isGroup: false,
            userId: user.id
          };
        });
      
      // Gruppen-Chats
      const groupChats = Object.values(groupStore.groups || {}).map(group => {
        const chatId = getChatIdSync(group.id, 'group');
        return {
          id: chatId,
          chatId: chatId,
          name: group.name,
          avatar: group.image,
          isGroup: true,
          groupId: group.id
        };
      });
      
      // Kombinierte Liste
      const combinedChats = [...userChats, ...groupChats];
      console.log("Chat-Liste generiert:", combinedChats.length, "Chats");
      setAllChats(combinedChats);
      
    } catch (error) {
      console.error("Fehler beim Generieren der Chat-Liste:", error);
    }
  }, [users, groupStore.groups, currentUser]);
  
  // Chat-Initialisierung basierend auf URL-Parameter - Robustere Implementierung
  useEffect(() => {
    if (!id) return;
    
    try {
      console.log("Initialisiere ausgewählten Chat für ID:", id);
      
      // Cache für häufig verwendete Daten
      let chatIdentifier = id;
      let isGruppe = false;
      let entityId: number | null = null;
      
      // Für direkten Benutzerchat
      if (directUser) {
        entityId = directUser.id;
        chatIdentifier = getChatIdSync(entityId, 'user');
        
        setSelectedChat({
          id: chatIdentifier,
          chatId: chatIdentifier,
          name: directUser.username,
          avatar: directUser.avatar,
          isGroup: false,
          userId: entityId
        });
        return;
      }
      
      // Für Gruppen-Chat - Unterstützt alle Formate: group-ID, group-uuid-xxxx
      if (id.startsWith('group-')) {
        isGruppe = true;
        
        // Einfaches Format: group-123
        if (id.match(/^group-\d+$/)) {
          const groupIdStr = id.replace('group-', '');
          entityId = parseInt(groupIdStr, 10);
        } 
        // UUID-Format: Durchsuche die IDs aus dem globalGroupIds-Cache
        else {
          // Die ID ist bereits der Chat-Identifier
          chatIdentifier = id;
          
          // Suche die eigentliche Gruppen-ID basierend auf dem ID-Muster
          // Da groupChatIds nicht in der GroupStore-Definition vorhanden ist,
          // verwenden wir einfach einen manuellen Abgleich mit den Gruppen-IDs
          for (const groupId in groupStore.groups) {
            const group = groupStore.groups[groupId];
            const groupChatId = getChatIdSync(parseInt(groupId), 'group');
            if (groupChatId === id) {
              entityId = parseInt(groupId);
              break;
            }
          }
        }
        
        if (!entityId || isNaN(entityId)) {
          console.warn("Konnte Gruppen-ID nicht extrahieren:", id);
          // Trotzdem fortfahren mit Chat-ID als Fallback
        } else {
          // Initialisiere die Gruppe wenn eine ID gefunden wurde
          chatStore.initializeGroupChat(entityId);
          
          const group = groupStore.groups[entityId];
          if (group) {
            chatIdentifier = getChatIdSync(entityId, 'group');
            setSelectedChat({
              id: chatIdentifier,
              chatId: chatIdentifier,
              name: group.name,
              avatar: group.image,
              isGroup: true,
              groupId: entityId
            });
            return;
          }
        }
      }
      
      // Suche nach übereinstimmendem Chat in der Liste
      const matchingChat = allChats.find((c) => c.id === id);
      if (matchingChat) {
        setSelectedChat(matchingChat);
        return;
      }
      
      console.warn("Kein passender Chat für ID gefunden:", id);
    } catch (error) {
      console.error("Fehler bei der Chat-Initialisierung:", error);
    }
  }, [id, allChats, directUser, groupStore.groups, chatStore]);

  const currentGroupGoal = selectedChat?.isGroup ? chatStore.getGroupGoal(selectedChat.chatId) : undefined;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedImage) || !selectedChat) return;

    const message = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      content: messageInput,
      timestamp: new Date().toISOString(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      groupId: selectedChat.isGroup && 'groupId' in selectedChat ? selectedChat.groupId : undefined
    };

    chatStore.addMessage(selectedChat.chatId, message);
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

  const handleAddGroupGoal = (data: { 
    title: string; 
    description?: string; 
    targetDate: string;
    targetValue: number;
    unit: string;
  }) => {
    if (!selectedChat?.isGroup || !('groupId' in selectedChat)) return;

    const goal = {
      id: Date.now(),
      groupId: String(selectedChat.groupId), // Konvertieren zu String
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      targetValue: data.targetValue,
      unit: data.unit,
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 0, // Default to 0 if currentUser is undefined
      contributions: [],
    };

    chatStore.setGroupGoal(selectedChat.chatId, goal);

    const message = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      content: `🎯 Neues Gruppenziel erstellt: ${data.title} (${data.targetValue} ${data.unit})`,
      timestamp: new Date().toISOString(),
      groupId: selectedChat.groupId,
    };

    chatStore.addMessage(selectedChat.chatId, message);
    setIsGroupGoalModalOpen(false);
  };

  const handleAddGroupProgress = (value: number) => {
    if (!selectedChat?.isGroup || !currentGroupGoal || !('groupId' in selectedChat)) return;

    const progress = (value / currentGroupGoal.targetValue) * 100;

    const contribution = {
      userId: currentUser?.id || 0,
      value: value,
      progress: progress,
      timestamp: new Date().toISOString(),
    };

    chatStore.updateGroupGoalProgress(selectedChat.chatId, contribution);

    const message = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      content: `📈 Hat ${value} ${currentGroupGoal.unit} zum Gruppenziel "${currentGroupGoal.title}" beigetragen!`,
      timestamp: new Date().toISOString(),
      groupId: selectedChat.groupId,
    };

    chatStore.addMessage(selectedChat.chatId, message);
    setIsAddProgressModalOpen(false);
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
                const messages = chatStore.getMessages(chat.chatId);
                const lastMessage = messages[messages.length - 1];
                const unreadCount = chatStore.getUnreadCount(chat.id);

                return (
                  <button
                    key={chat.id}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-muted' : ''
                    } ${unreadCount > 0 ? 'font-semibold' : ''}`}
                    onClick={() => {
                      if (chat.isGroup) {
                        // Debug-Ausgabe für Gruppennavigation
                        console.log("Navigiere zu Gruppenchat:", chat.id);
                        
                        // Extrahiere die Gruppen-ID aus dem Chat-ID
                        // Verbesserte Gruppennavigation - unterstützt verschiedene ID-Formate
                        let groupId;
                        
                        // Standardformat 'group-123'
                        const standardMatch = chat.id.match(/group-(\d+)/);
                        if (standardMatch && standardMatch[1]) {
                          groupId = standardMatch[1];
                        } 
                        // Fallback für das UUID-Format
                        else if ('groupId' in chat) {
                          groupId = chat.groupId;
                        }
                        
                        if (groupId) {
                          console.log("Extrahierte Gruppen-ID:", groupId);
                          // Initialisiere den Chat sofort, bevor wir navigieren
                          // Dies stellt sicher, dass die Daten geladen werden, selbst wenn
                          // die Navigation fehlschlägt
                          chatStore.initializeGroupChat(parseInt(String(groupId)));
                          
                          // Setze den Chat sofort, damit die UI reagiert, auch wenn die Navigation
                          // verzögert ist oder fehlschlägt
                          setSelectedChat(chat);
                          
                          // Navigiere dann zur Gruppe
                          setTimeout(() => {
                            setLocation(`/chat/group-${groupId}`);
                          }, 100);
                        } else {
                          console.error("Konnte keine gültige Gruppen-ID extrahieren:", chat);
                          // Fallback: Setze direkt den Chat ohne Navigation
                          setSelectedChat(chat);
                        }
                      } else {
                        // Direkte Benutzer-Chats
                        setSelectedChat(chat);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {chat.isGroup ? (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-green-500">
                          <Users2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <UserAvatar
                          userId={'userId' in chat ? chat.userId : 0}
                          size="md"
                          clickable={false}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {chat.isGroup && (
                            <Users2 className="h-3 w-3 text-green-500" />
                          )}
                          <p className="font-medium truncate">{chat.name}</p>
                          {unreadCount > 0 && (
                            <div className="ml-auto flex items-center justify-center bg-primary text-primary-foreground rounded-full min-w-5 h-5 px-1 text-xs">
                              {unreadCount}
                            </div>
                          )}
                        </div>
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
                  onClick={() => {
                    if (isDirect) {
                      setLocation('/chat');
                    } else if (selectedChat?.isGroup) {
                      setLocation('/');
                    } else {
                      setSelectedChat(null);
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedChat.isGroup ? (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-green-500">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <UserAvatar
                    userId={!selectedChat.isGroup && 'userId' in selectedChat ? selectedChat.userId : 0}
                    size="sm"
                    clickable={true}
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.isGroup ? 'Gruppen-Chat' : 'Online'}
                  </p>
                </div>
                
                {/* Verbesserter Bearbeiten-Button nur für Gruppenadmins */}
                {selectedChat && selectedChat.isGroup && 'groupId' in selectedChat && (
                  <>
                    {selectedChat.groupId && groupStore.isGroupAdmin(selectedChat.groupId, userId) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-green-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsEditGroupDialogOpen(true)}
                        title="Gruppe bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Group Goals Section */}
              {selectedChat && selectedChat.isGroup && currentGroupGoal && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{currentGroupGoal.title}</span>
                    </div>
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
                  <Progress value={currentGroupGoal.progress} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {(currentGroupGoal.contributions || []).reduce((sum, c) => sum + c.value, 0).toFixed(1)} {currentGroupGoal.unit}
                      von {currentGroupGoal.targetValue} {currentGroupGoal.unit}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setIsPerformanceBoardOpen(true)}
                    >
                      👥 Performance anzeigen
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedChat && chatStore.getMessages(selectedChat.chatId).map(message => {
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
                            {message.sharedContent && (
                              <div className="mt-2">
                                <SharedContent content={message.sharedContent} />
                              </div>
                            )}
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

      {/* Modals for Group Features */}
      {selectedChat?.isGroup && (
        <>
          <AddGroupGoalModal
            open={isGroupGoalModalOpen}
            onOpenChange={setIsGroupGoalModalOpen}
            onSave={handleAddGroupGoal}
          />
          {currentGroupGoal && (
            <>
              <AddGroupProgress
                open={isAddProgressModalOpen}
                onOpenChange={setIsAddProgressModalOpen}
                onSave={handleAddGroupProgress}
                currentProgress={currentGroupGoal.progress}
                goalTitle={currentGroupGoal.title}
                targetValue={currentGroupGoal.targetValue}
                unit={currentGroupGoal.unit}
                currentValue={(currentGroupGoal.contributions || []).reduce((sum, c) => sum + c.value, 0)}
              />
              <PerformanceBoard
                open={isPerformanceBoardOpen}
                onOpenChange={setIsPerformanceBoardOpen}
                goal={currentGroupGoal}
              />
            </>
          )}

          {/* Gruppeneditierung für Admins */}
          {selectedChat && selectedChat.isGroup && 'groupId' in selectedChat && (
            <EditGroupDialog
              open={isEditGroupDialogOpen}
              onOpenChange={setIsEditGroupDialogOpen}
              group={groupStore.groups[selectedChat.groupId]}
              onSave={async (groupId, updatedData) => {
                try {
                  await groupStore.updateGroup(groupId, updatedData);
                  
                  // Benachrichtigung über erfolgreiche Aktualisierung
                  toast({
                    title: "Gruppe aktualisiert",
                    description: "Die Gruppendetails wurden erfolgreich aktualisiert.",
                  });
                  
                  const message = {
                    id: Date.now(),
                    userId: currentUser?.id || 0,
                    content: "🔄 Die Gruppendetails wurden aktualisiert.",
                    timestamp: new Date().toISOString(),
                    groupId: selectedChat.groupId,
                  };
                  
                  chatStore.addMessage(selectedChat.chatId, message);
                } catch (error) {
                  console.error('Fehler beim Aktualisieren der Gruppe:', error);
                  toast({
                    title: "Fehler",
                    description: "Die Gruppe konnte nicht aktualisiert werden. Bitte versuche es erneut.",
                    variant: "destructive",
                  });
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}