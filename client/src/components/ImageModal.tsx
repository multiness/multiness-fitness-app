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
      <DialogContent className="max-w-4xl p-4">
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            style={{ imageRendering: 'auto' }}
            loading="eager"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}