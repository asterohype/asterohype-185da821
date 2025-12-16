import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Sponsors } from "@/components/home/Sponsors";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { Loader2, Smartphone, Home, Shirt, Headphones, ChevronRight, Flame, Zap, Gift, Truck, Shield, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "tech", label: "Tecnología", icon: Smartphone, color: "from-blue-500/20 to-cyan-500/20", keywords: ["phone case", "cable", "charger", "electronic", "gadget", "smart", "secador", "bluetooth"] },
  { id: "accesorios", label: "Accesorios", icon: Headphones, color: "from-purple-500/20 to-pink-500/20", keywords: ["case", "funda", "protector", "cover", "holder"] },
  { id: "home", label: "Hogar", icon: Home, color: "from-green-500/20 to-emerald-500/20", keywords: ["desk", "kitchen", "home", "tumbler", "organizer"] },
  { id: "clothing", label: "Ropa", icon: Shirt, color: "from-orange-500/20 to-red-500/20", keywords: ["coat", "boots", "slippers", "cotton", "warm", "fashion"] },
];

const Index = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getProductsByCategory = (keywords: string[]) => {
    return products.filter((product) => {
      const titleLower = product.node.title?.toLowerCase() || "";
      const descLower = product.node.description?.toLowerCase() || "";
      return keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) ||
        descLower.includes(keyword.toLowerCase())
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        
        {/* Marketing Cards Grid - Amazon Style */}
        {!loading && products.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Top Ventas Card */}
              <div className="bg-card border border-border rounded-xl p-5 hover:border-price-yellow/50 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Top Ventas</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {products.slice(0, 4).map((product, i) => (
                    <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:opacity-80 transition-opacity">
                      <img src={product.node.images.edges[0]?.node.url} alt="" className="w-full h-full object-cover" />
                    </Link>
                  ))}
                </div>
                <Link to="/products" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
                  Ver más <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Ofertas Flash Card */}
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-foreground">Ofertas del Día</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {products.slice(4, 8).map((product, i) => (
                    <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:opacity-80 transition-opacity relative">
                      <img src={product.node.images.edges[0]?.node.url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">HOT</span>
                    </Link>
                  ))}
                </div>
                <Link to="/products" className="text-sm text-red-400 hover:underline flex items-center gap-1">
                  Ver ofertas <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Nuevos Productos Card */}
              <div className="bg-gradient-to-br from-price-yellow/10 to-amber-500/10 border border-price-yellow/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="h-5 w-5 text-price-yellow" />
                  <h3 className="font-semibold text-foreground">Nuevos Productos</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {products.slice(8, 12).map((product, i) => (
                    <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:opacity-80 transition-opacity">
                      <img src={product.node.images.edges[0]?.node.url} alt="" className="w-full h-full object-cover" />
                    </Link>
                  ))}
                </div>
                <Link to="/products" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
                  Explorar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Iniciar Sesión Card */}
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
                <h3 className="font-semibold text-foreground mb-2">Mejora tu experiencia</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">Inicia sesión para guardar favoritos y ver tu historial.</p>
                <Link to="/auth">
                  <Button variant="hero" className="w-full rounded-full">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Category Quick Access - Visual Circles like Shein */}
        {!loading && products.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase italic text-foreground">Categorías</h2>
              <Link to="/products" className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const categoryProducts = getProductsByCategory(category.keywords);
                const previewImage = categoryProducts[0]?.node.images.edges[0]?.node.url;
                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${category.color} border border-border/50 flex items-center justify-center overflow-hidden group-hover:border-price-yellow/50 transition-all group-hover:scale-105`}>
                      {previewImage ? (
                        <img src={previewImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6 text-foreground" />
                      )}
                    </div>
                    <span className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">{category.label}</span>
                  </Link>
                );
              })}
              {/* Repeat for more visual circles */}
              {CATEGORIES.map((category) => {
                const categoryProducts = getProductsByCategory(category.keywords);
                const previewImage = categoryProducts[1]?.node.images.edges[0]?.node.url || categoryProducts[0]?.node.images.edges[0]?.node.url;
                return (
                  <Link
                    key={`${category.id}-2`}
                    to={`/products?category=${category.id}`}
                    className="hidden md:flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${category.color} border border-border/50 flex items-center justify-center overflow-hidden group-hover:border-price-yellow/50 transition-all group-hover:scale-105`}>
                      {previewImage && (
                        <img src={previewImage} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">Más {category.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Featured Products Grid */}
        {!loading && products.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase italic text-foreground">Productos Destacados</h2>
              <Link to="/products" className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {products.slice(0, 10).map((product, index) => (
                <div 
                  key={product.node.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Sections with Products */}
        {!loading && products.length > 0 && CATEGORIES.map((category) => {
          const categoryProducts = getProductsByCategory(category.keywords).slice(0, 5);
          if (categoryProducts.length === 0) return null;
          return (
            <section key={category.id} className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-price-yellow" />
                  <h2 className="font-display text-xl uppercase italic text-foreground">{category.label}</h2>
                </div>
                <Link to={`/products?category=${category.id}`} className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1">
                  Ver todo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Trust Badges */}
        <section className="container mx-auto px-4 py-10">
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
        </section>

        <Sponsors />

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
