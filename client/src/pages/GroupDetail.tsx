import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, Image as ImageIcon, MessageCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { usePostStore } from "@/lib/postStore";
import { useUserStore } from "@/lib/userStore";
import { useGroupStore } from "@/lib/groupStore";

export default function GroupDetail() {
  const { id } = useParams();
  const groupStore = useGroupStore();
  const userStore = useUserStore();
  const postStore = usePostStore();

  const group = groupStore.groups.find(g => g.id === parseInt(id || ""));
  const creator = group ? userStore.users.find(u => u.id === group.creatorId) : null;

  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("group");
  const [showInfo, setShowInfo] = useState(false);
  const currentUser = userStore.currentUser;

  useEffect(() => {
    setShowInfo(true);
  }, []);

  if (!group || !creator) return <div>Gruppe nicht gefunden</div>;

  const participants = userStore.users.slice(0, Math.floor(Math.random() * 5) + 3);

  // Hole Nachrichten aus dem PostStore
  const groupMessages = Object.values(postStore.posts)
    .filter(post => post.groupId === parseInt(id || ""))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const directMessages = Object.values(postStore.posts)
    .filter(post => post.type === "direct" && post.groupId === parseInt(id || ""))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const newMsg = {
      id: Date.now(),
      userId: currentUser.id,
      content: newMessage,
      timestamp: new Date(),
      type: activeTab,
      groupId: parseInt(id || "")
    };

    postStore.addPost(newMsg);
    setNewMessage("");
  };

  const renderMessages = (messages: typeof groupMessages) => (
    <div className="space-y-4">
      {messages.map(message => {
        const user = userStore.users.find(u => u.id === message.userId);
        const isCurrentUser = message.userId === currentUser?.id;

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
                {user?.username} • {format(new Date(message.createdAt), 'HH:mm')}
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