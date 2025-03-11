import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Users, Image } from "lucide-react";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
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
            onClick={() => {
              onClose();
              // Handle create post
            }}
          >
            <Image className="h-5 w-5" />
            Create Post
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2"
            onClick={() => {
              onClose();
              // Handle create challenge
            }}
          >
            <Trophy className="h-5 w-5" />
            Create Challenge
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2"
            onClick={() => {
              onClose();
              // Handle create group
            }}
          >
            <Users className="h-5 w-5" />
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
