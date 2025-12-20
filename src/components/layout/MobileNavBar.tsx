import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Grid3X3 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

interface MobileNavBarProps {
  onSearchClick: () => void;
}

export function MobileNavBar({ onSearchClick }: MobileNavBarProps) {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio', path: '/', action: 'link' as const },
    { id: 'products', icon: Grid3X3, label: 'Productos', path: '/products', action: 'link' as const },
    { id: 'search', icon: Search, label: 'Buscar', path: '', action: 'search' as const },
    { id: 'cart', icon: ShoppingBag, label: 'Carrito', path: '', action: 'cart' as const },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/20 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.action === 'link' && isActive(item.path);
            
            if (item.action === 'link') {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                    active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            }
            
            if (item.action === 'search') {
              return (
                <button
                  key={item.id}
                  onClick={onSearchClick}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            if (item.action === 'cart') {
              return (
                <button
                  key={item.id}
                  onClick={() => setCartOpen(true)}
                  className="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            return null;
          })}
        </div>
      </div>
    </nav>
  );
}
