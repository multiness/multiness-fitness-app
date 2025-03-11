import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, Image as ImageIcon, MessageCircle, Info } from "lucide-react";
import { mockGroups, mockUsers } from "../data/mockData";
import { format } from "date-fns";

// Mock messages für den Chat
const mockGroupMessages = [
  {
    id: 1,
    userId: 1,
    content: "Willkommen in der Gruppe! 👋",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    type: "group"
  },
  {
    id: 2,
    userId: 2,
    content: "Danke! Freue mich auf den Austausch!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    type: "group"
  },
  {
    id: 3,
    userId: 3,
    content: "Hat jemand Tipps für das morgige Training?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: "group"
  },
];

// Mock Direktnachrichten
const mockDirectMessages = [
  {
    id: 1,
    userId: 2,
    content: "Hey, wie läuft dein Training?",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: "direct"
  },
  {
    id: 2,
    userId: 1,
    content: "Gut, danke! Bereite mich auf den Marathon vor.",
    timestamp: new Date(Date.now() - 1000 * 60 * 44),
    type: "direct"
  }
];

export default function GroupDetail() {
  const { id } = useParams();
  const group = mockGroups.find(g => g.id === parseInt(id || ""));
  const creator = group ? mockUsers.find(u => u.id === group.creatorId) : null;
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("group");
  const [groupMessages, setGroupMessages] = useState(mockGroupMessages);
  const [directMessages, setDirectMessages] = useState(mockDirectMessages);
  const [showInfo, setShowInfo] = useState(false);
  const currentUser = mockUsers[0]; // Mock current user

  if (!group || !creator) return <div>Gruppe nicht gefunden</div>;

  const participants = mockUsers.slice(0, Math.floor(Math.random() * 5) + 3);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: activeTab === "group" ? groupMessages.length + 1 : directMessages.length + 1,
      userId: currentUser.id,
      content: newMessage,
      timestamp: new Date(),
      type: activeTab
    };

    if (activeTab === "group") {
      setGroupMessages([...groupMessages, newMsg]);
    } else {
      setDirectMessages([...directMessages, newMsg]);
    }
    setNewMessage("");
  };

  const renderMessages = (messages: typeof mockGroupMessages) => (
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
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''} max-w-[70%]`}>
              <div className={`rounded-lg p-3 break-words ${
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
  );

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
              <p className="text-sm text-muted-foreground">{participants.length} Mitglieder</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)}>
            <Info className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="justify-start rounded-none border-b p-0 h-12">
                <TabsTrigger 
                  value="group" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Gruppenchat
                </TabsTrigger>
                <TabsTrigger 
                  value="direct"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Direktnachrichten
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <TabsContent value="group" className="m-0 h-full">
                    {renderMessages(groupMessages)}
                  </TabsContent>
                  <TabsContent value="direct" className="m-0 h-full">
                    {renderMessages(directMessages)}
                  </TabsContent>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Nachricht an ${activeTab === 'group' ? 'Gruppe' : 'User'} schreiben...`}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
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
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={creator.avatar || undefined} />
                      <AvatarFallback>{creator.username[0]}</AvatarFallback>
                    </Avatar>
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
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar || undefined} />
                            <AvatarFallback>{participant.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{participant.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {participant.id === creator.id ? 'Admin' : 'Mitglied'}
                            </p>
                          </div>
                        </div>
                        {participant.id !== creator.id && (
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
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