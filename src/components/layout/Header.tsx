import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User, ChevronDown, Search, Shield, Tag, Package, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useMenuConfigStore } from "@/stores/menuConfigStore";
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

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { isAdminModeActive, toggleAdminMode } = useAdminModeStore();
  const { menuItems, collections, collectionsLabel, updateMenuItem, updateCollectionsLabel, updateCollection } = useMenuConfigStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { isAdmin } = useAdmin();
  
  // States
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const startEditing = (id: string, currentValue: string) => {
    setEditingItem(id);
    setEditValue(currentValue);
  };

  const saveEdit = (type: 'menu' | 'collections-label' | 'collection', id?: string) => {
    if (type === 'menu' && id) {
      updateMenuItem(id, editValue);
    } else if (type === 'collections-label') {
      updateCollectionsLabel(editValue);
    } else if (type === 'collection' && id) {
      updateCollection(id, editValue);
    }
    setEditingItem(null);
    setEditValue("");
    toast.success('Guardado');
  };

  const renderEditableText = (
    id: string,
    text: string,
    type: 'menu' | 'collections-label' | 'collection',
    className?: string
  ) => {
    if (isAdminModeActive && editingItem === id) {
      return (
        <div className="flex items-center gap-1">
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
            onClick={() => saveEdit(type, id)}
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
        {isAdminModeActive && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing(id, text);
            }}
            className="p-0.5 rounded hover:bg-primary/20 opacity-60 hover:opacity-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  };

  return (
    <>
      {/* Promo Banner + Header fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PromoBanner />
        <header className="glass bg-background/90 border-b border-border/30">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link to="/" className="text-xl md:text-2xl font-display uppercase italic tracking-wide text-foreground hover:text-price-yellow transition-colors duration-300">
                AsteroHype
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
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
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300 outline-none">
                    {renderEditableText('collections-label', collectionsLabel, 'collections-label')}
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="center" 
                    className="min-w-[180px] bg-popover border border-border shadow-lg rounded-lg p-1"
                  >
                    {collections.map((collection) => (
                      <DropdownMenuItem key={collection.id} asChild>
                        <Link 
                          to={`/products?search=${collection.query}`}
                          className="cursor-pointer hover:text-price-yellow px-3 py-2 rounded-md"
                        >
                          {renderEditableText(collection.id, collection.name, 'collection')}
                        </Link>
                      </DropdownMenuItem>
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
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Search Icon - Opens Modal */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                >
                  <Search className="h-4 w-4 text-price-yellow" />
                </button>

                {/* Admin Button with Hover Menu */}
                {isAdmin && (
                  <HoverCard openDelay={100} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <button
                        data-admin-button
                        data-active={isAdminModeActive}
                        onClick={() => {
                          toggleAdminMode();
                          toast.success(isAdminModeActive ? 'Modo Admin desactivado' : 'Modo Admin activado');
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm font-medium">
                          Admin {isAdminModeActive && '✓'}
                        </span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      align="center" 
                      className="w-48 p-2 bg-popover border border-border shadow-lg rounded-xl"
                      sideOffset={8}
                    >
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-price-yellow hover:bg-secondary/50 transition-all"
                      >
                        <Tag className="h-4 w-4" />
                        Gestionar Etiquetas
                      </Link>
                      <Link
                        to="/admin/collections"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-price-yellow hover:bg-secondary/50 transition-all"
                      >
                        <Package className="h-4 w-4" />
                        Colecciones
                      </Link>
                    </HoverCardContent>
                  </HoverCard>
                )}

                {/* Theme Selector */}
                <ThemeSelector />

                {/* User Account */}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                  >
                    <User className="h-4 w-4 text-price-yellow" />
                    <span className="hidden sm:inline text-sm text-muted-foreground">Salir</span>
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                  >
                    <User className="h-4 w-4 text-price-yellow" />
                    <span className="hidden sm:inline text-sm text-muted-foreground">Entrar</span>
                  </Link>
                )}

                {/* Custom Cart Icon */}
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative group flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                >
                  <div className="relative">
                    <ShoppingBag className="h-5 w-5 text-price-yellow" />
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

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
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
                    {collections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/products?search=${collection.query}`}
                        className="text-sm text-muted-foreground hover:text-price-yellow transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {renderEditableText(`${collection.id}-mobile`, collection.name, 'collection')}
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
            </div>
          )}
        </header>
      </div>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <CartDrawer />
    </>
  );
}