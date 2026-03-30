import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AppState {
  cart: string[];
  favorites: string[];
  sceneIntent: {
    lastViewedProductId: string | null;
    timestamp: number;
  };
  addToCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  updateSceneIntent: (productId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      sceneIntent: {
        lastViewedProductId: null,
        timestamp: 0,
      },
      addToCart: (productId) => {
        set((state) => ({
          cart: state.cart.includes(productId) ? state.cart : [...state.cart, productId],
        }));
      },
      toggleFavorite: (productId) => {
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        }));
      },
      updateSceneIntent: (productId) => {
        set({
          sceneIntent: {
            lastViewedProductId: productId,
            timestamp: Date.now(),
          },
        });
      },
    }),
    {
      name: "ar-decor-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
