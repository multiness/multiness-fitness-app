import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, Image as ImageIcon, MessageCircle, Info } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useGroupStore } from "../lib/groupStore";
import { useChatStore } from "../lib/chatService";
import { UserAvatar } from "@/components/UserAvatar";
import { format } from "date-fns";

export default function GroupDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { users, currentUser } = useUsers();
  const groupStore = useGroupStore();
  const chatStore = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"group" | "direct">("group");

  // Verwende die ID, um die Gruppe aus dem Store zu finden
  const groupId = parseInt(id || "0");
  const group = groupStore.groups[groupId];
  
  // Der Chat mit der Gruppe
  const chatId = `group-${groupId}`;
  const groupMessages = chatStore.getMessages(chatId);
  
  // Direktnachrichten mit dem Ersteller
  const creatorId = group?.creatorId;
  const creatorChatId = creatorId ? `user-${creatorId}` : '';
  const directMessages = creatorChatId ? chatStore.getMessages(creatorChatId) : [];
  
  useEffect(() => {
    // Initialisiere den Gruppen-Chat, wenn er nicht existiert
    if (group) {
      chatStore.initializeGroupChat(group.id);
    }
  }, [group, chatStore]);
  
  // Der Ersteller der Gruppe
  const creator = users.find(u => u.id === group?.creatorId);
  
  if (!group || !creator) return <div>Gruppe nicht gefunden</div>;
  
  // Teilnehmer der Gruppe
  const participants = (group.participantIds || [])
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);
    
  // Navigieren zum Gruppenchat
  const navigateToGroupChat = () => {
    setLocation(`/chat/${chatId}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      content: newMessage,
      timestamp: new Date().toISOString(),
      groupId: activeTab === "group" ? group.id : undefined
    };

    if (activeTab === "group") {
      chatStore.addMessage(chatId, newMsg);
    } else if (creatorId) {
      chatStore.addMessage(creatorChatId, newMsg);
    }
    
    setNewMessage("");
  };

  // Rendere Chat-Nachrichten
  const renderMessages = (messages: any[], isGroupChat: boolean) => {
    return (
      <div className="space-y-4 mb-4">
        {messages.map((message) => {
          const isCurrentUser = message.userId === currentUser?.id;
          const user = users.find(u => u.id === message.userId);
          
          return (
            <div key={message.id} className="flex items-start gap-3">
              {!isCurrentUser && (
                <UserAvatar 
                  userId={message.userId}
                  size="sm"
                  clickable={true}
                />
              )}
              
              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''} max-w-[70%]`}>
                <div className={`rounded-lg p-3 break-words ${
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  {message.content}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user?.username} • {format(new Date(message.timestamp), 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-[calc(100%-300px)]">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={group.image || undefined} />
              <AvatarFallback>{group.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{group.name}</h2>
              <p className="text-sm text-muted-foreground">
                {(group.participantIds?.length || 0)} Mitglieder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowInfo(!showInfo)}
              aria-label="Gruppeninformationen anzeigen/verbergen"
            >
              <Info className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={navigateToGroupChat}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat öffnen</span>
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="group" className="flex-1 flex flex-col" onValueChange={(v) => setActiveTab(v as "group" | "direct")}>
              <div className="border-b px-4">
                <TabsList className="mt-2">
                  <TabsTrigger value="group">Gruppenchat</TabsTrigger>
                  <TabsTrigger value="direct">Chat mit Admin</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="group" className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1">
                  {renderMessages(groupMessages, true)}
                </ScrollArea>
                
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Schreibe eine Nachricht..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="direct" className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1">
                  {renderMessages(directMessages, false)}
                </ScrollArea>
                
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Nachricht an ${creator.username}...`}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Info Sidebar */}
          {showInfo && (
            <div className="w-[300px] border-l bg-background">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Über die Gruppe</h3>
                <p className="text-sm text-muted-foreground mb-6">{group.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserAvatar 
                      userId={creator.id}
                      size="sm"
                      clickable={true}
                    />
                    <span className="text-sm">
                      Erstellt von <span className="font-medium">{creator.username}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Mitglieder</h3>
                  <div className="space-y-3">
                    {participants.map((participant) => {
                      if (!participant) return null;
                      return (
                        <div key={participant.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              userId={participant.id}
                              size="sm"
                              clickable={true}
                            />
                            <div>
                              <p className="text-sm font-medium">{participant.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {participant.id === creator.id ? 'Admin' : 'Mitglied'}
                              </p>
                            </div>
                          </div>
                          {participant.id !== creator.id && participant.id !== currentUser?.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/chat/user-${participant.id}`)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}