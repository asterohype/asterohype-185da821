import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminModeState {
  isAdminModeActive: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (active: boolean) => void;
}

export const useAdminModeStore = create<AdminModeState>()(
  persist(
    (set) => ({
      isAdminModeActive: false,
      toggleAdminMode: () => set((state) => ({ isAdminModeActive: !state.isAdminModeActive })),
      setAdminMode: (active) => set({ isAdminModeActive: active }),
    }),
    {
      name: 'admin-mode-storage',
    }
  )
);
