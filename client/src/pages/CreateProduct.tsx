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

export default function CreateProduct() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addProduct } = useProducts();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [productType, setProductType] = useState<"training" | "coaching" | "supplement" | "custom">("training");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [onSale, setOnSale] = useState(false);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "training",
      price: 0,
      isActive: true,
      isArchived: false,
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
      validUntil: undefined,
    },
  });

  const handleImageSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleSubmit = async (data: InsertProduct) => {
    try {
      // Create new product object
      const newProduct = {
        ...data,
        image: selectedImage ? URL.createObjectURL(selectedImage) : "",
        createdAt: new Date().toISOString(),
      };

      // Add the new product to context
      addProduct(newProduct);

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
    <div className="container max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Produkt erstellen</h1>

      <Card className="mb-20">
        <CardHeader>
          <CardTitle>Produktdetails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Produktbild */}
            <div className="space-y-2">
              <Label>Produktbild</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={handleImageSelect}
                role="button"
                tabIndex={0}
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

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

              {/* Produkttyp */}
              <div className="space-y-2">
                <Label htmlFor="type">Produkttyp</Label>
                <Select
                  value={productType}
                  onValueChange={(value: "training" | "coaching" | "supplement" | "custom") => {
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

              {/* Bestandsverwaltung */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bestandsverwaltung</Label>
                    <p className="text-sm text-muted-foreground">
                      Bestand für dieses Produkt verwalten
                    </p>
                  </div>
                  <Switch
                    checked={stockEnabled}
                    onCheckedChange={(checked) => {
                      setStockEnabled(checked);
                      form.setValue("stockEnabled", checked);
                    }}
                  />
                </div>

                {stockEnabled && (
                  <div className="space-y-2">
                    <Label>Verfügbare Menge</Label>
                    <Input
                      type="number"
                      min="0"
                      {...form.register("stock", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>

              {/* Sonderangebot */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sonderangebot</Label>
                    <p className="text-sm text-muted-foreground">
                      Sonderpreis für dieses Produkt aktivieren
                    </p>
                  </div>
                  <Switch
                    checked={onSale}
                    onCheckedChange={(checked) => {
                      setOnSale(checked);
                      form.setValue("onSale", checked);
                    }}
                  />
                </div>

                {onSale && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Angebotspreis (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("salePrice", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Art des Angebots</Label>
                      <Select
                        value={form.watch("saleType")}
                        onValueChange={(value: "Sale" | "Budget" | "Angebot") => form.setValue("saleType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wähle die Art des Angebots" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sale">Sale</SelectItem>
                          <SelectItem value="Budget">Budget</SelectItem>
                          <SelectItem value="Angebot">Angebot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Ablaufdatum (optional) */}
              <div className="space-y-2">
                <Label htmlFor="validUntil">Gültig bis (optional)</Label>
                <input 
                  type="datetime-local"
                  id="validUntil"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("validUntil", { required: false })}
                />
              </div>

              {/* Aktiv/Inaktiv */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktiv</Label>
                  <p className="text-sm text-muted-foreground">
                    Produkt im Shop anzeigen
                  </p>
                </div>
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
              </div>

              <Button 
                className="w-full mt-6" 
                type="submit"
              >
                <Package className="h-4 w-4 mr-2" />
                Produkt erstellen
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}