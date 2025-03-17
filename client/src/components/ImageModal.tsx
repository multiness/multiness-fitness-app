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
      <DialogContent className="max-w-screen-xl w-[95vw] p-4 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="w-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg"
            style={{
              imageRendering: 'auto',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitFontSmoothing: 'antialiased',
            }}
            loading="eager"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}