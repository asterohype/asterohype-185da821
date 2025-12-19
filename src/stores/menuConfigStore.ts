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

interface MenuConfigState {
  menuItems: MenuItem[];
  collections: Collection[];
  collectionsLabel: string;
  updateMenuItem: (id: string, label: string) => void;
  updateCollectionsLabel: (label: string) => void;
  updateCollection: (id: string, name: string) => void;
}

export const useMenuConfigStore = create<MenuConfigState>()(
  persist(
    (set) => ({
      menuItems: [
        { id: 'products', label: 'Productos', link: '/products' },
        { id: 'contact', label: 'Contacto', link: '/contact' },
      ],
      collectionsLabel: 'Colecciones',
      collections: [
        { id: 'fundas', name: 'Fundas', query: 'case' },
        { id: 'mesas', name: 'Mesas', query: 'desk' },
        { id: 'muebles', name: 'Muebles', query: 'furniture' },
        { id: 'tecnologia', name: 'Tecnología', query: 'tech' },
        { id: 'accesorios', name: 'Accesorios', query: 'accesorios' },
        { id: 'ropa', name: 'Ropa', query: 'clothing' },
      ],
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
    }),
    {
      name: 'menu-config-storage',
    }
  )
);
