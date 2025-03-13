import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Users, Image, CalendarDays, Bell, Package } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "../contexts/UserContext";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const [, setLocation] = useLocation();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.isAdmin;

  const handleCreateChallenge = () => {
    onClose();
    setLocation("/create/challenge");
  };

  const handleCreatePost = () => {
    onClose();
    setLocation("/create/post");
  };

  const handleCreateGroup = () => {
    onClose();
    setLocation("/create/group");
  };

  const handleCreateEvent = () => {
    onClose();
    setLocation("/create/event");
  };

  const handleCreateNotification = () => {
    onClose();
    setLocation("/create/notification");
  };

  const handleCreateProduct = () => {
    onClose();
    setLocation("/create/product");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2"
            onClick={handleCreatePost}
          >
            <Image className="h-5 w-5" />
            Create Post
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-start gap-2"
            onClick={handleCreateChallenge}
          >
            <Trophy className="h-5 w-5" />
            Create Challenge or Workout
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-start gap-2"
            onClick={handleCreateGroup}
          >
            <Users className="h-5 w-5" />
            Create Group
          </Button>

          {isAdmin && (
            <>
              <div className="relative pt-4 mt-2 border-t">
                <span className="absolute -top-2.5 left-0 bg-background px-2 text-xs text-muted-foreground">
                  Admin Functions
                </span>
              </div>

              <Button
                variant="outline"
                className="flex items-center justify-start gap-2"
                onClick={handleCreateProduct}
              >
                <Package className="h-5 w-5" />
                <span className="flex-1 text-left">Produkt einstellen</span>
                <Badge variant="outline" className="ml-2">Admin</Badge>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-start gap-2"
                onClick={handleCreateEvent}
              >
                <CalendarDays className="h-5 w-5" />
                <span className="flex-1 text-left">Create Event</span>
                <Badge variant="outline" className="ml-2">Admin</Badge>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-start gap-2"
                onClick={handleCreateNotification}
              >
                <Bell className="h-5 w-5" />
                <span className="flex-1 text-left">Create Push Notification</span>
                <Badge variant="outline" className="ml-2">Admin</Badge>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}