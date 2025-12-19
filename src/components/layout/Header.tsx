import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User, ChevronDown, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
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
import { PromoBanner } from "./PromoBanner";
import { useAdmin } from "@/hooks/useAdmin";

const COLLECTIONS = [
  { name: "Fundas", query: "case" },
  { name: "Mesas", query: "desk" },
  { name: "Muebles", query: "furniture" },
  { name: "Tecnología", query: "tech" },
  { name: "Accesorios", query: "accesorios" },
  { name: "Ropa", query: "clothing" },
];

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { isAdmin } = useAdmin();

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

  return (
    <>
      {/* Promo Banner + Header fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PromoBanner />
        <header className="glass">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link to="/" className="text-xl md:text-2xl font-display uppercase italic tracking-wide text-foreground hover:text-price-yellow transition-colors duration-300">
                AsteroHype
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <Link
                  to="/products"
                  className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                >
                  Productos
                </Link>
                
                {/* Collections Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300 outline-none">
                    Colecciones
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-card border-border/50 min-w-[160px]">
                    {COLLECTIONS.map((collection) => (
                      <DropdownMenuItem key={collection.name} asChild>
                        <Link 
                          to={`/products?search=${collection.query}`}
                          className="cursor-pointer hover:text-price-yellow"
                        >
                          {collection.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                >
                  Contacto
                </Link>
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Search Icon */}
                <Link
                  to="/products"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-price-yellow/50 transition-all duration-300"
                >
                  <Search className="h-4 w-4 text-price-yellow" />
                </Link>

                {/* Admin Link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-price-yellow/10 hover:bg-price-yellow/20 border border-price-yellow/30 hover:border-price-yellow/50 transition-all duration-300"
                  >
                    <Shield className="h-4 w-4 text-price-yellow" />
                    <span className="hidden sm:inline text-sm text-price-yellow">Admin</span>
                  </Link>
                )}

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
                <Link
                  to="/products"
                  className="text-base text-muted-foreground hover:text-price-yellow transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Productos
                </Link>
                <div className="py-2">
                  <span className="text-sm text-muted-foreground/70 mb-2 block">Colecciones</span>
                  <div className="pl-3 flex flex-col gap-1">
                    {COLLECTIONS.map((collection) => (
                      <Link
                        key={collection.name}
                        to={`/products?search=${collection.query}`}
                        className="text-sm text-muted-foreground hover:text-price-yellow transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="text-base text-muted-foreground hover:text-price-yellow transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contacto
                </Link>
              </nav>
            </div>
          )}
        </header>
      </div>

      <CartDrawer />
    </>
  );
}