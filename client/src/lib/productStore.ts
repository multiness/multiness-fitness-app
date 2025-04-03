import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
  image?: string;
  type: 'training' | 'coaching' | 'supplement' | 'custom';
  available?: boolean;
  stockEnabled?: boolean;
  stock?: number;
  category?: string;
  featured?: boolean;
  createdAt: Date;
  creatorId: number;
}

interface ProductStore {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: number, updatedProduct: Partial<Product>) => void;
  removeProduct: (id: number) => void;
  getFeaturedProducts: () => Product[];
}

// Hilsfunktion, um beim ersten Aufruf die Beispiel-Produkte zu erstellen, falls noch keine existieren
export function loadInitialProducts() {
  // Diese Funktion wird in Home.tsx aufgerufen, um sicherzustellen, dass Daten vorhanden sind
  // Tut nichts, wenn bereits Produkte existieren
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [
        {
          id: 1,
          name: 'Personalisierter Trainingsplan',
          description: 'Ein auf deine Bedürfnisse zugeschnittener 8-Wochen Trainingsplan mit wöchentlichen Anpassungen und Support.',
          price: 149.99,
          salePrice: 99.99,
          onSale: true,
          image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&auto=format',
          type: 'coaching',
          available: true,
          featured: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          creatorId: 1
        },
        {
          id: 2,
          name: 'Premium Protein Pulver',
          description: 'Hochwertiges Protein mit 25g Protein pro Portion, ideal für Muskelaufbau und Regeneration.',
          price: 39.99,
          image: 'https://images.unsplash.com/photo-1612442443556-09b5b309e637?w=800&auto=format',
          type: 'supplement',
          available: true,
          stockEnabled: true,
          stock: 42,
          category: 'Nahrungsergänzung',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
          creatorId: 2
        },
        {
          id: 3,
          name: 'Fitness Grundlagen Kurs',
          description: 'Online-Kurs für Einsteiger: Lerne die Grundlagen des effektiven Trainings und der richtigen Ernährung.',
          price: 59.99,
          type: 'training',
          available: true,
          featured: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          creatorId: 3
        },
        {
          id: 4,
          name: 'Online Ernährungsberatung',
          description: '1:1 Online-Beratung zur Optimierung deiner Ernährung für deine Fitnessziele.',
          price: 89.99,
          type: 'coaching',
          available: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          creatorId: 1
        },
        {
          id: 5,
          name: 'BCAA Komplex',
          description: 'Hochwertiger BCAA-Komplex zur Unterstützung der Muskelregeneration und des Muskelaufbaus.',
          price: 29.99,
          salePrice: 24.99,
          onSale: true,
          image: 'https://images.unsplash.com/photo-1601478431277-708b9fa9e9c3?w=800&auto=format',
          type: 'supplement',
          available: true,
          stockEnabled: true,
          stock: 0,
          category: 'Nahrungsergänzung',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
          creatorId: 2
        },
        {
          id: 6,
          name: 'Yoga für Sportler Kurs',
          description: 'Verbessere Flexibilität, Regeneration und mentale Stärke mit speziellem Yoga für Athleten.',
          price: 49.99,
          type: 'training',
          available: true,
          featured: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
          creatorId: 4
        }
      ],
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),
      
      updateProduct: (id, updatedProduct) => set((state) => ({
        products: state.products.map(product => 
          product.id === id ? { ...product, ...updatedProduct } : product
        )
      })),
      
      removeProduct: (id) => set((state) => ({
        products: state.products.filter(product => product.id !== id)
      })),
      
      getFeaturedProducts: () => {
        return get().products.filter(product => product.featured === true && product.available !== false);
      },
    }),
    {
      name: 'product-store'
    }
  )
);