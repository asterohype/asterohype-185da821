import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductTags } from "@/hooks/useProductTags";
import { Loader2, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const GROUP_ORDER = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];

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
  
  const { tags, getTagsByGroup, getTagsForProduct, loading: tagsLoading } = useProductTags();

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(250);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    if (search) {
      setSearchQuery(search);
    }
    if (tag) {
      setSelectedTags([tag]);
    }
  }, [searchParams]);

  const toggleTag = (slug: string) => {
    setSelectedTags(prev =>
      prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery("");
    setSearchParams({});
  };

  const tagsByGroup = getTagsByGroup();

  const filteredProducts = products.filter((product) => {
    const titleLower = product.node.title?.toLowerCase() || "";
    const descLower = product.node.description?.toLowerCase() || "";

    // Search filter
    const matchesSearch = searchQuery === "" ||
      titleLower.includes(searchQuery.toLowerCase()) ||
      descLower.includes(searchQuery.toLowerCase());

    // Tag filter - check if product has ANY of the selected tags
    let matchesTags = selectedTags.length === 0;
    if (!matchesTags) {
      const productTags = getTagsForProduct(product.node.id);
      matchesTags = productTags.some(pt => selectedTags.includes(pt.slug));
    }

    return matchesSearch && matchesTags;
  });

  const hasActiveFilters = selectedTags.length > 0 || searchQuery !== "";

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
        
        return (
          <Collapsible 
            key={groupName}
            open={openSections[groupName]} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [groupName]: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
              <span className="font-semibold text-foreground">{groupName}</span>
              {openSections[groupName] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {groupTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.slug);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={`
                        text-xs px-3 py-1.5 rounded-full transition-all
                        ${isSelected 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-secondary/50 text-muted-foreground border border-transparent hover:border-border hover:text-foreground'
                        }
                      `}
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-6 animate-fade-up">
            <p className="text-sm text-muted-foreground">
              {searchQuery && `Buscando: "${searchQuery}" · `}
              {selectedTags.length > 0 && `Filtros: ${selectedTags.join(', ')} · `}
              {filteredProducts.length} productos encontrados
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

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
              <Button
                onClick={() => setMobileFiltersOpen(true)}
                className="w-full bg-price-yellow text-background hover:bg-price-yellow/90"
              >
                Filtros {hasActiveFilters && `(${selectedTags.length})`}
              </Button>
            </div>

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
                  <Button onClick={() => setMobileFiltersOpen(false)} className="w-full bg-price-yellow text-background">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product, index) => {
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