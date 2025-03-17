import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";
import { ImagePlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const MAX_IMAGE_SIZE = 200; // Kleinere maximale Dimension für bessere Komprimierung
const MAX_FILE_SIZE = 500 * 1024; // 500KB maximale Dateigröße

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Berechne neue Dimensionen unter Beibehaltung des Seitenverhältnisses
        if (width > height && width > MAX_IMAGE_SIZE) {
          height = Math.round((height * MAX_IMAGE_SIZE) / width);
          width = MAX_IMAGE_SIZE;
        } else if (height > MAX_IMAGE_SIZE) {
          width = Math.round((width * MAX_IMAGE_SIZE) / height);
          height = MAX_IMAGE_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Aktiviere Bildglättung für bessere Qualität
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Stärkere Kompression mit WebP
        const compressedImage = canvas.toDataURL('image/webp', 0.4);

        // Überprüfe die Größe des komprimierten Bildes
        const base64Length = compressedImage.length - (compressedImage.indexOf(',') + 1);
        const size = (base64Length * 3) / 4;

        if (size > MAX_FILE_SIZE) {
          reject(new Error("Das Bild ist zu groß. Bitte versuche es mit einem kleineren Bild."));
          return;
        }

        resolve(compressedImage);
      };
      img.onerror = () => reject(new Error("Fehler beim Laden des Bildes"));
    };
    reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
  });
};

const profileSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  username: z.string().min(2, "Benutzername muss mindestens 2 Zeichen lang sein"),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  bannerImage: z.string().optional(),
  teamRole: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const teamRoles = [
  { value: "Head Trainer", label: "Head Trainer" },
  { value: "Trainer", label: "Trainer" },
  { value: "Kursleiter", label: "Kursleiter" },
  { value: "Community Manager", label: "Community Manager" },
];

interface EditProfileDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProfileFormData) => void;
}

export default function EditProfileDialog({ user, open, onOpenChange, onSave }: EditProfileDialogProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatar || undefined);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(user.bannerImage || undefined);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      bio: user.bio || "",
      avatar: user.avatar || undefined,
      bannerImage: user.bannerImage || undefined,
      teamRole: user.teamRole || undefined,
    },
  });

  const handleImageUpload = async (file: File, isAvatar: boolean) => {
    try {
      const compressedImage = await compressImage(file);
      if (isAvatar) {
        setAvatarPreview(compressedImage);
        form.setValue("avatar", compressedImage);
      } else {
        setBannerPreview(compressedImage);
        form.setValue("bannerImage", compressedImage);
      }
    } catch (error) {
      toast({
        title: "Fehler beim Bildupload",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, true);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Profil bearbeiten</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-2">
                <Label>Profilbanner</Label>
                <div className="relative">
                  <div className="w-full h-24 bg-muted rounded-lg overflow-hidden">
                    {bannerPreview ? (
                      <img 
                        src={bannerPreview} 
                        alt="Banner Vorschau"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                    id="banner-upload"
                  />
                  <Label
                    htmlFor="banner-upload"
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md cursor-pointer hover:bg-background"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Label>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={avatarPreview} className="object-cover" />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Profilbild ändern
                  </Label>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Erzähle etwas über dich..."
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(user.isVerified || user.isAdmin || user.isTeamMember) && (
                <FormField
                  control={form.control}
                  name="teamRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position im Team</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle deine Position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamRoles.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit">Speichern</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}