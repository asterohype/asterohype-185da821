import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Loader2, X, Check, Tag } from "lucide-react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductTags } from "@/hooks/useProductTags";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: overrides } = useProductOverrides();
  const { tags, getTagsForProduct, getProductsForTag } = useProductTags();

  useEffect(() => {
    async function loadProducts() {
      if (allProducts.length > 0) return;
      
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
    
    if (open) {
      loadProducts();
    }
  }, [open, allProducts.length]);

  const products = useMemo(() => {
    if (query.trim() === "") {
      return [];
    }

    const searchLower = query.toLowerCase();
    
    // First, check if search matches any tag/category name
    const matchingTags = tags.filter(t => 
      t.name.toLowerCase().includes(searchLower) || 
      t.slug.toLowerCase().includes(searchLower)
    );
    
    // Get product IDs that have matching tags
    const taggedProductIds = new Set<string>();
    matchingTags.forEach(tag => {
      const ids = getProductsForTag(tag.slug);
      ids.forEach(id => taggedProductIds.add(id));
    });

    const filtered = allProducts.filter((p) => {
      // Check if product is in a matching tag/category
      if (taggedProductIds.has(p.node.id)) {
        return true;
      }
      
      const title = p.node.title?.toLowerCase() || "";
      const desc = p.node.description?.toLowerCase() || "";
      
      // Also search in overrides (custom title, subtitle)
      const override = overrides?.find(o => o.shopify_product_id === p.node.id);
      const overrideTitle = override?.title?.toLowerCase() || "";
      const overrideSubtitle = override?.subtitle?.toLowerCase() || "";
      
      // Check product's assigned tags
      const productTags = getTagsForProduct(p.node.id);
      const hasMatchingTag = productTags.some(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.toLowerCase().includes(searchLower)
      );
      
      return title.includes(searchLower) || 
             desc.includes(searchLower) ||
             overrideTitle.includes(searchLower) ||
             overrideSubtitle.includes(searchLower) ||
             hasMatchingTag;
    });

    return filtered.slice(0, 12);
  }, [query, allProducts, overrides, tags, getTagsForProduct, getProductsForTag]);

  // Toggle selection - only one at a time
  const handleToggleSelect = (productId: string) => {
    setSelectedProductId(prev => prev === productId ? null : productId);
  };

  const handleSelectProduct = (productHandle: string) => {
    navigate(`/product/${productHandle}`);
    onOpenChange(false);
    setQuery("");
    setSelectedProductId(null);
  };

  const handleSearchAll = () => {
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      onOpenChange(false);
      setQuery("");
      setSelectedProductId(null);
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

  // Get matching tag names for display
  const getMatchingTagNames = (searchLower: string) => {
    return tags.filter(t => 
      t.name.toLowerCase().includes(searchLower) || 
      t.slug.toLowerCase().includes(searchLower)
    ).slice(0, 3);
  };

  const matchingTagsDisplay = query.trim() ? getMatchingTagNames(query.toLowerCase()) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 translate-y-0 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[10%] data-[state=open]:slide-in-from-top-[10%]"
      >
        <DialogTitle className="sr-only">Buscar productos</DialogTitle>
        <DialogDescription className="sr-only">Buscador global de productos y categorías</DialogDescription>
        
        {/* Search Input Area */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Buscar productos, categorías, etiquetas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-10 text-base bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            autoFocus
          />
        </div>

        {/* Matching tags indicator */}
        {matchingTagsDisplay.length > 0 && (
          <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Etiquetas:</span>
            {matchingTagsDisplay.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  navigate(`/products?tag=${tag.slug}`);
                  onOpenChange(false);
                  setQuery("");
                }}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : query.trim() === "" ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Escribe para buscar productos...
              </motion.div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron productos
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              <AnimatePresence>
                {products.map((product) => {
                  const image = product.node.images?.edges?.[0]?.node;
                  const override = overrides?.find(o => o.shopify_product_id === product.node.id);
                  const displayTitle = override?.title || product.node.title;
                  const displaySubtitle = override?.subtitle;
                  const isSelected = selectedProductId === product.node.id;
                  const productTags = getTagsForProduct(product.node.id);
                  
                  return (
                    <motion.div
                      key={product.node.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className={`w-full flex items-center gap-3 p-3 transition-colors text-left border-b border-border/30 last:border-b-0 ${
                        isSelected 
                          ? 'bg-primary/10 border-l-2 border-l-primary' 
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      {/* Selection toggle */}
                      <button
                        onClick={() => handleToggleSelect(product.node.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-border/50 hover:border-primary/50'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                      
                      <button
                        onClick={() => handleSelectProduct(product.node.handle)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        {image && (
                          <img
                            src={image.url}
                            alt={image.altText || displayTitle}
                            className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-foreground text-sm truncate">
                            {displayTitle}
                          </p>
                          {displaySubtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {displaySubtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-price-yellow font-semibold">
                              {product.node.priceRange?.minVariantPrice?.amount
                                ? `${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}€`
                                : ""}
                            </p>
                            {productTags.length > 0 && (
                              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                {productTags[0].name}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* View all results */}
              <motion.button
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 }
                }}
                onClick={handleSearchAll}
                className="w-full flex items-center justify-center gap-2 p-4 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Ver todos los resultados
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
