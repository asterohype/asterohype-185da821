import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, ShoppingBag, Grid3X3, Heart, Sparkles, User, LucideIcon, Palette, ArrowRightLeft, LayoutGrid, Shield } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { ThemeStyle, useThemeStore } from "@/stores/themeStore";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileNavBarProps {
  onSearchClick: () => void;
  onFilterClick?: () => void;
  showFilters?: boolean;
  onAuthClick?: () => void;
  onThemeClick?: () => void;
}

type NavAction = 'link' | 'search' | 'cart' | 'theme' | 'auth' | 'more';

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

  // Update favicon based on theme - DISABLED per user request to keep single icon
  /*
  const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (favicon) {
    if (themeId === 'default') {
       favicon.href = '/favicon.png'; // Original AsteroHype icon
    } else {
       // For 'hype' (Clean) and 'cute' (Cute), use the new V2 icon
       favicon.href = '/favicon-v2.png';
    }
  }
  */
}

import { createPortal } from "react-dom";

export function MobileNavBar({ onSearchClick, onFilterClick, showFilters = false, onAuthClick, onThemeClick }: MobileNavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // ... (rest of the hooks)
  const { user } = useAuth();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const { theme, setTheme } = useThemeStore();
  const [currentSlot, setCurrentSlot] = useState(0); 
  
  const isActive = (path: string) => location.pathname === path;

  const handleThemeToggle = useCallback(() => {
    const next: ThemeStyle = theme === 'default' ? 'hype' : theme === 'hype' ? 'cute' : 'default';
    applyThemeToDom(next);
    setTheme(next);
  }, [setTheme, theme]);

  const themeClick = onThemeClick ?? handleThemeToggle;

  // Define all available items
  const allItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    
    // --- RANURA 1 (First 4 items) ---
    // 1. Inicio
    items.push({ id: 'home', icon: Home, label: 'Inicio', path: '/', action: 'link' });
    
    // 2. Tienda
    items.push({ id: 'products', icon: Grid3X3, label: 'Tienda', path: '/products', action: 'link' });

    // 3. Buscar
    items.push({ id: 'search', icon: Search, label: 'Buscar', path: '', action: 'search' });

    // 4. Carrito
    items.push({ id: 'cart', icon: ShoppingBag, label: 'Carrito', path: '', action: 'cart', badge: totalItems });

    // --- RANURA 2 (Next items) ---
    // 1. Admin (if valid)
    // Make Admin button available for logged-in users for now (or strictly admin)
    // User requested: "Where is the Admin button?"
    const isAdminOverride = localStorage.getItem('asterohype_admin_override') === 'true';
    const isUserAdmin = user?.email === 'admin@asterohype.com';
    const isDev = true; // Temporary: enable for all logged in users to ensure they can find it

    if (user && (isUserAdmin || isAdminOverride || isDev)) {
       items.push({ id: 'admin', icon: Shield, label: 'Admin', path: '/admin', action: 'link' });
    }

    // 2. Favoritos
    items.push({ id: 'favorites', icon: Heart, label: 'Favoritos', path: '/favorites', action: 'link', badge: favoritesCount });

    // 3. Estilos
    items.push({ id: 'styles', icon: Palette, label: 'Estilos', path: '', action: 'theme' });

    // 4. Perfil (Explicitly in Slot 2 as requested)
    items.push({ id: 'account', icon: User, label: user ? 'Perfil' : 'Entrar', path: user ? '/auth' : '/auth', action: 'auth' });

    return items;
  }, [user, totalItems, favoritesCount]);

  // Organize items into slots (pages)
  // We want to show 4 items + 1 switch button per slot (User request: Slot 1 has 4 items + More, Slot 2 has rest)
  const ITEMS_PER_SLOT = 4;
  const totalSlots = Math.ceil(allItems.length / ITEMS_PER_SLOT);

  // Get current items for the view
  const currentItems = useMemo(() => {
    const start = currentSlot * ITEMS_PER_SLOT;
    const items = allItems.slice(start, start + ITEMS_PER_SLOT);
    
    // Add the "Next Slot" button if we have multiple slots
    if (totalSlots > 1) {
       items.push({
        id: 'more',
        icon: LayoutGrid, // Icon for changing slots
        label: 'Más',
        path: '',
        action: 'more'
      });
    }
    
    return items;
  }, [allItems, currentSlot, totalSlots]);

  const handleNextSlot = () => {
    setCurrentSlot((prev) => (prev + 1) % totalSlots);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = item.action === 'link' && isActive(item.path);
    const isShop = item.id === 'products';
    
    // Updated styling for rounded buttons with animation
    // Increased opacity/visibility for inactive items as requested
    const buttonBaseClass = cn(
      "flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 relative group select-none touch-manipulation",
      active ? "bg-primary/10" : "hover:bg-secondary/50 bg-transparent opacity-100", // Ensure opacity is 100
      isShop && !active && "bg-price-yellow/10 border border-price-yellow/30 shadow-[0_0_10px_rgba(255,215,0,0.1)]" // Highlight shop button
    );
    
    // Icon styles - improved contrast
    const iconClass = cn(
      "h-6 w-6 transition-all duration-300",
      active ? "text-primary scale-110" : "text-foreground group-hover:scale-105", // Removed opacity/dimming
      isShop && !active && "text-price-yellow scale-105" // Highlight shop icon
    );

    const content = (
      <>
        <div className="relative">
          <Icon className={iconClass} strokeWidth={active ? 2.5 : 2} />
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold animate-in zoom-in border-2 border-background">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-medium transition-colors duration-300 mt-1",
          active ? "text-primary" : "text-foreground" // Removed opacity/dimming
        )}>
          {item.label}
        </span>
      </>
    );
    
    if (item.action === 'link') {
      return (
        <Link
          key={item.id}
          to={item.path}
          className="flex-1 min-w-0"
        >
          <motion.div
            className={buttonBaseClass}
            whileTap={{ scale: 0.9 }}
          >
            {content}
          </motion.div>
        </Link>
      );
    }
    
    const handleClick = () => {
      if (item.action === 'search') onSearchClick();
      if (item.action === 'cart') setCartOpen(true);
      if (item.action === 'auth') {
        if (user) {
          // Navigate to Profile page
          navigate('/profile');
        } else {
          onAuthClick?.();
        }
      }
      if (item.action === 'theme') themeClick();
      if (item.action === 'more') handleNextSlot();
    };

    return (
      <div key={item.id} className="flex-1 min-w-0">
        <motion.button
          onClick={handleClick}
          className={buttonBaseClass}
          whileTap={{ scale: 0.9 }}
        >
          {content}
        </motion.button>
      </div>
    );
  };

  // Render directly to ensure position fixed works relative to viewport (unless parent has transform)
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{ position: 'fixed', bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Filtros button - only on products page */}
      {showFilters && onFilterClick && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-auto">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFilterClick}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold text-sm shadow-lg transition-colors"
          >
            <Grid3X3 className="w-4 h-4" />
            Filtrar Productos
          </motion.button>
        </div>
      )}
      
      {/* Main navigation bar */}
      <div className="flex items-center justify-between px-2 py-2 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
           {/* Wrap items in a motion div for slot transition */}
           <motion.div 
             key={currentSlot}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.2 }}
             className="flex w-full items-center justify-between gap-1"
           >
             {currentItems.map(renderNavItem)}
           </motion.div>
        </AnimatePresence>
      </div>
    </nav>
  );
}