import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { Loader2, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CATEGORIES = [
  { id: "tech", label: "Tecnología", keywords: ["phone", "cable", "charger", "electronic", "gadget", "smart", "secador", "bluetooth"] },
  { id: "accesorios", label: "Accesorios", keywords: ["case", "funda", "protector", "cover", "holder"] },
  { id: "home", label: "Hogar", keywords: ["desk", "kitchen", "home", "tumbler", "organizer", "lamp"] },
  { id: "clothing", label: "Ropa", keywords: ["coat", "boots", "slippers", "cotton", "warm", "fashion", "shirt"] },
];

const STYLES = [
  { id: "minimal", label: "Minimalista" },
  { id: "modern", label: "Moderno" },
  { id: "classic", label: "Clásico" },
  { id: "casual", label: "Casual" },
];

const COLORS = [
  { id: "black", label: "Negro", color: "#000000" },
  { id: "white", label: "Blanco", color: "#FFFFFF" },
  { id: "gray", label: "Gris", color: "#808080" },
  { id: "brown", label: "Marrón", color: "#8B4513" },
  { id: "blue", label: "Azul", color: "#0066CC" },
  { id: "red", label: "Rojo", color: "#CC0000" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState({
    category: true,
    style: true,
    color: true,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(100);
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
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleColor = (id: string) => {
    setSelectedColors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStyles([]);
    setSelectedColors([]);
    setSearchQuery("");
    setSearchParams({});
  };

  const filteredProducts = products.filter((product) => {
    const titleLower = product.node.title?.toLowerCase() || "";
    const descLower = product.node.description?.toLowerCase() || "";

    // Search filter
    const matchesSearch = searchQuery === "" ||
      titleLower.includes(searchQuery.toLowerCase()) ||
      descLower.includes(searchQuery.toLowerCase());

    // Category filter
    let matchesCategory = selectedCategories.length === 0;
    if (!matchesCategory) {
      for (const catId of selectedCategories) {
        const cat = CATEGORIES.find(c => c.id === catId);
        if (cat && cat.keywords.some(kw => titleLower.includes(kw) || descLower.includes(kw))) {
          matchesCategory = true;
          break;
        }
      }
    }

    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = selectedCategories.length > 0 || selectedStyles.length > 0 || selectedColors.length > 0 || searchQuery !== "";

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

      {/* Category Filter */}
      <Collapsible open={openSections.category} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, category: open }))}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border/50">
          <span className="font-semibold text-foreground">Categoría</span>
          {openSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer hover:text-price-yellow transition-colors">
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
                className="border-border data-[state=checked]:bg-price-yellow data-[state=checked]:border-price-yellow"
              />
              <span className="text-sm text-muted-foreground">{cat.label}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Style Filter */}
      <Collapsible open={openSections.style} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, style: open }))}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border/50">
          <span className="font-semibold text-foreground">Estilo</span>
          {openSections.style ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {STYLES.map((style) => (
            <label key={style.id} className="flex items-center gap-3 cursor-pointer hover:text-price-yellow transition-colors">
              <Checkbox
                checked={selectedStyles.includes(style.id)}
                onCheckedChange={() => toggleStyle(style.id)}
                className="border-border data-[state=checked]:bg-price-yellow data-[state=checked]:border-price-yellow"
              />
              <span className="text-sm text-muted-foreground">{style.label}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Color Filter */}
      <Collapsible open={openSections.color} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, color: open }))}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border/50">
          <span className="font-semibold text-foreground">Color</span>
          {openSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-2 gap-2">
            {COLORS.map((color) => (
              <label key={color.id} className="flex items-center gap-2 cursor-pointer hover:text-price-yellow transition-colors">
                <div
                  className={`w-5 h-5 rounded-full border-2 ${selectedColors.includes(color.id) ? 'border-price-yellow' : 'border-border'}`}
                  style={{ backgroundColor: color.color }}
                  onClick={() => toggleColor(color.id)}
                />
                <span className="text-xs text-muted-foreground">{color.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
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
              {filteredProducts.length} productos encontrados
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-36">
                <h2 className="font-semibold text-lg text-foreground mb-4">Filtros</h2>
                <FilterSidebar />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
              <Button
                onClick={() => setMobileFiltersOpen(true)}
                className="w-full bg-price-yellow text-background hover:bg-price-yellow/90"
              >
                Filtros {hasActiveFilters && `(${selectedCategories.length + selectedStyles.length + selectedColors.length})`}
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
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.node.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
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
