import { createContext, useContext, useState, ReactNode } from "react";
import { mockProducts } from "../data/mockData";

interface ProductContextType {
  products: any[];
  updateProduct: (updatedProduct: any) => void;
}

const ProductContext = createContext<ProductContextType>({
  products: mockProducts,
  updateProduct: () => {},
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(mockProducts);

  const updateProduct = (updatedProduct: any) => {
    console.log('Updating product:', updatedProduct); // Debug log
    setProducts(currentProducts => {
      const newProducts = currentProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
      console.log('Updated products:', newProducts); // Debug log
      return newProducts;
    });
  };

  return (
    <ProductContext.Provider value={{ products, updateProduct }}>
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