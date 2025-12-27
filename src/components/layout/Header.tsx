import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, User, ChevronDown, Search, Shield, Tag, Package, Pencil, Check, Sparkles, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useMenuConfigStore } from "@/stores/menuConfigStore";
import { useCollections } from "@/hooks/useCollections";
import { useState, useEffect } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PromoBanner } from "./PromoBanner";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Input } from "@/components/ui/input";
import { SearchModal } from "@/components/search/SearchModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { NewProductsPanel } from "@/components/admin/NewProductsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  onMobileFilterClick?: () => void;
}

export function Header({ onMobileFilterClick }: HeaderProps = {}) {
  const location = useLocation();
  const isProductsPage = location.pathname === '/products';
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { isAdminModeActive, toggleAdminMode } = useAdminModeStore();
  const { menuItems, collectionsLabel, updateMenuItem, updateCollectionsLabel } = useMenuConfigStore();
  const { collections: supabaseCollections } = useCollections();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  
  // States
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [newProductsPanelOpen, setNewProductsPanelOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  const startEditing = (id: string, currentValue: string) => {
    setEditingItem(id);
    setEditValue(currentValue);
  };

  const saveEdit = (type: 'menu' | 'collections-label', id?: string) => {
    if (type === 'menu' && id) {
      updateMenuItem(id, editValue);
    } else if (type === 'collections-label') {
      updateCollectionsLabel(editValue);
    }
    setEditingItem(null);
    setEditValue("");
    toast.success('Guardado');
  };
  
  // Use active Supabase collections, sorted by name
  const activeCollections = supabaseCollections
    .filter(c => c.is_active)
    .sort((a, b) => a.name.localeCompare(b.name));

  const showAdminControls = isAdmin && isAdminModeActive;

  const renderEditableText = (
    id: string,
    text: string,
    type: 'menu' | 'collections-label',
    className?: string
  ) => {
    if (showAdminControls && editingItem === id) {
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 w-24 text-xs px-1 py-0 bg-background/80 border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(type, id);
              if (e.key === 'Escape') setEditingItem(null);
            }}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              saveEdit(type, id);
            }}
            className="p-1 rounded hover:bg-primary/20"
          >
            <Check className="h-3 w-3 text-primary" />
          </button>
        </div>
      );
    }

    return (
      <span className={`flex items-center gap-1 ${className || ''}`}>
        {text}
        {showAdminControls && (
          <span
            role="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing(id, text);
            }}
            className="p-0.5 rounded hover:bg-primary/20 opacity-60 hover:opacity-100 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      {/* Promo Banner + Header fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <PromoBanner />
        <header className="glass bg-background/90 border-b border-border/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              
              {/* Left Group: Mobile Menu + Logo */}
              <div className="flex items-center gap-3 md:gap-0">
                {/* Left: Mobile Menu Trigger (visible on mobile only) */}
                <div className="flex md:hidden justify-start">
                    <motion.button
                    className="p-2 -ml-2 rounded-full active:bg-secondary transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    whileTap={{ scale: 0.9 }}
                    aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  >
                    <AnimatePresence mode="wait">
                      {mobileMenuOpen ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="h-6 w-6" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Menu className="h-6 w-6" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

                {/* Logo */}
                <div className="flex justify-center absolute left-0 right-0 pointer-events-none md:static md:pointer-events-auto md:justify-start">
                  <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity duration-300 pointer-events-auto">
                    <img 
                      src="/icono_asterohype_png.png" 
                      alt="AsteroHype Icon" 
                      className="h-8 w-8 md:h-10 md:w-10 object-contain"
                    />
                    <span className="text-lg md:text-2xl font-display uppercase italic tracking-wide text-foreground whitespace-nowrap">
                      ASTEROHYPE
                    </span>
                  </Link>
                </div>
              </div>

              {/* Center: Navigation (Desktop) - Adjusted position to right of logo but centered in available space */}
              <div className="hidden md:flex items-center gap-8 flex-1 justify-center ml-12">
                {menuItems.filter(item => item.id === 'products').map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                  >
                    {renderEditableText(item.id, item.label, 'menu')}
                  </Link>
                ))}
                
                {/* Collections Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    data-nav-trigger
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300 outline-none"
                    style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                  >
                    {renderEditableText('collections-label', collectionsLabel, 'collections-label')}
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="center" 
                    className="min-w-[180px] bg-popover border border-border shadow-lg rounded-lg p-1"
                  >
                    {activeCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/products?collection=${collection.slug}`}
                        className="text-sm text-muted-foreground hover:text-price-yellow transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {menuItems.filter(item => item.id === 'contact').map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                  >
                    {renderEditableText(item.id, item.label, 'menu')}
                  </Link>
                ))}
              </div>

              {/* Right: Actions (Mobile & Desktop) */}
              <div className="flex items-center justify-end gap-2 md:gap-3">
                {/* Mobile: Header Actions Slot - Only show Admin Toggle if Admin */}
                <div className="flex md:hidden items-center gap-1.5">
                   {/* Slot 1: Admin Quick Toggle (if admin) */}
                   {isAdmin && (
                    <button
                      onClick={() => {
                        toggleAdminMode();
                        toast.success(isAdminModeActive ? 'Modo Admin desactivado' : 'Modo Admin activado');
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                        isAdminModeActive 
                          ? 'bg-price-yellow text-black border-price-yellow shadow-[0_0_8px_rgba(255,215,0,0.6)]' 
                          : 'bg-transparent text-muted-foreground border-transparent'
                      }`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {/* NOTE: Cart and Search are moved to bottom bar, but we keep Cart here if needed? 
                      User said "no search in header", but maybe cart is okay? 
                      Actually, let's keep it minimal as requested. Only Admin Pencil if needed. 
                  */}
                </div>

                {/* Desktop Navigation & Full Actions */}
                {/* REMOVED: Old Navigation Location */}
                
                {/* Right side actions - DESKTOP ONLY WRAPPER (Hidden on mobile) */}
              <div className="hidden md:flex items-center gap-3">
                {/* Desktop: Search & Admin */}
                <div className={`${showAdminControls ? 'flex' : 'flex'} items-center gap-3`}>
                  {/* Search Icon - Opens Modal */}
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-card border border-border/50 hover:border-price-yellow/50 transition-all duration-300 group"
                  >
                    <Search className="h-4 w-4 md:h-5 md:w-5 text-price-yellow group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Admin Button Group */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {/* Dashboard Link */}
                      <Link 
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 h-12 rounded-2xl bg-card border border-border/50 hover:border-primary hover:bg-secondary/80 transition-all duration-300 group cursor-pointer"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline text-sm font-medium text-muted-foreground group-hover:text-primary">
                          Admin
                        </span>
                        <Check className="h-3 w-3 text-muted-foreground group-hover:text-primary ml-1" />
                      </Link>

                      {/* Visual Edit Mode Toggle */}
                      <button
                        onClick={() => {
                          toggleAdminMode();
                          toast.success(isAdminModeActive ? 'Edición visual desactivada' : 'Edición visual activada');
                        }}
                        className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 ${
                          isAdminModeActive 
                            ? 'bg-card text-foreground border-price-yellow shadow-[0_0_15px_rgba(255,215,0,0.4)]' 
                            : 'bg-card text-muted-foreground border-border/50 hover:text-price-yellow hover:border-price-yellow/50'
                        }`}
                        title={isAdminModeActive ? "Desactivar edición visual" : "Activar edición visual"}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* Theme Selector */}
                  <div className="hidden md:block">
                     <ThemeSelector />
                  </div>

                  {/* User Account */}
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="hidden md:flex items-center gap-2 px-4 py-2.5 h-12 rounded-2xl bg-card border border-border/50 hover:border-price-yellow/50 transition-all duration-300 group"
                    >
                      <User className="h-4 w-4 text-price-yellow group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline text-sm text-muted-foreground group-hover:text-foreground">Salir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="hidden md:flex items-center gap-2 px-4 py-2.5 h-12 rounded-2xl bg-card border border-border/50 hover:border-price-yellow/50 transition-all duration-300 group"
                    >
                      <User className="h-4 w-4 text-price-yellow group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline text-sm text-muted-foreground group-hover:text-foreground">Entrar</span>
                    </button>
                  )}

                  {/* Custom Cart Icon */}
                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative group hidden md:flex items-center gap-2 px-4 py-2.5 h-12 rounded-2xl bg-card border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                  >
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5 text-price-yellow group-hover:scale-110 transition-transform" />
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-price-yellow text-background text-[10px] flex items-center justify-center font-bold">
                          {totalItems}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Carrito
                    </span>
                  </button>
                </div>

                {/* Mobile menu button - REMOVED DUPLICATE */}
              </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <nav className="container mx-auto px-6 py-4 flex flex-col gap-2">
                {menuItems.filter(item => item.id === 'products').map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="text-base text-muted-foreground hover:text-price-yellow transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {renderEditableText(item.id, item.label, 'menu')}
                  </Link>
                ))}
                <div className="py-2">
                  <span className="text-sm text-muted-foreground/70 mb-2 block">
                    {renderEditableText('collections-label-mobile', collectionsLabel, 'collections-label')}
                  </span>
                  <div className="pl-3 flex flex-col gap-1">
                    {activeCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/products?collection=${collection.slug}`}
                        className="text-sm text-muted-foreground hover:text-price-yellow transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                </div>
                {menuItems.filter(item => item.id === 'contact').map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="text-base text-muted-foreground hover:text-price-yellow transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {renderEditableText(item.id, item.label, 'menu')}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
          </AnimatePresence>
        </header>
      </div>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <NewProductsPanel open={newProductsPanelOpen} onOpenChange={setNewProductsPanelOpen} />
      <CartDrawer />
      <MobileNavBar 
        onSearchClick={() => setSearchOpen(true)} 
        onFilterClick={onMobileFilterClick}
        showFilters={isProductsPage && !!onMobileFilterClick}
        onAuthClick={() => setAuthModalOpen(true)}
      />
    </>
  );
}