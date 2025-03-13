import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { loadScript } from "@paypal/paypal-js";
import { Package, ShoppingCart, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/contexts/AdminContext";
import { useProducts } from "@/contexts/ProductContext";

interface ProductDetailProps {
  id?: string;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const params = useParams();
  const productId = id || params.id;
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { products, updateProduct } = useProducts();
  const [isEditing, setIsEditing] = useState(false);
  const [product, setProduct] = useState(products[0]);
  const [editedProduct, setEditedProduct] = useState(product);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    const prod = products.find(p => p.id === Number(productId));
    if (prod) {
      setProduct(prod);
      setEditedProduct(prod);
    }
  }, [productId, products]);

  useEffect(() => {
    loadScript({
      clientId: "YOUR_PAYPAL_CLIENT_ID",
      currency: "EUR",
    }).then(() => setPaypalLoaded(true))
    .catch(err => {
      console.error("PayPal SDK konnte nicht geladen werden:", err);
      toast({
        title: "Fehler",
        description: "Das Bezahlsystem konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    });
  }, []);

  const handleSave = () => {
    updateProduct(editedProduct);
    setProduct(editedProduct);
    setIsEditing(false);
    toast({
      title: "Änderungen gespeichert",
      description: "Die Produktdetails wurden erfolgreich aktualisiert.",
    });
  };

  const handleCancel = () => {
    setEditedProduct(product);
    setIsEditing(false);
  };

  if (!product) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Produkt nicht gefunden</h1>
            <p className="text-muted-foreground">
              Das gesuchte Produkt konnte leider nicht gefunden werden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="relative">
              {isEditing ? (
                <div className="border-2 border-dashed rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer aspect-square">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Handle image upload
                        toast({
                          title: "Bild hochgeladen",
                          description: "Das neue Produktbild wurde hochgeladen.",
                        });
                      }
                    }}
                  />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Klicken um ein neues Bild hochzuladen
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              )}
              <Badge
                variant={
                  product.type === "supplement" ? "default" :
                  product.type === "training" ? "secondary" :
                  "outline"
                }
                className="absolute top-4 right-4"
              >
                {product.type === "training" && "Training"}
                {product.type === "coaching" && "Coaching"}
                {product.type === "supplement" && "Supplement"}
                {product.type === "custom" && "Individuell"}
              </Badge>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    value={editedProduct.name}
                    onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
                    className="text-3xl font-bold"
                  />
                  <Textarea
                    value={editedProduct.description}
                    onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})}
                    className="min-h-[100px]"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preis (€)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedProduct.price}
                      onChange={(e) => setEditedProduct({...editedProduct, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Aktiv</span>
                    <Switch
                      checked={editedProduct.isActive}
                      onCheckedChange={(checked) => setEditedProduct({...editedProduct, isActive: checked})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-muted-foreground">{product.description}</p>
                  <div className="text-2xl font-bold">
                    €{Number(product.price).toFixed(2)}
                  </div>
                </>
              )}

              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Speichern
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Bearbeiten
                    </Button>
                  )}
                </div>
              )}

              {/* Product Details */}
              {product.metadata.type === "supplement" && (
                <div className="space-y-2">
                  <p className="font-medium">Produktdetails:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Gewicht: {product.metadata.weight}g</li>
                    <li>Portionen: {product.metadata.servings}</li>
                    {Object.entries(product.metadata.nutritionFacts).map(([key, value]) => (
                      <li key={key}>{key}: {value}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(product.metadata.type === "training" || product.metadata.type === "coaching") && (
                <div className="space-y-2">
                  <p className="font-medium">Enthaltene Leistungen:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {product.metadata.includes.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    Dauer: {product.metadata.duration} {product.metadata.type === "training" ? "Wochen" : "Monate"}
                  </p>
                  {product.metadata.type === "coaching" && (
                    <p className="text-sm">
                      Coaching-Calls: {product.metadata.callsPerMonth} pro Monat
                    </p>
                  )}
                </div>
              )}

              {/* PayPal Button */}
              {!isEditing && (
                paypalLoaded ? (
                  <div id="paypal-button-container" className="mt-6"></div>
                ) : (
                  <Button disabled className="w-full mt-6">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Laden...
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}