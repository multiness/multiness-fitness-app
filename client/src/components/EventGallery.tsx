import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, X } from "lucide-react";

interface EventGalleryProps {
  images: string[];
  onAddImage?: (image: string) => void;
  onRemoveImage?: (index: number) => void;
  isEditable?: boolean;
}

export default function EventGallery({ images, onAddImage, onRemoveImage, isEditable = false }: EventGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onAddImage?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative overflow-hidden group">
            <img
              src={image}
              alt={`Event image ${index + 1}`}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={() => setSelectedImage(image)}
            />
            {isEditable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveImage?.(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
        
        {isEditable && (
          <Card className="relative h-48 flex items-center justify-center">
            <input
              type="file"
              id="gallery-image"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <label htmlFor="gallery-image" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <span>Bild hinzufügen</span>
              </div>
            </label>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img src={selectedImage} alt="Selected event image" className="max-w-full max-h-full object-contain" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
