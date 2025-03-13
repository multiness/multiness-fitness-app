import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Euro, Archive, Clock } from "lucide-react";
import { mockProducts } from "../data/mockData";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "active") {
      return matchesSearch && product.isActive && !product.isArchived;
    } else if (activeTab === "expired") {
      return matchesSearch && product.validUntil && new Date(product.validUntil) < new Date();
    } else {
      return matchesSearch && product.isArchived;
    }
  });

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Shop</h1>
        </div>
        <Link href="/create/product">
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Produkt erstellen
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Nach Produkten suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Aktiv</TabsTrigger>
          <TabsTrigger value="expired">Abgelaufen</TabsTrigger>
          <TabsTrigger value="archived">Archiviert</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} showExpired />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} showArchived />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductCard({ product, showExpired, showArchived }: { 
  product: any; 
  showExpired?: boolean;
  showArchived?: boolean;
}) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className={`overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${showArchived ? 'opacity-75' : ''}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <Badge variant={
              product.type === "supplement" ? "default" :
              product.type === "training" ? "secondary" :
              product.type === "coaching" ? "outline" :
              "default"
            }>
              {product.type === "training" && "Training"}
              {product.type === "coaching" && "Coaching"}
              {product.type === "supplement" && "Supplement"}
              {product.type === "custom" && "Individuell"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-semibold">
              <Euro className="h-4 w-4" />
              {Number(product.price).toFixed(2)}
            </div>
            {product.validUntil && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(product.validUntil).toLocaleDateString()}
              </div>
            )}
            {product.isArchived && (
              <Badge variant="outline" className="gap-1">
                <Archive className="h-3 w-3" />
                Archiviert
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}