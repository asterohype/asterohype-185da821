import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesStore {
  favorites: string[]; // Array of product IDs
  
  // Actions
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (productId) => {
        const { favorites } = get();
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] });
        }
      },

      removeFavorite: (productId) => {
        set({
          favorites: get().favorites.filter(id => id !== productId)
        });
      },

      toggleFavorite: (productId) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.includes(productId)) {
          removeFavorite(productId);
        } else {
          addFavorite(productId);
        }
      },

      isFavorite: (productId) => {
        return get().favorites.includes(productId);
      },

      getFavoritesCount: () => {
        return get().favorites.length;
      },
    }),
    {
      name: 'asterohype-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
