import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MenuItem {
  id: string;
  label: string;
  link: string;
}

interface Collection {
  id: string;
  name: string;
  query: string;
}

interface Category {
  id: string;
  slug: string;
  label: string;
  customImage?: string;
}

interface MenuConfigState {
  menuItems: MenuItem[];
  collections: Collection[];
  collectionsLabel: string;
  categories: Category[];
  updateMenuItem: (id: string, label: string) => void;
  updateCollectionsLabel: (label: string) => void;
  updateCollection: (id: string, name: string) => void;
  updateCategory: (id: string, label: string) => void;
  updateCategoryImage: (id: string, imageUrl: string) => void;
  addCategory: (slug: string, label: string) => void;
  removeCategory: (id: string) => void;
  clearCategoryImage: (id: string) => void;
}

export const useMenuConfigStore = create<MenuConfigState>()(
  persist(
    (set) => ({
      menuItems: [
        { id: 'products', label: 'Productos', link: '/products' },
        { id: 'contact', label: 'Contacto', link: '/contact' },
      ],
      collectionsLabel: 'Colecciones',
      collections: [],
      categories: [],
      updateMenuItem: (id, label) =>
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === id ? { ...item, label } : item
          ),
        })),
      updateCollectionsLabel: (label) =>
        set({ collectionsLabel: label }),
      updateCollection: (id, name) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id ? { ...col, name } : col
          ),
        })),
      updateCategory: (id, label) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, label } : cat
          ),
        })),
      updateCategoryImage: (id, imageUrl) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, customImage: imageUrl } : cat
          ),
        })),
      addCategory: (slug, label) =>
        set((state) => ({
          categories: [...state.categories, { id: slug, slug, label }],
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),
      clearCategoryImage: (id) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, customImage: undefined } : cat
          ),
        })),
    }),
    {
      name: 'menu-config-storage',
    }
  )
);
