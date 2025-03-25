import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockUsers } from "../data/mockData";
import { format } from "date-fns";
import { Send, ImagePlus, Pencil } from "lucide-react";
import { useChatStore, getChatId } from "../lib/chatService";
import { useGroupStore } from "../lib/groupStore";
import { useUsers } from "../contexts/UserContext";
import EditGroupDialog from "@/components/EditGroupDialog";

export default function GroupPage() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const groupStore = useGroupStore();
  const group = groupStore.groups[parseInt(id || "")];
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const chatStore = useChatStore();
  const chatId = getChatId(parseInt(id || ""));
  const messages = chatStore.getMessages(chatId);

  if (!group) return <div>Gruppe nicht gefunden</div>;

  const isCreator = group.creatorId === currentUser?.id;
  const isAdmin = group.adminIds?.includes(currentUser?.id || 0);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const message = {
      id: messages.length + 1,
      userId: currentUser?.id || 0,
      content: newMessage,
      timestamp: new Date().toISOString(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      groupId: parseInt(id || ""),
    };

    chatStore.addMessage(chatId, message);
    setNewMessage("");
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleGroupUpdate = (groupId: number, updatedData: any) => {
    groupStore.updateGroup(groupId, updatedData);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      {/* Group Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={group.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
                alt={group.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <CardTitle>{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>
            {(isCreator || isAdmin) && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Chat Section */}
      <Card>
        <CardContent className="p-6">
          {/* Messages */}
          <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
            {messages.map(message => {
              const user = mockUsers.find(u => u.id === message.userId);
              const isCurrentUser = message.userId === currentUser?.id;

              return (
                <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <Avatar>
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>{user?.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''} max-w-[70%]`}>
                    <div className={`rounded-lg p-3 break-words ${
                      isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Shared"
                          className="rounded-md mb-2 max-w-full"
                        />
                      )}
                      {message.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
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
              className="shrink-0"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Schreibe eine Nachricht..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
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
        </CardContent>
      </Card>

      {/* Edit Group Dialog */}
      {group && (
        <EditGroupDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          group={group}
          onSave={handleGroupUpdate}
        />
      )}
    </div>
  );
}