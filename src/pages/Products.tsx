import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { Loader2, Search, Smartphone, Home, Shirt, Headphones, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PRODUCTS_PER_PAGE = 15;

// Updated categories with better keyword matching
const CATEGORIES = [
  { id: "all", label: "Todos", icon: null, keywords: [] },
  { 
    id: "tech", 
    label: "Tecnología & Gadgets", 
    icon: Smartphone, 
    keywords: ["phone case", "leather texture phone", "cable", "charger", "cargador", "auricular", "earphone", "headphone", "watch", "reloj", "smart", "electronic", "gadget", "speaker", "altavoz", "power bank", "bateria", "usb", "bluetooth", "secador", "multifuncional", "cepillo"]
  },
  {
    id: "accesorios",
    label: "Accesorios Móvil",
    icon: Headphones,
    keywords: ["phone case", "leather texture phone", "case", "funda", "carcasa", "protector", "cable", "strap", "correa", "holder", "soporte", "cover"]
  },
  { 
    id: "home", 
    label: "Home & Lifestyle", 
    icon: Home, 
    keywords: ["desk", "escritorio", "lamp", "lámpara", "chair", "silla", "table", "mesa", "home", "hogar", "kitchen", "cocina", "decoration", "decoración", "furniture", "mueble", "organizer", "storage", "shelf", "computer desk", "slippers", "zapatillas casa"]
  },
  { 
    id: "clothing", 
    label: "Ropa", 
    icon: Shirt, 
    keywords: ["coat", "chaqueta", "jacket", "shirt", "camiseta", "pants", "pantalón", "dress", "vestido", "boots", "botas", "shoes", "zapatos", "slippers", "sweater", "suéter", "hoodie", "cotton", "winter", "warm", "clothing", "wear", "fashion", "collar", "plush", "thickening", "boys", "cotton boots"]
  },
];

const PROMO_BANNERS = [
  { icon: Sparkles, title: "Nuevos Productos", subtitle: "Descubre lo último", color: "from-purple-500/20 to-pink-500/20" },
  { icon: TrendingUp, title: "Top Ventas", subtitle: "Lo más vendido", color: "from-price-yellow/20 to-orange-500/20" },
  { icon: Zap, title: "Envío Rápido", subtitle: "6-10 días", color: "from-green-500/20 to-emerald-500/20" },
];

const Products = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(50);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const filteredProducts = products.filter((product) => {
    const titleLower = product.node.title?.toLowerCase() || "";
    const descLower = product.node.description?.toLowerCase() || "";
    
    const matchesSearch =
      titleLower.includes(searchQuery.toLowerCase()) ||
      descLower.includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") {
      return matchesSearch;
    }
    
    const category = CATEGORIES.find(c => c.id === activeCategory);
    if (!category) return matchesSearch;
    
    const productType = product.node.productType?.toLowerCase() || "";
    const tags = product.node.tags?.map(t => t.toLowerCase()) || [];
    
    const matchesCategory = category.keywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase()) ||
      descLower.includes(keyword.toLowerCase()) ||
      productType.includes(keyword.toLowerCase()) ||
      tags.some(tag => tag.includes(keyword.toLowerCase()))
    );
    
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <h1 className="text-3xl md:text-5xl font-display uppercase italic text-foreground mb-3 tracking-wide">
              Todos los Productos
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base mb-6">
              Descubre nuestra colección completa de accesorios modernos y gadgets diseñados para un estilo de vida sofisticado.
            </p>

            {/* Promo Banners */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {PROMO_BANNERS.map((banner, index) => {
                const Icon = banner.icon;
                return (
                  <div 
                    key={index}
                    className={`p-3 md:p-4 rounded-xl bg-gradient-to-r ${banner.color} border border-border/50 flex items-center gap-2 md:gap-3 hover:scale-[1.02] transition-transform cursor-pointer`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs md:text-sm truncate">{banner.title}</p>
                      <p className="text-muted-foreground text-[10px] md:text-xs truncate">{banner.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "hero" : "outline"}
                    size="sm"
                    className="gap-1.5 md:gap-2 rounded-full transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                    {category.label}
                  </Button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-card border-border/50 focus:border-price-yellow rounded-full h-11 transition-all duration-300"
              />
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-muted-foreground text-sm mt-4">
                Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
              </p>
            )}
          </div>

          {/* Products Grid - 5 columns */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-32 animate-fade-up">
              <p className="text-muted-foreground text-xl">
                No se encontraron productos
              </p>
              <p className="text-muted-foreground/70 mt-2">
                Intenta con otra búsqueda
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                {paginatedProducts.map((product, index) => (
                  <div 
                    key={product.node.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`rounded-full ${currentPage === 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-card'}`}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className={`rounded-full cursor-pointer ${currentPage === page ? 'bg-price-yellow text-background' : 'hover:bg-card'}`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={`rounded-full ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-card'}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
