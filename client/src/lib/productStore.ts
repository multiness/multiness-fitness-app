import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  description: string;
  image?: string;
  type: string;
  isActive: boolean;
  isArchived: boolean;
  validUntil?: string;
  price?: number;
}

interface ProductStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  archiveProduct: (id: number) => void;
}

export const useProducts = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),
      updateProduct: (updatedProduct) => set((state) => ({
        products: state.products.map(product =>
          product.id === updatedProduct.id ? updatedProduct : product
        )
      })),
      archiveProduct: (id) => set((state) => ({
        products: state.products.map(product =>
          product.id === id ? { ...product, isArchived: true, isActive: false } : product
        )
      }))
    }),
    {
      name: 'product-storage',
      version: 1,
    }
  )
);
