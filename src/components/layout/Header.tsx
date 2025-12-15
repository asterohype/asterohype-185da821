import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Productos", href: "/products" },
    { name: "Colecciones", href: "/products" },
    { name: "Contacto", href: "/contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="text-xl md:text-2xl font-display uppercase italic tracking-wide text-foreground hover:text-price-yellow transition-colors duration-300">
              AsteroHype
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
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
            <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-base text-muted-foreground hover:text-price-yellow transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
