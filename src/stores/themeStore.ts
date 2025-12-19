import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeStyle = 'default' | 'hype' | 'cute';

interface ThemeState {
  theme: ThemeStyle;
  setTheme: (theme: ThemeStyle) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'asterohype-theme',
    }
  )
);
