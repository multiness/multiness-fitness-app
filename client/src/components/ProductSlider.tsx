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

export default function ProductSlider() {
  const { products } = useProducts();
  const activeProducts = products.filter(p => p.isActive && !p.isArchived);

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
                    src={product.image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format"}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-semibold">
                      <Euro className="h-4 w-4" />
                      {Number(product.price).toFixed(2)}
                    </div>
                    <Button size="sm">
                      Jetzt kaufen
                    </Button>
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