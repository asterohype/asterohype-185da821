import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Grid3X3, ChevronUp, ChevronDown, Heart, Sparkles, User, LucideIcon } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { ThemeStyle, useThemeStore } from "@/stores/themeStore";
import { useCallback, useMemo, useState } from "react";

interface MobileNavBarProps {
  onSearchClick: () => void;
  onFilterClick?: () => void;
  showFilters?: boolean;
  onAuthClick?: () => void;
  onThemeClick?: () => void;
}

type NavAction = 'link' | 'search' | 'cart' | 'theme' | 'auth';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  action: NavAction;
  badge?: number;
  featured?: boolean;
}

function applyThemeToDom(themeId: ThemeStyle) {
  const root = document.documentElement;
  root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
  root.classList.add(`theme-${themeId}`);
}

export function MobileNavBar({ onSearchClick, onFilterClick, showFilters = false, onAuthClick, onThemeClick }: MobileNavBarProps) {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const { theme, setTheme } = useThemeStore();
  const [currentPage, setCurrentPage] = useState(0);
  
  const isActive = (path: string) => location.pathname === path;

  const handleThemeToggle = useCallback(() => {
    const next: ThemeStyle = theme === 'default' ? 'hype' : theme === 'hype' ? 'cute' : 'default';
    applyThemeToDom(next);
    setTheme(next);
  }, [setTheme, theme]);

  const themeClick = onThemeClick ?? handleThemeToggle;

  // Page 1: Main navigation
  const page1Items: NavItem[] = useMemo(() => [
    { id: 'home', icon: Home, label: 'Inicio', path: '/', action: 'link' },
    { id: 'products', icon: Grid3X3, label: 'Productos', path: '/products', action: 'link', featured: true },
    { id: 'search', icon: Search, label: 'Buscar', path: '', action: 'search' },
    { id: 'cart', icon: ShoppingBag, label: 'Carrito', path: '', action: 'cart' },
  ] as NavItem[], []);

  // Page 2: Secondary actions
  const page2Items: NavItem[] = useMemo(() => [
    { id: 'favorites', icon: Heart, label: 'Favoritos', path: '/favorites', action: 'link', badge: favoritesCount },
    { id: 'theme', icon: Sparkles, label: 'Tema', path: '', action: 'theme' },
    { id: 'account', icon: User, label: 'Cuenta', path: '', action: 'auth' },
  ], [favoritesCount]);

  const currentItems = currentPage === 0 ? page1Items : page2Items;

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = item.action === 'link' && isActive(item.path);
    
    const baseClasses = "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200";
    const featuredClasses = item.featured 
      ? "border-2 border-primary bg-primary/10 text-primary"
      : "";
    
    const buttonClasses = active
      ? `${baseClasses} bg-primary text-primary-foreground`
      : `${baseClasses} text-muted-foreground hover:text-foreground ${featuredClasses}`;
    
    if (item.action === 'link') {
      return (
        <Link
          key={item.id}
          to={item.path}
          className={buttonClasses}
        >
          <div className="relative">
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      );
    }
    
    if (item.action === 'search') {
      return (
        <button
          key={item.id}
          onClick={onSearchClick}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
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
          className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
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

    if (item.action === 'theme') {
      return (
        <button
          key={item.id}
          onClick={themeClick}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      );
    }

    if (item.action === 'auth') {
      return (
        <button
          key={item.id}
          onClick={onAuthClick}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      );
    }
    
    return null;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none">
      {/* Filtros button - only on products page */}
      {showFilters && onFilterClick && (
        <div className="px-4 pb-2 pointer-events-auto">
          <button
            onClick={onFilterClick}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-full font-semibold text-sm shadow-lg"
          >
            Filtros
          </button>
        </div>
      )}
      
      {/* Main navigation bar */}
      <div className="mx-3 mb-3 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg shadow-black/20 pointer-events-auto">
        <div className="flex items-center justify-around py-2.5 px-1">
          {/* Page toggle button */}
          <button
            onClick={() => setCurrentPage(currentPage === 0 ? 1 : 0)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            {currentPage === 0 ? (
              <ChevronUp className="h-5 w-5" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            )}
            <span className="text-[10px] font-medium">{currentPage === 0 ? 'Más' : 'Volver'}</span>
          </button>

          {/* Current page items */}
          {currentItems.map(renderNavItem)}
        </div>
      </div>
    </nav>
  );
}