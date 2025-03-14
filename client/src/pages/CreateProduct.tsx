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
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/contexts/ProductContext";

const defaultProductImages = {
  training: "/images/default-training.svg",
  coaching: "/images/default-coaching.svg",
  supplement: "/images/default-supplement.svg",
  custom: "/images/default-product.svg",
};

export default function CreateProduct() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addProduct } = useProducts();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [productType, setProductType] = useState<"training" | "coaching" | "supplement" | "custom">("training");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema.extend({
      name: insertProductSchema.shape.name.min(1, "Produktname ist erforderlich"),
      description: insertProductSchema.shape.description.min(1, "Produktbeschreibung ist erforderlich"),
    })),
    defaultValues: {
      name: "",
      description: "",
      type: "training",
      price: 0,
      isActive: true,
      metadata: {
        type: "training",
        duration: 4,
        sessions: 12,
        includes: [],
      },
      stockEnabled: false,
      stock: 0,
      onSale: false,
      salePrice: 0,
      saleType: "Sale",
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

    // Validiere das Formular
    const validationResult = await form.trigger();
    if (!validationResult) {
      console.log("Form validation failed:", form.formState.errors);
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = form.getValues();
      console.log("Form data:", formData);

      const newProduct = {
        ...formData,
        image: selectedImage ? URL.createObjectURL(selectedImage) : defaultProductImages[productType],
        createdAt: new Date().toISOString(),
        isActive: true,
        isArchived: false,
        validUntil: selectedDate,
      };

      console.log("Submitting new product:", newProduct);
      await addProduct(newProduct);

      toast({
        title: "Produkt erstellt!",
        description: "Das Produkt wurde erfolgreich erstellt.",
      });

      // Navigiere zur Produktübersicht statt zum Admin-Panel
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
              <Input {...form.register("name")} placeholder="z.B. Premium Fitness Coaching" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Beschreibung*</Label>
              <Textarea {...form.register("description")} placeholder="Beschreibe dein Produkt..." className="min-h-[100px]" />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preis (€)</Label>
              <Input 
                type="number" 
                step="0.01" 
                {...form.register("price", { valueAsNumber: true })} 
                placeholder="0.00 für kostenlose Produkte" 
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Produkttyp</Label>
              <Select
                value={productType}
                onValueChange={(value: "training" | "coaching" | "supplement" | "custom") => {
                  setProductType(value);
                  form.setValue("type", value);
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
                    case "custom":
                      form.setValue("metadata", {
                        type: "custom",
                        specifications: {},
                        includes: [],
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
                  {...form.register("stock", { valueAsNumber: true })}
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
                    {...form.register("salePrice", { valueAsNumber: true })}
                  />
                  <Select
                    value={form.watch("saleType")}
                    onValueChange={(value: "Sale" | "Budget" | "Angebot") => form.setValue("saleType", value)}
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

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label>Produktstatus</Label>
                <p className="text-sm text-muted-foreground">Produkt im Shop anzeigen</p>
              </div>
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
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