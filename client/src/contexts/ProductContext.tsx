import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  updateProduct: (updatedProduct: Product) => Promise<void>;
  addProduct: (newProduct: Omit<Product, "id">) => Promise<void>;
  decreaseStock: (productId: number) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType>({
  products: [],
  updateProduct: async () => {},
  addProduct: async () => {},
  decreaseStock: async () => {},
  deleteProduct: async () => {},
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedProduct,
          validUntil: updatedProduct.validUntil ? new Date(updatedProduct.validUntil) : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const addProduct = async (newProduct: Omit<Product, "id">) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      await fetchProducts(); // Aktualisiere die Produktliste nach dem Löschen
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const decreaseStock = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product && product.stockEnabled && product.stock) {
      const updatedProduct = {
        ...product,
        stock: product.stock - 1,
        isActive: product.stock - 1 > 0,
        isArchived: product.stock - 1 === 0
      };
      await updateProduct(updatedProduct);
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      updateProduct, 
      addProduct, 
      decreaseStock,
      deleteProduct 
    }}>
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