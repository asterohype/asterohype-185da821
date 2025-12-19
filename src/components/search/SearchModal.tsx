import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";

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

    const filtered = allProducts.filter((p) => {
      const title = p.node.title?.toLowerCase() || "";
      const desc = p.node.description?.toLowerCase() || "";
      return title.includes(query.toLowerCase()) || desc.includes(query.toLowerCase());
    });

    setProducts(filtered.slice(0, 6));
  }, [query, allProducts]);

  const handleSelectProduct = (productId: string) => {
    const cleanId = productId.replace("gid://shopify/Product/", "");
    navigate(`/product/${cleanId}`);
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
      <DialogContent 
        className="sm:max-w-xl p-0 gap-0 bg-popover border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-4 h-12 text-lg bg-transparent placeholder:text-muted-foreground/60"
              style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : query.trim() === "" ? (
            <div className="py-12 text-center text-muted-foreground">
              Escribe para buscar productos...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron productos
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {products.map((product) => {
                const image = product.node.images?.edges?.[0]?.node;
                return (
                  <button
                    key={product.node.id}
                    onClick={() => handleSelectProduct(product.node.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {image && (
                      <img
                        src={image.url}
                        alt={image.altText || product.node.title}
                        className="w-14 h-14 rounded-lg object-cover bg-secondary"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {product.node.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.node.priceRange?.minVariantPrice?.amount
                          ? `${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}€`
                          : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
              
              {/* Ver todos los resultados */}
              <button
                onClick={handleSearchAll}
                className="w-full flex items-center justify-center gap-2 p-4 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Ver todos los resultados para "{query}"
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}