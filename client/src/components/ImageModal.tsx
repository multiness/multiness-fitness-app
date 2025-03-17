import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ImageModalProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

export default function ImageModal({ src, alt, open, onClose }: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="relative aspect-square">
          <img
            src={src || "/placeholder-avatar.png"}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
