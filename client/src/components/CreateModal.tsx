import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Users, Image } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const [, setLocation] = useLocation();

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
        </div>
      </DialogContent>
    </Dialog>
  );
}