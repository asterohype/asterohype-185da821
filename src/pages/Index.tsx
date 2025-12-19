import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sponsors } from "@/components/home/Sponsors";
import lifestyleImg1 from "@/assets/lifestyle-shopping-1.jpg";
import lifestyleImg2 from "@/assets/lifestyle-shopping-2.jpg";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { Smartphone, Home, Shirt, Headphones, ChevronRight, Flame, Zap, Gift, Truck, Shield, Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductTags } from "@/hooks/useProductTags";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Category definitions with slugs matching the database tags
const DISPLAY_CATEGORIES = [
  { slug: "tecnologia", label: "Tecnología", icon: Smartphone },
  { slug: "accesorios", label: "Accesorios", icon: Headphones },
  { slug: "hogar", label: "Hogar", icon: Home },
  { slug: "ropa", label: "Ropa", icon: Shirt },
  { slug: "fundas", label: "Fundas", icon: Smartphone },
  { slug: "gadgets", label: "Gadgets", icon: Smartphone },
  { slug: "calzado", label: "Calzado", icon: Shirt },
  { slug: "electronica", label: "Electrónica", icon: Smartphone },
];

// Animated Image Carousel Component
const ImageCarousel = ({ images, interval = 3000 }: { images: string[], interval?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            i === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
};

const Index = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { tags, getTagsForProduct, getProductsForTag, loading: tagsLoading } = useProductTags();

  // Authentication state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

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

  // Filter products by special tags
  const topProducts = useMemo(() => {
    const ids = getProductsForTag('top');
    return products.filter(p => ids.includes(p.node.id));
  }, [products, getProductsForTag]);

  const ofertasProducts = useMemo(() => {
    const ids = getProductsForTag('ofertas');
    return products.filter(p => ids.includes(p.node.id));
  }, [products, getProductsForTag]);

  const nuevosProducts = useMemo(() => {
    const ids = getProductsForTag('nuevos');
    return products.filter(p => ids.includes(p.node.id));
  }, [products, getProductsForTag]);

  const destacadosProducts = useMemo(() => {
    const ids = getProductsForTag('destacado');
    return products.filter(p => ids.includes(p.node.id));
  }, [products, getProductsForTag]);

  const eleganteProducts = useMemo(() => {
    const ids = getProductsForTag('elegante');
    return products.filter(p => ids.includes(p.node.id));
  }, [products, getProductsForTag]);

  // Get a product image for a category using DB tags
  const getCategoryPreviewImage = useCallback((categorySlug: string) => {
    const taggedProductIds = getProductsForTag(categorySlug);
    if (taggedProductIds.length > 0) {
      const taggedProduct = products.find(p => taggedProductIds.includes(p.node.id));
      if (taggedProduct) {
        return taggedProduct.node.images.edges[0]?.node.url;
      }
    }
    return null;
  }, [products, getProductsForTag]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32">
        {/* Lifestyle Banner */}
        <section className="container mx-auto px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] md:h-[400px]">
            <div className="relative rounded-2xl overflow-hidden group">
              <img src={lifestyleImg1} alt="Shopping lifestyle" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl md:text-3xl font-display italic text-foreground mb-2">Compra con Confianza</h2>
                <p className="text-muted-foreground text-sm md:text-base">Miles de clientes satisfechos</p>
                <Link to="/products">
                  <Button variant="hero" size="lg" className="mt-4 rounded-full">
                    Explorar Tienda
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden group">
              <img src={lifestyleImg2} alt="Happy customer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl md:text-3xl font-display italic text-foreground mb-2">Ofertas Exclusivas</h2>
                <p className="text-muted-foreground text-sm md:text-base">Descuentos especiales cada día</p>
                <Link to="/products">
                  <Button variant="hero-outline" size="lg" className="mt-4 rounded-full">
                    Ver Ofertas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing Cards Grid - Amazon Style */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : (
              <>
                {/* Top Ventas Card with Carousel */}
                {topProducts.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5 hover:border-price-yellow/50 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-foreground">Top Ventas</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {topProducts.slice(0, 4).map((product, i) => (
                        <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:ring-2 hover:ring-price-yellow/50 transition-all">
                          <ImageCarousel images={[product.node.images.edges[0]?.node.url, product.node.images.edges[1]?.node.url].filter(Boolean) as string[]} interval={3000 + i * 500} />
                        </Link>
                      ))}
                    </div>
                    <Link to="/products?tag=top" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
                      Ver más <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {/* Ofertas Flash Card */}
                {ofertasProducts.length > 0 && (
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-red-500 animate-pulse" />
                      <h3 className="font-semibold text-foreground">Ofertas del Día</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {ofertasProducts.slice(0, 4).map((product, i) => (
                        <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:ring-2 hover:ring-red-500/50 transition-all relative group">
                          <ImageCarousel images={[product.node.images.edges[0]?.node.url, product.node.images.edges[1]?.node.url].filter(Boolean) as string[]} interval={2500 + i * 400} />
                          <span className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">HOT</span>
                        </Link>
                      ))}
                    </div>
                    <Link to="/products?tag=ofertas" className="text-sm text-red-400 hover:underline flex items-center gap-1">
                      Ver ofertas <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {/* Nuevos Productos Card */}
                {nuevosProducts.length > 0 && (
                  <div className="bg-gradient-to-br from-price-yellow/10 to-amber-500/10 border border-price-yellow/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5 text-price-yellow" />
                      <h3 className="font-semibold text-foreground">Nuevos Productos</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {nuevosProducts.slice(0, 4).map((product, i) => (
                        <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:ring-2 hover:ring-price-yellow/50 transition-all">
                          <ImageCarousel images={[product.node.images.edges[0]?.node.url, product.node.images.edges[1]?.node.url].filter(Boolean) as string[]} interval={3500 + i * 300} />
                        </Link>
                      ))}
                    </div>
                    <Link to="/products?tag=nuevos" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
                      Explorar <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {/* User Card - Changes based on auth state */}
                {user ? (
                  // Logged in: Show Elegante category
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <h3 className="font-semibold text-foreground">Estilo Elegante</h3>
                    </div>
                    {eleganteProducts.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {eleganteProducts.slice(0, 4).map((product, i) => (
                            <Link key={i} to={`/product/${product.node.handle}`} className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:ring-2 hover:ring-purple-500/50 transition-all">
                              <ImageCarousel images={[product.node.images.edges[0]?.node.url, product.node.images.edges[1]?.node.url].filter(Boolean) as string[]} interval={3200 + i * 400} />
                            </Link>
                          ))}
                        </div>
                        <Link to="/products?tag=elegante" className="text-sm text-purple-400 hover:underline flex items-center gap-1">
                          Ver colección <ChevronRight className="h-3 w-3" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Próximamente más productos</p>
                    )}
                  </div>
                ) : (
                  // Not logged in: Show login card
                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
                    <h3 className="font-semibold text-foreground mb-2">Mejora tu experiencia</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">Inicia sesión para guardar favoritos y ver tu historial.</p>
                    <Link to="/auth">
                      <Button variant="hero" className="w-full rounded-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Category Quick Access - Shein Style Circles */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl uppercase italic text-foreground">Categorías</h2>
            <Link to="/products" className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-6 md:gap-10 lg:gap-12 flex-wrap">
              {DISPLAY_CATEGORIES.map((category) => {
                const previewImage = getCategoryPreviewImage(category.slug);
                return (
                  <Link
                    key={category.label}
                    to={`/products?tag=${category.slug}`}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-2 border-border/50 flex items-center justify-center overflow-hidden group-hover:border-price-yellow transition-all duration-300 group-hover:scale-105 bg-secondary/30">
                      {previewImage ? (
                        <img src={previewImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <category.icon className="h-10 w-10 text-foreground" />
                      )}
                    </div>
                    <span className="text-sm md:text-base text-center text-muted-foreground group-hover:text-foreground transition-colors font-medium">{category.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* PRODUCTOS DESTACADOS - Special highlighted section */}
        <section className="py-10 bg-gradient-to-r from-price-yellow/5 via-price-yellow/10 to-price-yellow/5 border-y border-price-yellow/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-price-yellow rounded-full"></div>
                <h2 className="font-display text-2xl md:text-3xl uppercase italic text-foreground">
                  Productos <span className="text-price-yellow">Destacados</span>
                </h2>
                <Star className="h-6 w-6 text-price-yellow fill-price-yellow animate-pulse" />
              </div>
              <Link to="/products" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-3">
                    <Skeleton className="aspect-square rounded-lg mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : destacadosProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {destacadosProducts.slice(0, 10).map((product, index) => {
                  const productTags = getTagsForProduct(product.node.id);
                  return (
                    <Link 
                      key={product.node.id}
                      to={`/product/${product.node.handle}`}
                      className="group relative bg-card rounded-xl overflow-hidden border-2 border-price-yellow/30 hover:border-price-yellow transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-price-yellow/20 animate-fade-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Destacado badge */}
                      <div className="absolute top-2 left-2 z-10 bg-price-yellow text-background text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-background" />
                        DESTACADO
                      </div>
                      
                      {/* Category labels from DB */}
                      {productTags.length > 0 && (
                        <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {productTags.slice(0, 2).map(tag => (
                            <span 
                              key={tag.id}
                              className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-2 py-0.5 rounded-full border border-border/50"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Image with glow effect */}
                      <div className="aspect-square overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-price-yellow/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[1]"></div>
                        <img 
                          src={product.node.images.edges[0]?.node.url} 
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="p-3">
                        <h3 className="text-xs md:text-sm font-medium text-foreground line-clamp-2 group-hover:text-price-yellow transition-colors">
                          {product.node.title}
                        </h3>
                        <p className="text-price-yellow font-bold text-sm md:text-base mt-1">
                          {formatPrice(product.node.priceRange.minVariantPrice.amount, product.node.priceRange.minVariantPrice.currencyCode)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay productos destacados aún</p>
            )}
          </div>
        </section>

        {/* Category Sections with Products - using DB tags */}
        {!loading && !tagsLoading && products.length > 0 && DISPLAY_CATEGORIES.slice(0, 4).map((category) => {
          const taggedProductIds = getProductsForTag(category.slug);
          const categoryProducts = products.filter(p => taggedProductIds.includes(p.node.id)).slice(0, 10);
          if (categoryProducts.length === 0) return null;
          return (
            <section key={category.slug} className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-price-yellow" />
                  <h2 className="font-display text-xl md:text-2xl uppercase italic text-foreground">{category.label}</h2>
                </div>
                <Link to={`/products?tag=${category.slug}`} className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1">
                  Ver todo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-2 md:gap-3">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} tags={getTagsForProduct(product.node.id)} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Sponsors section with products */}
        <Sponsors products={products.slice(12, 20)} />

        {/* Trust Badges - Above footer */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Truck, title: "Envío Rápido", desc: "Envío mundial disponible" },
              { icon: Shield, title: "Pago Seguro", desc: "Transacciones protegidas" },
              { icon: Star, title: "Calidad Premium", desc: "Productos seleccionados" },
              { icon: Headphones, title: "Soporte 24/7", desc: "Estamos para ayudarte" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4 bg-card rounded-xl border border-border/50 hover:border-price-yellow/30 transition-colors">
                <badge.icon className="h-6 w-6 md:h-8 md:w-8 text-price-yellow flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-xs md:text-sm">{badge.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
