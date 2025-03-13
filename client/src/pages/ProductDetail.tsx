import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { loadScript } from "@paypal/paypal-js";
import { mockProducts } from "../data/mockData";
import { Package, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailProps {
  id?: string;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const params = useParams();
  const productId = id || params.id;
  const { toast } = useToast();
  
  const [product, setProduct] = useState(mockProducts[0]);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    const prod = mockProducts.find(p => p.id === Number(productId));
    if (prod) {
      setProduct(prod);
    }
  }, [productId]);

  useEffect(() => {
    loadScript({
      "client-id": "YOUR_PAYPAL_CLIENT_ID",
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

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: product.price.toString(),
          currency_code: "EUR",
        },
        description: product.name,
      }],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      toast({
        title: "Erfolg!",
        description: `Vielen Dank für Ihren Kauf, ${details.payer.name?.given_name}!`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Zahlung konnte nicht abgeschlossen werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full rounded-lg object-cover aspect-square"
              />
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
              </Badge>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.description}</p>

              <div className="text-2xl font-bold">
                €{product.price.toFixed(2)}
              </div>

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
                    {product.metadata.includes.map((item, index) => (
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

              {/* PayPal Button Container */}
              {paypalLoaded ? (
                <div id="paypal-button-container" className="mt-6"></div>
              ) : (
                <Button disabled className="w-full mt-6">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Laden...
                </Button>
              )}

              {/* PayPal Button Render */}
              {paypalLoaded && window.paypal?.Buttons &&
                window.paypal.Buttons({
                  createOrder,
                  onApprove,
                  style: {
                    layout: 'vertical',
                    shape: 'rect',
                  }
                }).render("#paypal-button-container")
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
