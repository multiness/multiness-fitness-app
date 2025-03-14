import { createContext, useContext, useState, ReactNode } from "react";
import { mockProducts } from "../data/mockData";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  type: string;
  isActive: boolean;
  isArchived: boolean;
  validUntil?: string;
  stockEnabled?: boolean;
  stock?: number;
  onSale?: boolean;
  salePrice?: number;
  saleType?: 'Sale' | 'Budget' | 'Angebot';
  metadata: any;
}

interface ProductContextType {
  products: Product[];
  updateProduct: (updatedProduct: Product) => void;
  addProduct: (newProduct: Omit<Product, "id">) => void;
  decreaseStock: (productId: number) => void;
}

const ProductContext = createContext<ProductContextType>({
  products: [],
  updateProduct: () => {},
  addProduct: () => {},
  decreaseStock: () => {},
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const updateProduct = (updatedProduct: Product) => {
    setProducts(currentProducts => currentProducts.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
  };

  const addProduct = (newProduct: Omit<Product, "id">) => {
    // Entferne mögliche zyklische Referenzen und erstelle ein flaches Objekt
    const sanitizedProduct = {
      ...newProduct,
      id: Math.max(...products.map(p => p.id), 0) + 1,
      image: newProduct.image || "",
      isActive: true,
      isArchived: false,
      metadata: typeof newProduct.metadata === 'object' ? { ...newProduct.metadata } : {}
    };

    setProducts(currentProducts => [...currentProducts, sanitizedProduct]);
  };

  const decreaseStock = (productId: number) => {
    setProducts(currentProducts => currentProducts.map(product => {
      if (product.id === productId && product.stockEnabled && product.stock) {
        const newStock = product.stock - 1;
        return {
          ...product,
          stock: newStock,
          isActive: newStock > 0,
          isArchived: newStock === 0
        };
      }
      return product;
    }));
  };

  return (
    <ProductContext.Provider value={{ products, updateProduct, addProduct, decreaseStock }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}