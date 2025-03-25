import { create } from 'zustand';

export interface Banner {
  id: number;
  name: string;
  positionId: string;
  description: string;
  appImage: string;
  webImage: string;
  isActive: boolean;
  buttons: Array<{
    text: string;
    url: string;
  }>;
  stats: {
    views: number;
    clicks: number;
    ctr: string;
  };
  createdAt: Date;
}

interface BannerStore {
  banners: Banner[];
  updateBanner: (id: number, data: Partial<Banner>) => void;
  createBanner: (banner: Omit<Banner, 'id' | 'createdAt' | 'stats'>) => void;
  archiveBanner: (id: number) => void;
}

export const useBannerStore = create<BannerStore>()((set) => ({
  banners: [],
  
  updateBanner: (id, data) =>
    set((state) => ({
      banners: state.banners.map((banner) =>
        banner.id === id ? { ...banner, ...data } : banner
      )
    })),
  
  createBanner: (banner) =>
    set((state) => ({
      banners: [
        ...state.banners,
        {
          ...banner,
          id: state.banners.length + 1,
          createdAt: new Date(),
          stats: {
            views: 0,
            clicks: 0,
            ctr: '0%'
          }
        }
      ]
    })),
  
  archiveBanner: (id) =>
    set((state) => ({
      banners: state.banners.map((banner) =>
        banner.id === id ? { ...banner, isActive: false } : banner
      )
    }))
}));
