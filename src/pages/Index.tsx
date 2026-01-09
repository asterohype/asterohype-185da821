import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sponsors } from "@/components/home/Sponsors";
import { ProductCard } from "@/components/products/ProductCard";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import {
  Smartphone,
  Home,
  Shirt,
  Headphones,
  ChevronRight,
  Flame,
  Zap,
  Gift,
  Truck,
  Shield,
  Star,
  ArrowRight,
  Sparkles,
  Pencil,
  Check,
  ImagePlus,
  Plus,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductTags } from "@/hooks/useProductTags";
import { EditableText } from "@/components/admin/EditableText";
import { useProductOverrides, splitTitle } from "@/hooks/useProductOverrides";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useSiteCategories } from "@/hooks/useSiteCategories";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { CategoryImageSelector } from "@/components/admin/CategoryImageSelector";
import { HomeModulesEditor, HomeModules } from '@/components/admin/HomeModulesEditor';
import { ChristmasBanner } from "@/components/home/ChristmasBanner";
import { FeaturedImageMarquee } from "@/components/home/FeaturedImageMarquee";
import { TopHeroBanners } from "@/components/home/TopHeroBanners";
import { TopHeroImageStrips } from "@/components/home/TopHeroImageStrips";
import { ProductAccessSection } from "@/components/home/ProductAccessSection";
import { motion, useScroll, useTransform } from "framer-motion";

// Animated Section Wrapper with Framer Motion
function AnimatedSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
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


// Animated Image Carousel Component for product cards
const ImageCarousel = ({ images, interval = 2000 }: { images: string[], interval?: number }) => {
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
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
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
  getTagsForProduct,
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
        const { title: displayTitle, subtitle: displaySubtitle } = splitTitle(
          product.node.title,
          override?.title_separator || null
        );
        // Price always from Shopify
        const displayPrice = product.node.priceRange.minVariantPrice;
        
        return (
          <Link 
            key={product.node.id}
            to={`/product/${product.node.handle}`}
            className="group relative bg-card rounded-xl overflow-hidden border-2 border-price-yellow/30 hover:border-price-yellow transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-price-yellow/20 animate-fade-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Destacado badge */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-2 left-2 z-10 bg-price-yellow text-background text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
      >
        <Star className="h-2.5 w-2.5 fill-background" />
        DESTACADO
      </motion.div>
            
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
              {displaySubtitle && (
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {displaySubtitle}
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
  const {
    categories,
    updateCategory,
    updateCategoryImage,
    clearCategoryImage,
    addCategory,
    removeCategory,
  } = useSiteCategories();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [imageSelectorCategory, setImageSelectorCategory] = useState<{
    id: string;
    label: string;
    customImage?: string;
  } | null>(null);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");

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
        const data = await fetchProducts(300);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Polling: refresh products every 30 seconds to get latest prices from Shopify
  useEffect(() => {
    const POLLING_INTERVAL = 30000; // 30 seconds

    const refreshProducts = async () => {
      try {
        const freshProducts = await fetchProducts(300);
        setProducts(freshProducts);
        console.log("[Shopify Polling] Products refreshed at", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("[Shopify Polling] Failed to refresh products:", error);
      }
    };

    const interval = setInterval(refreshProducts, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);


  // Filter products by special tags
  const topProducts = useMemo(() => {
    const ids = getProductsForTag('top');
    return products.filter(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return ids.includes(p.node.id) || ids.includes(simpleId);
    });
  }, [products, getProductsForTag]);

  const ofertasProducts = useMemo(() => {
    const ids = getProductsForTag('ofertas');
    return products.filter(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return ids.includes(p.node.id) || ids.includes(simpleId);
    });
  }, [products, getProductsForTag]);

  const nuevosProducts = useMemo(() => {
    const ids = getProductsForTag('nuevos');
    return products.filter(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return ids.includes(p.node.id) || ids.includes(simpleId);
    });
  }, [products, getProductsForTag]);

  const destacadosProducts = useMemo(() => {
    const ids = getProductsForTag('destacado');
    return products.filter(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return ids.includes(p.node.id) || ids.includes(simpleId);
    });
  }, [products, getProductsForTag]);

  // Fetch missing featured products that might not be in the initial batch
  // OPTIMIZATION: Only fetch if we really have missing critical items, and debounce/limit
  useEffect(() => {
    // Only run if we have initial products and tags loaded
    if (loading || tagsLoading) return;
    
    // Check if we already have enough items for critical sections to avoid unnecessary fetches
    // (e.g. if we have 4+ highlighted items, maybe we don't need to fetch more urgently)
    // But user complained about "tarda mucho encargar", so let's try to fetch them ASAP but efficiently.

    const fetchMissingProducts = async () => {
      // 1. Get tags from active modules
      const { data: modules } = await supabase
        .from('home_modules')
        .select('tag_filter')
        .eq('is_active', true);
      
      const moduleTags = modules?.map(m => m.tag_filter) || [];
      
      // Reduce the list of tags to check to just the most critical ones for the home page + module tags
      // Use Set to deduplicate
      const specialTags = Array.from(new Set(['destacado', 'nuevos', ...moduleTags])); 
      const allMissingIds = new Set<string>();

      specialTags.forEach(slug => {
          const ids = getProductsForTag(slug); // slug here can be name or slug thanks to updated hook
          // Only fetch if we have VERY few items (e.g. < 4) to populate the initial view
          // If we already have 4, user won't see the missing ones immediately anyway
          const currentCount = ids.filter(id => 
            products.some(p => p.node.id === id || p.node.id.replace('gid://shopify/Product/', '') === id)
          ).length;
          
          if (currentCount < 4) {
             const missing = ids.filter(id => 
                !products.some(p => p.node.id === id || p.node.id.replace('gid://shopify/Product/', '') === id)
             );
             // Limit to first 4 missing per tag to avoid massive queries
             missing.slice(0, 4).forEach(id => allMissingIds.add(id));
          }
      });
      
      const missingIdsArray = Array.from(allMissingIds);

      if (missingIdsArray.length > 0) {
        console.log("Fetching missing special tag products (optimized):", missingIdsArray.length);
        
        // Extract numeric IDs for Shopify search query
        const numericIds = missingIdsArray.map(gid => {
            const parts = gid.split('/');
            return parts[parts.length - 1];
        }).filter(Boolean);

        if (numericIds.length === 0) return;

        // Fetch small batch
        const query = numericIds.map(id => `id:${id}`).join(' OR ');
        
        try {
            const missingProducts = await fetchProducts(50, query);
            if (missingProducts.length > 0) {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.node.id));
                    const newProducts = missingProducts.filter(p => !existingIds.has(p.node.id));
                    if (newProducts.length === 0) return prev;
                    return [...prev, ...newProducts];
                });
            }
        } catch (e) {
            console.error("Error fetching missing special products batch:", e);
        }
      }
    };
    
    // Small timeout to let main thread breathe after initial render
    const t = setTimeout(fetchMissingProducts, 100);
    return () => clearTimeout(t);
  }, [loading, tagsLoading, getProductsForTag, products.length]);

  const eleganteProducts = useMemo(() => {
    const ids = getProductsForTag('elegante');
    return products.filter(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return ids.includes(p.node.id) || ids.includes(simpleId);
    });
  }, [products, getProductsForTag]);

  // Get a product image for a category using DB tags
  const getCategoryPreviewImage = useCallback((categorySlug: string) => {
    const taggedProductIds = getProductsForTag(categorySlug);
    if (taggedProductIds.length > 0) {
      const taggedProduct = products.find(p => {
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return taggedProductIds.includes(p.node.id) || taggedProductIds.includes(simpleId);
      });
      if (taggedProduct) {
        return taggedProduct.node.images.edges[0]?.node.url;
      }
    }
    return null;
  }, [products, getProductsForTag]);

  return (
    <div className="min-h-screen flex flex-col pt-[100px] md:pt-[130px]">
      <Header />
      
      <main className="flex-grow pb-24 md:pb-16">
        {/* Quick Access Button */}
        <div className="container mx-auto px-4 mt-4 md:mt-6 mb-2">
          <Link to="/products">
            <Button className="w-full h-12 md:h-14 text-sm sm:text-base md:text-lg font-bold rounded-xl shadow-lg shadow-price-yellow/20 bg-price-yellow text-black hover:bg-price-yellow/90 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 animate-pulse-slow">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
              <EditableText id="home_quick_access_btn" defaultText="VER TODOS LOS PRODUCTOS" />
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </Link>
        </div>

        {/* Marketing Cards Grid - Dynamic Modules */}
        <AnimatedSection className="container mx-auto px-4 py-6 md:py-8">
            {showAdminControls && (
                <div className="mb-8 p-4 border rounded-xl bg-card">
                    <HomeModulesEditor />
                </div>
            )}
            
            <HomeModules 
                products={products}
                getProductsForTag={getProductsForTag}
                loading={loading || tagsLoading}
            />
        </AnimatedSection>

        {/* Category Quick Access - Shein Style Circles */}
        <section className="container mx-auto px-4 py-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl uppercase italic text-foreground">Categorías</h2>
            <div className="flex items-center gap-3">
              {showAdminControls && (
                <Button
                  type="button"
                  variant="hero-outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setIsCreatingCategory((v) => !v)}
                >
                  <Plus className="h-4 w-4" />
                  Nueva categoría
                </Button>
              )}
              <Link
                to="/categories"
                className="text-sm text-muted-foreground hover:text-price-yellow flex items-center gap-1"
              >
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {showAdminControls && isCreatingCategory && (
            <div className="mb-6 rounded-2xl border border-border/50 bg-card p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-1">
                  <label className="text-xs text-muted-foreground">Nombre</label>
                  <Input
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="Ej: Decoración"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs text-muted-foreground">Slug</label>
                  <Input
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="Ej: decoracion"
                  />
                </div>
                <div className="md:col-span-1 flex gap-2">
                  <Button
                    type="button"
                    variant="hero"
                    className="rounded-full"
                    onClick={() => {
                      const label = newCategoryLabel.trim();
                      const slug = newCategorySlug.trim().toLowerCase().replace(/\s+/g, "-");
                      if (!label || !slug) {
                        toast.error("Rellena nombre y slug");
                        return;
                      }
                      addCategory({ slug, label });
                      setIsCreatingCategory(false);
                      setNewCategoryLabel("");
                      setNewCategorySlug("");
                      toast.success("Categoría creada");
                    }}
                  >
                    Crear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setIsCreatingCategory(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Nota: el slug debe ser único.</p>
            </div>
          )}

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
            <div className="grid grid-cols-2 gap-4 pb-4 justify-items-center md:flex md:flex-wrap md:justify-center md:gap-10 lg:gap-12">
              {categories.map((category) => {
                const previewImage = category.customImage || getCategoryPreviewImage(category.slug);
                const Icon = CATEGORY_ICONS[category.slug] || Smartphone;
                const isEditing = editingCategory === category.id;
                
                return (
                  <motion.div 
                    key={category.id} 
                    className="flex flex-col items-center gap-3 group relative flex-shrink-0 snap-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Admin controls - image and delete */}
                    {showAdminControls && (
                      <div className="absolute -top-1 -right-1 z-10 flex gap-1">
                        <button
                          onClick={() => setImageSelectorCategory({
                            id: category.id,
                            label: category.label,
                            customImage: category.customImage,
                          })}
                          className="p-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-colors"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la categoría "${category.label}"?`)) {
                              removeCategory(category.id);
                              toast.success('Categoría eliminada');
                            }
                          }}
                          className="p-1.5 rounded-full bg-destructive/90 text-destructive-foreground shadow-lg hover:bg-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                              updateCategory({ id: category.id, label: editValue });
                              setEditingCategory(null);
                              toast.success('Guardado');
                            }
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          onClick={() => {
                            updateCategory({ id: category.id, label: editValue });
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
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Category Image Selector Modal */}
          {imageSelectorCategory && (
            <CategoryImageSelector
              isOpen={!!imageSelectorCategory}
              onClose={() => setImageSelectorCategory(null)}
              onSelectImage={(url) => updateCategoryImage({ id: imageSelectorCategory.id, imageUrl: url })}
              onClearImage={() => clearCategoryImage(imageSelectorCategory.id)}
              products={products}
              currentImage={imageSelectorCategory.customImage}
              categoryName={imageSelectorCategory.label}
            />
          )}
        </section>

        {/* Horizontal Scrolling Products (Bottom Marquee) - Moved here */}
        {!loading && products.length > 0 && (
          <AnimatedSection className="py-8 bg-secondary/20">
             <div className="container mx-auto px-4 mb-4">
                 <h2 className="font-display text-xl md:text-2xl uppercase italic text-foreground text-center">
                   Muchos de Nuestros Productos
                 </h2>
             </div>
             <CategoryCarousel
               products={products.slice(0, 15)} // Show first 15 mixed products
               categorySlug="all"
               getTagsForProduct={getTagsForProduct}
               direction="left"
             />
          </AnimatedSection>
        )}

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
              <Link to="/products?tag=destacado" className="text-sm text-price-yellow hover:underline flex items-center gap-1">
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
              <CategoryCarousel 
                products={destacadosProducts}
                categorySlug="destacados"
                getTagsForProduct={getTagsForProduct}
                direction="right"
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay productos destacados aún</p>
            )}
          </div>
        </AnimatedSection>
        
        {/* New Section: Product Access */}
        <ProductAccessSection />

        {/* Trust Badges - Moved here as requested */}
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

        {/* Banner 1: Felices Fiestas - Moved here */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="py-8"
        >
          <TopHeroImageStrips />
        </motion.div>

        {/* Category Sections - Static grids for tecnologia/accesorios, Carousel for ropa */}
        {!loading && !tagsLoading && products.length > 0 && (() => {
          // Exclude categories that are already shown as static grids or special sections if any
          // The user complained about duplicates ("antiguas"). 
          // We previously rendered 'tecnologia', 'accesorios', 'ropa' here.
          // If the user says they are "antiguas" and wants them removed, we should probably remove this whole block 
          // OR verify if they are indeed duplicates of something else.
          // Looking at the code, we have:
          // 1. Marketing Cards Grid (Top/Nuevos/Ofertas/Elegante)
          // 2. Category Quick Access (Shein Style Circles)
          // 3. CategoryCarousel for "all" (Muchos de Nuestros Productos)
          // 4. Christmas Banner
          // 5. Productos Destacados
          // 6. Product Access Section
          // 7. Trust Badges
          // 8. TopHeroImageStrips
          // 9. THIS BLOCK -> Dynamic Category Sections
          
          // If the user sees duplicates, it might be because "Tecnología" and "Ropa" are already covered 
          // by the "Shein Style Circles" or just they don't want these specific sections at the bottom.
          // User directive: "ELIMINALAS PARA SIEMPRE".
          // So I will remove this map block entirely.
          
          return null;
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
