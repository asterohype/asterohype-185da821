import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { Loader2, Search, Smartphone, Home, Shirt, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const Products = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-12 animate-fade-up">
            <h1 className="text-4xl md:text-5xl font-display uppercase italic text-foreground mb-4 tracking-wide">
              Todos los Productos
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Descubre nuestra colección completa de accesorios modernos y gadgets diseñados para un estilo de vida sofisticado.
            </p>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "hero" : "outline"}
                    size="sm"
                    className="gap-2 rounded-xl transition-all duration-300 hover:scale-105"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
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
                className="pl-11 bg-card border-border/50 focus:border-price-yellow rounded-xl h-12 transition-all duration-300"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32 animate-fade-up">
              <p className="text-muted-foreground text-xl">
                No se encontraron productos
              </p>
              <p className="text-muted-foreground/70 mt-2">
                Intenta con otra búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.node.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
