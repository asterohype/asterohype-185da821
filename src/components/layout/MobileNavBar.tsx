import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Grid3X3 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

interface MobileNavBarProps {
  onSearchClick: () => void;
  onFilterClick?: () => void;
  showFilters?: boolean;
}

export function MobileNavBar({ onSearchClick, onFilterClick, showFilters = false }: MobileNavBarProps) {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Filtros button - only on products page */}
      {showFilters && onFilterClick && (
        <div className="px-4 pb-2">
          <button
            onClick={onFilterClick}
            className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm shadow-lg"
          >
            Filtros
          </button>
        </div>
      )}
      
      {/* Main navigation bar */}
      <div className="mx-4 mb-4 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/30">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.action === 'link' && isActive(item.path);
            
            const buttonClasses = active
              ? "flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground transition-all duration-200"
              : "flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200";
            
            if (item.action === 'link') {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={buttonClasses}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            }
            
            if (item.action === 'search') {
              return (
                <button
                  key={item.id}
                  onClick={onSearchClick}
                  className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            if (item.action === 'cart') {
              return (
                <button
                  key={item.id}
                  onClick={() => setCartOpen(true)}
                  className="relative flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
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