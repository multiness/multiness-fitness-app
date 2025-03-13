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
    setProducts(currentProducts => 
      currentProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  return (
    <ProductContext.Provider value={{ products, updateProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
