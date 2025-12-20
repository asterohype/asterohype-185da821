import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sponsors } from "@/components/home/Sponsors";
import lifestyleImg1 from "@/assets/lifestyle-shopping-1.jpg";
import lifestyleImg2 from "@/assets/lifestyle-shopping-2.jpg";
import shoppingBags1 from "@/assets/shopping-bags-1.jpg";
import giftBoxes1 from "@/assets/gift-boxes-1.jpg";
import deliveryBoxes1 from "@/assets/delivery-boxes-1.jpg";
import shoppingCart1 from "@/assets/shopping-cart-1.jpg";
import premiumBags1 from "@/assets/premium-bags-1.jpg";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { Smartphone, Home, Shirt, Headphones, ChevronRight, Flame, Zap, Gift, Truck, Shield, Star, ArrowRight, Sparkles, Pencil, Check, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductTags } from "@/hooks/useProductTags";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useMenuConfigStore } from "@/stores/menuConfigStore";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { CategoryImageSelector } from "@/components/admin/CategoryImageSelector";
import { ChristmasBanner } from "@/components/home/ChristmasBanner";

// Scroll animation hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated Section Wrapper
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  tecnologia: Smartphone,
  accesorios: Headphones,
  hogar: Home,
  ropa: Shirt,
  fundas: Smartphone,
  gadgets: Smartphone,
  calzado: Shirt,
  electronica: Smartphone,
};

// Banner images arrays - realistic product photos without text
const LIFESTYLE_BANNER_IMAGES = [lifestyleImg1, shoppingBags1, deliveryBoxes1, shoppingCart1];
const OFFERS_BANNER_IMAGES = [lifestyleImg2, giftBoxes1, premiumBags1];

// Banner Carousel Component with clean blur transitions
const BannerCarousel = ({ images, interval = 4000 }: { images: string[], interval?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out group-hover:scale-105"
          style={{
            opacity: i === currentIndex ? 1 : 0,
            filter: i === currentIndex ? 'blur(0px)' : 'blur(12px)',
            transform: i === currentIndex ? 'scale(1)' : 'scale(1.02)',
          }}
        />
      ))}
    </div>
  );
};

// Animated Image Carousel Component for product cards
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

// Destacados Grid Component that uses overrides
const DestacadosGrid = ({ 
  products, 
  getTagsForProduct 
}: { 
  products: ShopifyProduct[]; 
  getTagsForProduct: (productId: string) => any[];
}) => {
  const { data: overrides } = useProductOverrides();
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product, index) => {
        const productTags = getTagsForProduct(product.node.id);
        const override = overrides?.find(o => o.shopify_product_id === product.node.id);
        const displayTitle = override?.title || product.node.title;
        const displayPrice = override?.price 
          ? { amount: override.price.toString(), currencyCode: product.node.priceRange.minVariantPrice.currencyCode }
          : product.node.priceRange.minVariantPrice;
        
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
                {productTags.slice(0, 2).map((tag: any) => (
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
                alt={displayTitle}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            {/* Info */}
            <div className="p-3">
              <h3 className="text-xs md:text-sm font-medium text-foreground line-clamp-2 group-hover:text-price-yellow transition-colors">
                {displayTitle}
              </h3>
              {override?.subtitle && (
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {override.subtitle}
                </p>
              )}
              <p className="text-price-yellow font-bold text-sm md:text-base mt-1">
                {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const Index = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { tags, getTagsForProduct, getProductsForTag, loading: tagsLoading } = useProductTags();
  
  // Admin mode - MUST verify isAdmin from database, not just localStorage
  const { isAdmin } = useAdmin();
  const { isAdminModeActive } = useAdminModeStore();
  const showAdminControls = isAdmin && isAdminModeActive;
  const { categories, updateCategory, updateCategoryImage, clearCategoryImage } = useMenuConfigStore();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [imageSelectorCategory, setImageSelectorCategory] = useState<{ id: string; label: string; customImage?: string } | null>(null);

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
      <main className="pt-32 pb-24 md:pb-8">
        {/* Lifestyle Banner with Carousel */}
        <section className="container mx-auto px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] md:h-[400px]">
            <div className="relative rounded-2xl overflow-hidden group">
              <BannerCarousel images={LIFESTYLE_BANNER_IMAGES} interval={5000} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 right-6 z-20">
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
              <BannerCarousel images={OFFERS_BANNER_IMAGES} interval={4000} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 right-6 z-20">
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

        {/* Marketing Cards Grid - Amazon Style with scroll animations */}
        <AnimatedSection className="container mx-auto px-4 py-8">
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
        </AnimatedSection>

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
              {categories.map((category) => {
                const previewImage = category.customImage || getCategoryPreviewImage(category.slug);
                const Icon = CATEGORY_ICONS[category.slug] || Smartphone;
                const isEditing = editingCategory === category.id;
                
                return (
                  <div key={category.id} className="flex flex-col items-center gap-3 group relative">
                    {/* Admin edit overlay for image - opens modal instead of prompt */}
                    {showAdminControls && (
                      <button
                        onClick={() => setImageSelectorCategory({
                          id: category.id,
                          label: category.label,
                          customImage: category.customImage,
                        })}
                        className="absolute top-0 right-0 z-10 p-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-colors"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    
                    <Link
                      to={`/products?tag=${category.slug}`}
                      className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-2 border-border/50 flex items-center justify-center overflow-hidden group-hover:border-price-yellow transition-all duration-300 group-hover:scale-105 bg-secondary/30"
                    >
                      {previewImage ? (
                        <img src={previewImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-10 w-10 text-foreground" />
                      )}
                    </Link>
                    
                    {/* Editable label */}
                    {showAdminControls && isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-24 text-sm px-2 py-0 text-center"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCategory(category.id, editValue);
                              setEditingCategory(null);
                              toast.success('Guardado');
                            }
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          onClick={() => {
                            updateCategory(category.id, editValue);
                            setEditingCategory(null);
                            toast.success('Guardado');
                          }}
                          className="p-1 rounded-full bg-primary/20 hover:bg-primary/30"
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </button>
                      </div>
                    ) : (
                      <span 
                        className="text-sm md:text-base text-center text-muted-foreground group-hover:text-foreground transition-colors font-medium flex items-center gap-1"
                        onClick={(e) => {
                          if (showAdminControls) {
                            e.preventDefault();
                            setEditingCategory(category.id);
                            setEditValue(category.label);
                          }
                        }}
                      >
                        {category.label}
                        {showAdminControls && (
                          <Pencil className="h-3 w-3 opacity-50 hover:opacity-100 cursor-pointer" />
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Category Image Selector Modal */}
          {imageSelectorCategory && (
            <CategoryImageSelector
              isOpen={!!imageSelectorCategory}
              onClose={() => setImageSelectorCategory(null)}
              onSelectImage={(url) => updateCategoryImage(imageSelectorCategory.id, url)}
              onClearImage={() => clearCategoryImage(imageSelectorCategory.id)}
              products={products}
              currentImage={imageSelectorCategory.customImage}
              categoryName={imageSelectorCategory.label}
            />
          )}
        </section>

        {/* Christmas Banner - debajo de categorías */}
        <section className="container mx-auto px-4">
          <ChristmasBanner />
        </section>

        {/* PRODUCTOS DESTACADOS - Special highlighted section with scroll animation */}
        <AnimatedSection className="py-10 bg-gradient-to-r from-price-yellow/5 via-price-yellow/10 to-price-yellow/5 border-y border-price-yellow/20">
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
              <DestacadosGrid products={destacadosProducts.slice(0, 10)} getTagsForProduct={getTagsForProduct} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay productos destacados aún</p>
            )}
          </div>
        </AnimatedSection>

        {/* Category Sections with Auto-scrolling Carousels */}
        {!loading && !tagsLoading && products.length > 0 && (() => {
          // Avoid showing the same product across multiple category carousels (tags can overlap)
          const used = new Set<string>();
          const visibleCategories = categories.slice(0, 6);

          return visibleCategories.map((category, categoryIndex) => {
            const taggedProductIds = getProductsForTag(category.slug);
            const categoryProducts = products
              .filter((p) => taggedProductIds.includes(p.node.id))
              .filter((p) => {
                if (used.has(p.node.id)) return false;
                used.add(p.node.id);
                return true;
              })
              .slice(0, 15);

            if (categoryProducts.length === 0) return null;
            const Icon = CATEGORY_ICONS[category.slug] || Smartphone;

            return (
              <AnimatedSection key={category.slug} delay={categoryIndex * 100} className="py-8">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-price-yellow" />
                      <h2 className="font-display text-xl md:text-2xl uppercase italic text-foreground">{category.label}</h2>
                    </div>
                    <Link
                      to={`/products?tag=${category.slug}`}
                      className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1"
                    >
                      Ver todo <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <CategoryCarousel products={categoryProducts} categorySlug={category.slug} getTagsForProduct={getTagsForProduct} />
              </AnimatedSection>
            );
          });
        })()}

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
