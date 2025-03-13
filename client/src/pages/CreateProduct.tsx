import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { Package, Image as ImageIcon } from "lucide-react";

export default function CreateProduct() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [productType, setProductType] = useState<"training" | "coaching" | "supplement">("training");

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      type: "training",
      isActive: true,
      metadata: {
        type: "training",
        duration: 4,
        sessions: 12,
        includes: [],
      },
    },
  });

  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedImage(file);
      }
    };
    input.click();
  };

  const onSubmit = async (data: InsertProduct) => {
    try {
      // TODO: Implement file upload and product creation
      toast({
        title: "Produkt erstellt!",
        description: "Das Produkt wurde erfolgreich erstellt.",
      });
      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Produkt konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Produkt erstellen</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Produktdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Produktbild */}
            <div className="space-y-2">
              <Label>Produktbild</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={handleImageSelect}
              >
                {selectedImage ? (
                  <div className="aspect-video relative overflow-hidden rounded-md">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Vorschau"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Klicken um ein Bild hochzuladen
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Produktname */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="z.B. Premium Fitness Coaching"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Produktbeschreibung */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Beschreibe dein Produkt..."
                className="min-h-[100px]"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Produkttyp */}
            <div className="space-y-2">
              <Label htmlFor="type">Produkttyp</Label>
              <Select
                value={productType}
                onValueChange={(value: "training" | "coaching" | "supplement") => {
                  setProductType(value);
                  form.setValue("type", value);
                  // Reset metadata based on type
                  switch (value) {
                    case "training":
                      form.setValue("metadata", {
                        type: "training",
                        duration: 4,
                        sessions: 12,
                        includes: [],
                      });
                      break;
                    case "coaching":
                      form.setValue("metadata", {
                        type: "coaching",
                        duration: 1,
                        callsPerMonth: 4,
                        includes: [],
                      });
                      break;
                    case "supplement":
                      form.setValue("metadata", {
                        type: "supplement",
                        weight: 1000,
                        servings: 30,
                        nutritionFacts: {},
                      });
                      break;
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle einen Produkttyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preis */}
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register("price", { valueAsNumber: true })}
                placeholder="49.99"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            {/* Dynamische Metadaten basierend auf Produkttyp */}
            {productType === "training" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Dauer (Wochen)</Label>
                    <Input
                      id="duration"
                      type="number"
                      {...form.register("metadata.duration", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessions">Trainingseinheiten</Label>
                    <Input
                      id="sessions"
                      type="number"
                      {...form.register("metadata.sessions", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {productType === "coaching" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Dauer (Monate)</Label>
                    <Input
                      id="duration"
                      type="number"
                      {...form.register("metadata.duration", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="callsPerMonth">Calls pro Monat</Label>
                    <Input
                      id="callsPerMonth"
                      type="number"
                      {...form.register("metadata.callsPerMonth", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {productType === "supplement" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Gewicht (g)</Label>
                    <Input
                      id="weight"
                      type="number"
                      {...form.register("metadata.weight", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servings">Portionen</Label>
                    <Input
                      id="servings"
                      type="number"
                      {...form.register("metadata.servings", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">
              <Package className="h-4 w-4 mr-2" />
              Produkt erstellen
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
