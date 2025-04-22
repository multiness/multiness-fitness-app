import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Euro } from "lucide-react";
import { Link } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useProducts } from "@/contexts/ProductContext";
import { Product } from "../lib/productStore";

// Fallback-Bilder für verschiedene Produkttypen
const defaultProductImages: Record<string, string> = {
  training: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&auto=format",
  coaching: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format",
  supplement: "https://images.unsplash.com/photo-1614054450506-e6aa199146c4?w=800&auto=format",
  custom: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M12 8v1M12 15v1M8 12h1M15 12h1'/%3E%3C/svg%3E",
};

interface ProductSliderProps {
  products?: any[];
}

export default function ProductSlider({ products: propProducts }: ProductSliderProps) {
  const { products: contextProducts } = useProducts();
  const products = propProducts || contextProducts;
  const activeProducts = products.filter((p: any) => p.available !== false);

  const getProductImage = (product: any) => {
    return product.image || defaultProductImages[product.type] || defaultProductImages.custom;
  };

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {activeProducts.map((product) => (
          <CarouselItem key={product.id} className="basis-full md:basis-1/2 lg:basis-1/3 pl-4">
            <Link href={`/products/${product.id}`}>
              <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
                <CardHeader className="p-0 relative">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant={product.type === "supplement" ? "default" : "secondary"}>
                      {product.type === "training" && "Training"}
                      {product.type === "coaching" && "Coaching"}
                      {product.type === "supplement" && "Supplement"}
                      {product.type === "custom" && "Individuell"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  {/* Neu strukturiertes Layout für optimierte Darstellung */}
                  <div className="flex flex-col gap-3">
                    {/* Preis-Informationen in eigener Zeile, damit sie immer voll sichtbar sind */}
                    <div className="flex items-center flex-wrap gap-2 font-semibold">
                      {product.onSale ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {product.salePrice ? (
                            <>
                              <span className="text-red-500 font-bold">€{Number(product.salePrice).toFixed(2)}</span>
                              <span className="text-xs line-through text-muted-foreground">
                                €{Number(product.price).toFixed(2)}
                              </span>
                              <Badge variant="outline" className="bg-red-50 text-red-500 ml-auto">
                                Angebot
                              </Badge>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-red-500">Angebot</span>
                              <span>€{Number(product.price).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        Number(product.price) === 0 ? (
                          <span className="text-green-500">Gratis</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Euro className="h-4 w-4" />
                            <span>{Number(product.price).toFixed(2)}</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Button immer in voller Breite, auch auf Desktop */}
                    <div className="w-full">
                      {product.stockEnabled && product.stock === 0 ? (
                        <Badge variant="outline" className="text-red-500">
                          Ausverkauft
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full text-sm py-1 h-8"
                          disabled={product.stockEnabled && product.stock === 0}
                        >
                          {product.stockEnabled && product.stock === 0 ? "Ausverkauft" : "Jetzt kaufen"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}