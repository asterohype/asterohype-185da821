import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Loader2, X } from "lucide-react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const { data: overrides } = useProductOverrides();

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await fetchProducts(250);
        setAllProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    if (open && allProducts.length === 0) {
      loadProducts();
    }
  }, [open, allProducts.length]);

  useEffect(() => {
    if (query.trim() === "") {
      setProducts([]);
      return;
    }

    const searchLower = query.toLowerCase();
    
    const filtered = allProducts.filter((p) => {
      const title = p.node.title?.toLowerCase() || "";
      const desc = p.node.description?.toLowerCase() || "";
      
      // Also search in overrides (custom title, subtitle)
      const override = overrides?.find(o => o.shopify_product_id === p.node.id);
      const overrideTitle = override?.title?.toLowerCase() || "";
      const overrideSubtitle = override?.subtitle?.toLowerCase() || "";
      
      return title.includes(searchLower) || 
             desc.includes(searchLower) ||
             overrideTitle.includes(searchLower) ||
             overrideSubtitle.includes(searchLower);
    });

    setProducts(filtered.slice(0, 6));
  }, [query, allProducts, overrides]);

  const handleSelectProduct = (productHandle: string) => {
    navigate(`/product/${productHandle}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleSearchAll = () => {
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      onOpenChange(false);
      setQuery("");
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && query.trim()) {
        handleSearchAll();
      }
    },
    [query]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 duration-200"
        >
          {/* Search Input Area */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-10 text-base bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
              autoFocus
            />
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : query.trim() === "" ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Escribe para buscar productos...
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron productos
              </div>
            ) : (
              <div>
                {products.map((product) => {
                  const image = product.node.images?.edges?.[0]?.node;
                  const override = overrides?.find(o => o.shopify_product_id === product.node.id);
                  const displayTitle = override?.title || product.node.title;
                  const displaySubtitle = override?.subtitle;
                  
                  return (
                    <button
                      key={product.node.id}
                      onClick={() => handleSelectProduct(product.node.handle)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-b-0"
                    >
                      {image && (
                        <img
                          src={image.url}
                          alt={image.altText || displayTitle}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {displayTitle}
                        </p>
                        {displaySubtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {displaySubtitle}
                          </p>
                        )}
                        <p className="text-xs text-price-yellow">
                          {product.node.priceRange?.minVariantPrice?.amount
                            ? `${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}€`
                            : ""}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
                
                {/* View all results */}
                <button
                  onClick={handleSearchAll}
                  className="w-full flex items-center justify-center gap-2 p-4 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  Ver todos los resultados
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
