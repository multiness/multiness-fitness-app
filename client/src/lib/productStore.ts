import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type?: 'training' | 'coaching' | 'supplement' | 'custom';
  available?: boolean;
  features?: string[];
  ratings?: {
    average: number;
    count: number;
  };
  onSale?: boolean;
  salePrice?: number;
  stockEnabled?: boolean;
  stock?: number;
  isActive?: boolean;
  isArchived?: boolean;
};

type ProductStore = {
  products: Record<number, Product>;
  cartItems: Record<number, number>; // productId -> quantity
  addProduct: (product: Omit<Product, 'id'>) => number;
  updateProduct: (productId: number, data: Partial<Product>) => void;
  removeProduct: (productId: number) => void;
  addToCart: (productId: number, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: {},
      cartItems: {},

      addProduct: (productData) => {
        const id = Date.now();
        const product = { ...productData, id };

        set((state) => ({
          products: {
            ...state.products,
            [id]: product
          }
        }));

        return id;
      },

      updateProduct: (productId, data) => {
        set((state) => ({
          products: {
            ...state.products,
            [productId]: {
              ...state.products[productId],
              ...data
            }
          }
        }));
      },

      removeProduct: (productId) => {
        set((state) => {
          const newProducts = { ...state.products };
          delete newProducts[productId];
          return { products: newProducts };
        });
      },

      addToCart: (productId, quantity = 1) => {
        set((state) => ({
          cartItems: {
            ...state.cartItems,
            [productId]: (state.cartItems[productId] || 0) + quantity
          }
        }));
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newCartItems = { ...state.cartItems };
          delete newCartItems[productId];
          return { cartItems: newCartItems };
        });
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          cartItems: {
            ...state.cartItems,
            [productId]: quantity
          }
        }));
      },

      clearCart: () => {
        set({ cartItems: {} });
      },

      getCartTotal: () => {
        const { products, cartItems } = get();
        return Object.entries(cartItems).reduce((total, [productId, quantity]) => {
          const product = products[parseInt(productId)];
          return total + (product ? product.price * quantity : 0);
        }, 0);
      }
    }),
    {
      name: 'product-storage',
      version: 1,
    }
  )
);