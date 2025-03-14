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
import { Package, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/contexts/ProductContext";

// Verbesserte Standard-Bilder für verschiedene Produkttypen
const defaultProductImages = {
  training: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&auto=format", // Fitness Training Image
  coaching: "https://images.unsplash.com/photo-1475823678248-624fc6f85785?w=800&auto=format", // Professional Coaching Image
  supplement: "https://images.unsplash.com/photo-1612187029134-67b11293e7e0?w=800&auto=format", // Supplement Products Image
  custom: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M12 8v1M12 15v1M8 12h1M15 12h1'/%3E%3C/svg%3E", // Neutrales Produkticon
};

// Standardmetadaten nur für vordefinierte Produkttypen
const defaultMetadata = {
  training: {
    type: "training",
    duration: 4,
    sessions: 12,
    includes: ["Individueller Trainingsplan", "Video-Anleitungen", "Support via Chat"]
  },
  coaching: {
    type: "coaching",
    duration: 1,
    callsPerMonth: 4,
    includes: ["1:1 Coaching Sessions", "Personalisierte Beratung", "24/7 Support"]
  },
  supplement: {
    type: "supplement",
    weight: 1000,
    servings: 30,
    includes: ["Premium Qualität", "100% Natural", "Made in Germany"]
  }
};

export default function CreateProduct() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addProduct } = useProducts();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string>("");
  const [productType, setProductType] = useState<"training" | "coaching" | "supplement" | "custom">("training");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isGratis, setIsGratis] = useState(false);

  // Formularfelder
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [saleType, setSaleType] = useState<"Sale" | "Budget" | "Angebot">("Sale");

  const handleImageSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Read the file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          setSelectedImage(file);
          setSelectedImagePreview(base64String);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDateSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'date';
    input.onchange = (e) => {
      const date = (e.target as HTMLInputElement).value;
      if (date) {
        setSelectedDate(date);
      }
    };
    input.click();
  };

  const handleProductSubmit = async () => {
    console.log("Starting product submission");

    // Validiere die Pflichtfelder
    if (!name.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte geben Sie einen Produktnamen ein.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte geben Sie eine Produktbeschreibung ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Erstelle das Produkt-Objekt
      const newProduct = {
        name,
        description,
        type: productType,
        price: isGratis ? 0 : price,
        image: selectedImagePreview || defaultProductImages[productType],
        creatorId: 1, // Temporär für den Prototyp
        isActive: true,
        isArchived: false,
        metadata: productType === 'custom'
          ? { type: 'custom' as const }
          : defaultMetadata[productType],
      };

      // Optional fields
      if (selectedDate) {
        newProduct.validUntil = selectedDate;
      }

      if (stockEnabled) {
        newProduct.stockEnabled = true;
        newProduct.stock = stock;
      }

      if (onSale) {
        newProduct.onSale = true;
        newProduct.salePrice = salePrice;
        newProduct.saleType = saleType;
      }

      console.log("Submitting new product:", newProduct);
      await addProduct(newProduct);

      // Bereinige die temporäre URL
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }

      toast({
        title: "Produkt erstellt!",
        description: "Das Produkt wurde erfolgreich erstellt.",
      });

      setLocation("/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Fehler",
        description: "Das Produkt konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Produkt erstellen</h1>

      <Card className="mb-20">
        <CardHeader>
          <CardTitle>Produktdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            onClick={handleImageSelect}
            className="border-2 border-dashed rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer"
          >
            {selectedImagePreview ? (
              <div className="aspect-video relative overflow-hidden rounded-md">
                <img
                  src={selectedImagePreview}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {productType === "custom" ? "Standard-Produktbild wird verwendet" : `Standard ${productType}-Bild wird verwendet`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Name*</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Premium Fitness Coaching"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung*</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibe dein Produkt..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Gratis Produkt</Label>
                <Switch
                  checked={isGratis}
                  onCheckedChange={setIsGratis}
                />
              </div>
              {!isGratis && (
                <div className="space-y-2">
                  <Label>Preis (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="z.B. 49.99"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Produkttyp</Label>
              <Select
                value={productType}
                onValueChange={(value: "training" | "coaching" | "supplement" | "custom") => {
                  setProductType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle einen Produkttyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="custom">Individuell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bestandsverwaltung</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={stockEnabled}
                  onCheckedChange={setStockEnabled}
                />
                <Label>Bestand verwalten</Label>
              </div>
              {stockEnabled && (
                <Input
                  type="number"
                  placeholder="Verfügbare Menge"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Sonderangebot</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={onSale}
                  onCheckedChange={setOnSale}
                />
                <Label>Sonderpreis aktivieren</Label>
              </div>
              {onSale && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Sonderpreis"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                  />
                  <Select
                    value={saleType}
                    onValueChange={(value: "Sale" | "Budget" | "Angebot") => setSaleType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Art des Angebots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Budget">Budget</SelectItem>
                      <SelectItem value="Angebot">Angebot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gültig bis (optional)</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={handleDateSelect}
              >
                {selectedDate || "Datum auswählen"}
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleProductSubmit}
            >
              <Package className="h-4 w-4 mr-2" />
              Produkt erstellen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}