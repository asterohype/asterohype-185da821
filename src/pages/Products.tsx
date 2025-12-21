import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductTags } from "@/hooks/useProductTags";
import { useCollections } from "@/hooks/useCollections";
import { Loader2, Search, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const GROUP_ORDER = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];
const PRODUCTS_PER_PAGE = 40;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tag = searchParams.get("tag");
    return tag ? [tag] : [];
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'General': true,
    'Ropa Detallado': false,
    'Estilos': false,
    'Destacados': false,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { tags, getTagsByGroup, getTagsForProduct, loading: tagsLoading } = useProductTags();
  const { collections, getProductsForCollection } = useCollections();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        // Primera página rápida - solo 40 productos (1 página)
        const firstBatch = await fetchProducts(40);
        if (cancelled) return;
        setProducts(firstBatch);
        setLoading(false);

        // Cargar resto en segundo plano de forma incremental
        const batchSizes = [80, 150, 250, 400];
        for (const size of batchSizes) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
          if (cancelled) return;
          const batch = await fetchProducts(size);
          if (cancelled) return;
          setProducts(batch);
        }

        // Carga final completa
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (cancelled) return;
        const fullBatch = await fetchProducts(9999);
        if (cancelled) return;
        setProducts(fullBatch);
      } catch (error) {
        console.error("Failed to load products:", error);
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
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
        const productTags = getTagsForProduct(product.node.id);
        matchesTags = productTags.some((pt) => selectedTags.includes(pt.slug));
      }

      return matchesSearch && matchesTags;
    });

    // Mezclar productos por nicho (alternando por productType) + mezclar dentro de cada tipo
    if (filtered.length > 0) {
      // Seed estable por sesión/búsqueda para que no cambie cada render
      const seedStr = `${searchQuery}|${selectedTags.join(",")}|${collectionSlug ?? ""}`;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;

      const seededRand = () => {
        // LCG simple
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 0xffffffff;
      };

      const shuffleInPlace = <T,>(arr: T[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(seededRand() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      // Agrupar por tipo de producto
      const byType: Record<string, ShopifyProduct[]> = {};
      filtered.forEach((p) => {
        const type = p.node.productType || "otros";
        (byType[type] ??= []).push(p);
      });

      // Mezclar dentro de cada tipo para evitar “bloques” repetidos
      Object.values(byType).forEach((list) => shuffleInPlace(list));

      // Orden de tipos mezclado (pero estable)
      const types = shuffleInPlace(Object.keys(byType));

      // Intercalado round-robin
      const mixed: ShopifyProduct[] = [];
      let remaining = filtered.length;
      let typeIndex = 0;

      while (remaining > 0) {
        const type = types[typeIndex % types.length];
        const list = byType[type];
        const item = list?.shift();
        if (item) {
          mixed.push(item);
          remaining--;
        }
        typeIndex++;
      }

      return mixed;
    }

    return filtered;
  }, [products, collectionProductIds, searchQuery, selectedTags, getTagsForProduct]);

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

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50 focus:border-price-yellow rounded-lg"
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="h-3 w-3 mr-2" />
          Limpiar filtros
        </Button>
      )}

      {/* Tag Groups */}
      {GROUP_ORDER.map((groupName) => {
        const groupTags = tagsByGroup[groupName] || [];
        if (groupTags.length === 0) return null;
        
        const getTagClass = (group: string) => {
          switch (group) {
            case 'Ropa Detallado': return 'tag-ropa';
            case 'Estilos': return 'tag-estilos';
            case 'Destacados': return 'tag-destacados';
            default: return 'tag-general';
          }
        };
        
        const tagClass = getTagClass(groupName);
        
        return (
          <Collapsible 
            key={groupName}
            open={openSections[groupName]} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [groupName]: open }))}
          >
            <CollapsibleTrigger 
              data-filter-trigger
              className="flex items-center justify-between w-full py-3 text-left rounded-lg"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
              <span className="font-semibold text-foreground">{groupName}</span>
              {openSections[groupName] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-4">
              <div className="flex flex-wrap gap-2">
                {groupTags.map((tag, idx) => {
                  const isSelected = selectedTags.includes(tag.slug);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={`
                        text-xs px-3 py-1.5 rounded-full transition-all duration-200
                        ${tagClass} ${isSelected ? 'selected' : ''}
                      `}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
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
      <main className="pt-32 pb-28 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-6 animate-fade-up">
            <p className="text-sm text-muted-foreground">
              {searchQuery && `Buscando: "${searchQuery}" · `}
              {selectedTags.length > 0 && `Filtros: ${selectedTags.join(', ')} · `}
              {filteredProducts.length} productos encontrados
              {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-36">
                <h2 className="font-semibold text-lg text-foreground mb-4">Filtros</h2>
                {tagsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <FilterSidebar />
                )}
              </div>
            </aside>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-lg text-foreground">Filtros</h2>
                  <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <FilterSidebar />
                <div className="mt-6">
                  <Button onClick={() => setMobileFiltersOpen(false)} className="w-full bg-primary text-primary-foreground">
                    Ver {filteredProducts.length} productos
                  </Button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-32 animate-fade-up">
                  <p className="text-muted-foreground text-xl">No se encontraron productos</p>
                  <p className="text-muted-foreground/70 mt-2">Intenta con otra búsqueda o filtros</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedProducts.map((product, index) => {
                      const productTags = getTagsForProduct(product.node.id);
                      return (
                        <div
                          key={product.node.id}
                          className="animate-fade-up"
                          style={{ animationDelay: `${index * 20}ms` }}
                        >
                          <ProductCard product={product} tags={productTags} />
                        </div>
                      );
                    })}
                  </div>
                  <Pagination />
                </>
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
