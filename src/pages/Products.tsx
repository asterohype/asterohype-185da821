import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { Loader2, Search, Smartphone, Home, Shirt, Headphones, ChevronRight, Flame, Star, Truck, Shield } from "lucide-react";
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

const PRODUCTS_PER_PAGE = 20;

const CATEGORIES = [
  { id: "all", label: "Todos", icon: null, keywords: [] },
  { 
    id: "tech", 
    label: "Tecnología", 
    icon: Smartphone, 
    keywords: ["phone case", "leather texture phone", "cable", "charger", "cargador", "auricular", "earphone", "headphone", "watch", "reloj", "smart", "electronic", "gadget", "speaker", "altavoz", "power bank", "bateria", "usb", "bluetooth", "secador", "multifuncional", "cepillo"]
  },
  {
    id: "accesorios",
    label: "Accesorios",
    icon: Headphones,
    keywords: ["phone case", "leather texture phone", "case", "funda", "carcasa", "protector", "cable", "strap", "correa", "holder", "soporte", "cover"]
  },
  { 
    id: "home", 
    label: "Hogar", 
    icon: Home, 
    keywords: ["desk", "escritorio", "lamp", "lámpara", "chair", "silla", "table", "mesa", "home", "hogar", "kitchen", "cocina", "decoration", "decoración", "furniture", "mueble", "organizer", "storage", "shelf", "computer desk", "slippers", "zapatillas casa", "tumbler"]
  },
  { 
    id: "clothing", 
    label: "Ropa", 
    icon: Shirt, 
    keywords: ["coat", "chaqueta", "jacket", "shirt", "camiseta", "pants", "pantalón", "dress", "vestido", "boots", "botas", "shoes", "zapatos", "slippers", "sweater", "suéter", "hoodie", "cotton", "winter", "warm", "clothing", "wear", "fashion", "collar", "plush", "thickening", "boys", "cotton boots"]
  },
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const getProductsByCategory = (categoryId: string) => {
    if (categoryId === "all") return products;
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) return [];
    
    return products.filter((product) => {
      const titleLower = product.node.title?.toLowerCase() || "";
      const descLower = product.node.description?.toLowerCase() || "";
      const productType = product.node.productType?.toLowerCase() || "";
      const tags = product.node.tags?.map(t => t.toLowerCase()) || [];
      
      return category.keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) ||
        descLower.includes(keyword.toLowerCase()) ||
        productType.includes(keyword.toLowerCase()) ||
        tags.some(tag => tag.includes(keyword.toLowerCase()))
      );
    });
  };

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

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Get featured products for each category (first 4)
  const getCategoryPreview = (categoryId: string) => {
    return getProductsByCategory(categoryId).slice(0, 4);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-price-yellow/10 via-background to-price-yellow/5 border-b border-border/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display uppercase italic text-foreground mb-2">
                  Tienda Online
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Descubre productos de calidad al mejor precio
                </p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4 text-price-yellow" />
                  <span>Envío 6-10 días</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Compra segura</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Quick Access - Visual Grid like Amazon/Shein */}
        {!loading && products.length > 0 && (
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.filter(c => c.id !== "all").map((category) => {
                const categoryProducts = getCategoryPreview(category.id);
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                      activeCategory === category.id 
                        ? 'border-price-yellow bg-price-yellow/10' 
                        : 'border-border/50 bg-card hover:border-price-yellow/50'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {Icon && <Icon className="h-5 w-5 text-price-yellow" />}
                        <h3 className="font-semibold text-foreground">{category.label}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryProducts.slice(0, 4).map((product, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary/50">
                            {product.node.images.edges[0]?.node.url && (
                              <img 
                                src={product.node.images.edges[0].node.url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getProductsByCategory(category.id).length} productos
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Ventas Section */}
        {!loading && products.length > 0 && (
          <div className="container mx-auto px-4 py-6">
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="font-display text-xl uppercase italic text-foreground">Top Ventas</h2>
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full ml-2">HOT</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {products.slice(0, 5).map((product) => (
                  <Link 
                    key={product.node.id} 
                    to={`/product/${product.node.handle}`}
                    className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-price-yellow/50 transition-all"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={product.node.images.edges[0]?.node.url} 
                        alt={product.node.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs line-clamp-1 text-muted-foreground">{product.node.title}</p>
                      <p className="text-price-yellow font-bold text-sm">
                        {formatPrice(product.node.priceRange.minVariantPrice.amount, product.node.priceRange.minVariantPrice.currencyCode)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Products Section */}
        <div className="container mx-auto px-4 py-6">
          {/* Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "hero" : "outline"}
                    size="sm"
                    className="gap-1.5 rounded-full text-xs"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {category.label}
                  </Button>
                );
              })}
            </div>
            
            <div className="relative md:ml-auto w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border/50 focus:border-price-yellow rounded-full h-10 text-sm"
              />
            </div>
          </div>

          {/* Results Info */}
          {!loading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} productos encontrados
              </p>
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages || 1}
              </p>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-muted-foreground text-xl">No se encontraron productos</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              >
                Ver todos los productos
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {paginatedProducts.map((product, index) => (
                  <div 
                    key={product.node.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`rounded-full text-sm ${currentPage === 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-card'}`}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className={`rounded-full cursor-pointer text-sm ${currentPage === page ? 'bg-price-yellow text-background' : 'hover:bg-card'}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={`rounded-full text-sm ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-card'}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: "Envío Rápido", desc: "6-10 días laborables" },
              { icon: Shield, title: "Pago Seguro", desc: "Transacciones protegidas" },
              { icon: Star, title: "Calidad Premium", desc: "Productos seleccionados" },
              { icon: Headphones, title: "Soporte 24/7", desc: "Estamos para ayudarte" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <badge.icon className="h-8 w-8 text-price-yellow" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
