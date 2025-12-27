import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductTags, ProductTag } from "@/hooks/useProductTags";
import { useCollections } from "@/hooks/useCollections";
import { Loader2, Search, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GROUP_ORDER = [
  'General', 'Abrigos', 'Accesorios', 'Belleza', 'Calzado', 'Cocina', 
  'Decoración', 'Deporte', 'Electrónica', 'Fundas', 'Gadgets', 'Hogar', 
  'Hombre', 'Mujer', 'niños', 'Ropa', 'Tecnología', 'Zapatos', 
  'Ropa Detallado', 'Estilos', 'Destacados'
];
const PRODUCTS_PER_PAGE = 40;

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tagsByGroup: Record<string, ProductTag[]>;
  openSections: Record<string, boolean>;
  setOpenSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedTags: string[];
  toggleTag: (slug: string) => void;
}

// 1. Desktop Filter Sidebar (Vertical, Collapsible) - Restored
const DesktopFilterSidebar = ({
  searchQuery,
  setSearchQuery,
  tagsByGroup,
  openSections,
  setOpenSections,
  selectedTags,
  toggleTag
}: FilterSidebarProps) => {
  // Local state for input to prevent focus loss and allow debounce
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local state with prop when prop changes (e.g. from URL)
  useEffect(() => {
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  // Debounce update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-card border-border/50 focus:border-price-yellow rounded-lg transition-all focus:ring-2 focus:ring-price-yellow/20"
          />
        </div>
      </div>

      {/* Tag Groups */}
      <div className="space-y-1">
      {GROUP_ORDER.map((groupName) => {
        const groupTags = tagsByGroup[groupName] || [];
        if (groupTags.length === 0) return null;
        
        return (
          <Collapsible 
            key={groupName}
            open={openSections[groupName]} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [groupName]: open }))}
          >
            <CollapsibleTrigger 
              data-filter-trigger
              className="flex items-center justify-between w-full py-3 px-2 text-left rounded-lg hover:bg-secondary/50 transition-colors group"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
              <span className="font-semibold text-foreground group-hover:text-price-yellow transition-colors">{groupName}</span>
              <motion.div
                animate={{ rotate: openSections[groupName] ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-1 pb-4 px-2"
              >
                <div className="flex flex-wrap gap-2">
                  {groupTags.map((tag, idx) => {
                    const isSelected = selectedTags.includes(tag.slug);
                    return (
                      <motion.button
                        key={tag.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => toggleTag(tag.slug)}
                        className={`
                          text-xs px-3 py-1.5 rounded-full transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-price-yellow text-background border-price-yellow font-bold shadow-md transform scale-105' 
                            : 'bg-secondary/30 text-muted-foreground border-transparent hover:border-price-yellow/50 hover:text-foreground'
                          }
                        `}
                      >
                        {tag.name}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      </div>
    </div>
  );
};

// 2. Mobile Filter Bar (Horizontal, Sticky) - New
const MobileFilterBar = ({
  searchQuery,
  setSearchQuery,
  tagsByGroup,
  selectedTags,
  toggleTag
}: FilterSidebarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-card border border-border/50 rounded-xl shadow-sm">
      {/* Search - Inline */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border/50 h-9"
        />
      </div>

      {/* Horizontal Groups */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
        {GROUP_ORDER.map((groupName) => {
          const groupTags = tagsByGroup[groupName] || [];
          if (groupTags.length === 0) return null;

          const activeTagsCount = groupTags.filter(t => selectedTags.includes(t.slug)).length;

          return (
            <DropdownMenu key={groupName}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={activeTagsCount > 0 ? "secondary" : "ghost"} 
                  size="sm"
                  className={`flex-shrink-0 h-9 border ${activeTagsCount > 0 ? 'border-price-yellow text-price-yellow' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {groupName}
                  {activeTagsCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-price-yellow text-black text-[10px]">
                      {activeTagsCount}
                    </Badge>
                  )}
                  <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>{groupName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="flex flex-wrap gap-1 p-2">
                  {groupTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.slug);
                    return (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleTag(tag.slug);
                        }}
                        className={`
                          text-xs px-2 py-1 rounded-md border transition-all
                          ${isSelected 
                            ? 'bg-price-yellow text-black border-price-yellow font-medium' 
                            : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground'
                          }
                        `}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </div>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tag = searchParams.get("tag");
    return tag ? [tag] : [];
  });

  // Orden mezclado persistente (se mezcla una vez y se queda así)
  const [mixedOrderIds, setMixedOrderIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("products_mixed_order_v1");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'General': true,
    'Ropa Detallado': false,
    'Estilos': false,
    'Destacados': false,
    'Hombre': false,
    'Mujer': false,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { tags, getTagsByGroup, getTagsForProduct, loading: tagsLoading } = useProductTags();
  const { collections, getProductsForCollection } = useCollections();

  // Function to mix products deterministically but with better shuffling
  const mixOnce = (items: ShopifyProduct[]) => {
    const shuffle = <T,>(arr: T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const byType: Record<string, ShopifyProduct[]> = {};
    items.forEach((p) => {
      const type = p.node.productType || "otros";
      (byType[type] ??= []).push(p);
    });

    const types = shuffle(Object.keys(byType));
    const lists = Object.fromEntries(types.map((t) => [t, shuffle(byType[t])])) as Record<string, ShopifyProduct[]>;

    const mixed: string[] = [];
    let remaining = items.length;
    let idx = 0;
    while (remaining > 0) {
      const type = types[idx % types.length];
      const item = lists[type]?.shift();
      if (item) {
        mixed.push(item.node.id);
        remaining--;
      }
      idx++;
    }
    return mixed;
  };

  // Load products handling both search and browse modes
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        if (searchQuery) {
          // SEARCH MODE: Fetch specific results from Shopify
          // This is much faster than loading everything and filtering client-side
          const searchResults = await fetchProducts(250, searchQuery);
          if (cancelled) return;
          setProducts(searchResults);
        } else {
          // BROWSE MODE: Progressive loading
          // 1. Initial batch (fast LCP)
          const firstBatch = await fetchProducts(40);
          if (cancelled) return;
          setProducts(firstBatch);
          
          // Generate mix order if needed
          setMixedOrderIds((prev) => {
            if (prev.length > 0) return prev;
            const mixed = mixOnce(firstBatch);
            try {
              localStorage.setItem("products_mixed_order_v1", JSON.stringify(mixed));
            } catch {}
            return mixed;
          });

          // 2. Secondary batch (background)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (cancelled) return;
          const secondBatch = await fetchProducts(150);
          if (cancelled) return;
          setProducts(secondBatch);

          // 3. Full catalog (background)
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (cancelled) return;
          const fullBatch = await fetchProducts(2000); // Up to 2000 products
          if (cancelled) return;
          setProducts(fullBatch);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        if (!cancelled) {
           toast.error("Error al cargar productos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Debounce the effect slightly to avoid double-fetching on rapid state changes
    const timer = setTimeout(loadData, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]); // Re-run when searchQuery changes

  // Polling: refresh products every 30 seconds to get latest prices from Shopify
  useEffect(() => {
    const POLLING_INTERVAL = 30000; // 30 seconds

    const refreshProducts = async () => {
      try {
        const freshProducts = await fetchProducts(9999);
        setProducts(freshProducts);
        console.log("[Shopify Polling] Products refreshed at", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("[Shopify Polling] Failed to refresh products:", error);
      }
    };

    const interval = setInterval(refreshProducts, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const collection = searchParams.get("collection");
    const page = searchParams.get("page");
    
    if (search) {
      setSearchQuery(search);
    } else if (!collection) {
      setSearchQuery("");
    }
    if (tag) {
      setSelectedTags([tag]);
    }
    if (page) {
      setCurrentPage(parseInt(page) || 1);
    }
  }, [searchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags]);

  const toggleTag = (slug: string) => {
    setSelectedTags(prev =>
      prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const tagsByGroup = getTagsByGroup();

  // Get collection filter from URL
  const collectionSlug = searchParams.get("collection");
  const activeCollection = collections.find(c => c.slug === collectionSlug);
  const collectionProductIds = activeCollection 
    ? getProductsForCollection(activeCollection.id)
    : null;

  const filteredProducts = useMemo(() => {
    // Base filter
    let filtered = products.filter((product) => {
      const titleLower = product.node.title?.toLowerCase() || "";
      const descLower = product.node.description?.toLowerCase() || "";

      // Collection filter
      if (collectionProductIds !== null) {
        if (!collectionProductIds.includes(product.node.id)) {
          return false;
        }
      }

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        titleLower.includes(searchQuery.toLowerCase()) ||
        descLower.includes(searchQuery.toLowerCase());

      // Tag filter
      let matchesTags = selectedTags.length === 0;
      if (!matchesTags) {
        // Safety check for getTagsForProduct
        const productTags = typeof getTagsForProduct === 'function' 
          ? getTagsForProduct(product.node.id) 
          : [];
        matchesTags = productTags.some((pt) => selectedTags.includes(pt.slug));
      }

      return matchesSearch && matchesTags;
    });

    // Orden mezclado persistente SOLO cuando no hay filtros activos
    const hasActiveFilters = selectedTags.length > 0 || searchQuery !== "" || collectionSlug !== null;
    if (!hasActiveFilters && mixedOrderIds.length > 0) {
      const indexMap = new Map<string, number>();
      mixedOrderIds.forEach((id, idx) => indexMap.set(id, idx));
      filtered = [...filtered].sort((a, b) => {
        const ai = indexMap.get(a.node.id);
        const bi = indexMap.get(b.node.id);
        if (ai === undefined && bi === undefined) return 0;
        if (ai === undefined) return 1;
        if (bi === undefined) return -1;
        return ai - bi;
      });
    }

    return filtered;
  }, [products, collectionProductIds, searchQuery, selectedTags, getTagsForProduct, collectionSlug, mixedOrderIds]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = selectedTags.length > 0 || searchQuery !== "" || collectionSlug !== null;

  const ActiveFilters = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2">
              Búsqueda: {searchQuery}
              <button onClick={() => setSearchQuery("")} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        )}
        {selectedTags.map(tag => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2 bg-price-yellow/10 text-price-yellow border-price-yellow/20">
              {tags.find(t => t.slug === tag)?.name || tag}
              <button onClick={() => toggleTag(tag)} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        ))}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              Limpiar todo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );



  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(1)}
              className="h-9 w-9 p-0"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-muted-foreground px-1">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(page)}
            className={`h-9 w-9 p-0 ${currentPage === page ? 'bg-price-yellow text-black hover:bg-price-yellow/90' : ''}`}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted-foreground px-1">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(totalPages)}
              className="h-9 w-9 p-0"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileFilterClick={() => setMobileFiltersOpen(true)} />
      <main className="pt-[100px] md:pt-[130px] pb-28 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-6 animate-fade-up">
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {searchQuery && `Buscando: "${searchQuery}" · `}
                {selectedTags.length > 0 && `Filtros: ${selectedTags.join(', ')} · `}
                {filteredProducts.length} productos encontrados
                {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
              </p>
            )}
          </div>

          {/* Desktop Layout (Sidebar + Grid) */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Desktop Sidebar (Restored) */}
            <aside className="hidden md:block w-64 flex-shrink-0 animate-fade-up">
              <div className="sticky top-28 bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                <h3 className="font-display italic uppercase mb-4 text-lg">Filtros</h3>
                <DesktopFilterSidebar 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  tagsByGroup={tagsByGroup}
                  openSections={openSections}
                  setOpenSections={setOpenSections}
                  selectedTags={selectedTags}
                  toggleTag={toggleTag}
                />
              </div>
            </aside>

            {/* Mobile Top Filters (Horizontal) */}
            <div className="md:hidden sticky top-[80px] z-30 animate-fade-up mb-4">
              <MobileFilterBar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                tagsByGroup={tagsByGroup}
                openSections={openSections}
                setOpenSections={setOpenSections}
                selectedTags={selectedTags}
                toggleTag={toggleTag}
              />
            </div>

            {/* Product Grid */}
            <div className="flex-1">
              {loading && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-price-yellow mb-4" />
                  <p className="text-muted-foreground">Cargando productos...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  <motion.div 
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {paginatedProducts.map((product) => (
                        <motion.div
                          key={product.node.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  <Pagination />
                  
                  {/* Mobile Bottom Filters (Horizontal) */}
                  <div className="md:hidden mt-8 animate-fade-up">
                    <MobileFilterBar 
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      tagsByGroup={tagsByGroup}
                      openSections={openSections}
                      setOpenSections={setOpenSections}
                      selectedTags={selectedTags}
                      toggleTag={toggleTag}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/50 rounded-xl animate-fade-up">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium mb-2">No se encontraron productos</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md px-4">
                    Intenta con otra búsqueda o filtros
                  </p>
                  <Button onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
