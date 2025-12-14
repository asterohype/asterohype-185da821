import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { Loader2, Search, Smartphone, Home, Shirt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: null },
  { id: "tech", label: "Tecnología & Gadgets", icon: Smartphone },
  { id: "home", label: "Home & Lifestyle", icon: Home },
  { id: "clothing", label: "Ropa", icon: Shirt },
];

const Products = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(20);
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
    const matchesSearch =
      product.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.node.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // For now, all products match all categories until product types are properly tagged in Shopify
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
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
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className="gap-2 rounded-full"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-muted-foreground text-xl">
                No se encontraron productos
              </p>
              <p className="text-muted-foreground/70 mt-2">
                Intenta con otra búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.node.id} product={product} />
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
