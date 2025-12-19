import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, fetchProducts, formatPrice, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "@/components/products/ProductCard";
import { useAdmin } from "@/hooks/useAdmin";
import { useProductTags, ProductTag } from "@/hooks/useProductTags";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Minus, Plus, ShoppingBag, Check, Truck, Shield, RotateCcw, Tag } from "lucide-react";

const FADE_MS = 280;
const AUTOSLIDE_MS = 2200;

const TAG_GROUPS = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [autoSlide, setAutoSlide] = useState(true);
  const [savingTag, setSavingTag] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  
  const { isAdmin } = useAdmin();
  const { tags, getTagsForProduct, getTagsByGroup, assignTag, removeTag } = useProductTags();

  useEffect(() => {
    async function loadProduct() {
      if (!handle) return;
      try {
        const data = await fetchProductByHandle(handle);
        setProduct(data);
        // Initialize selected options with first values
        if (data?.options) {
          const initialOptions: Record<string, string> = {};
          data.options.forEach((option) => {
            if (option.values.length > 0) {
              initialOptions[option.name] = option.values[0];
            }
          });
          setSelectedOptions(initialOptions);
        }
        
        // Fetch related products
        const allProducts = await fetchProducts(20);
        // Filter to show products that are not the current one
        const related = allProducts
          .filter((p) => p.node.handle !== handle)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [handle]);

  // Find selected variant
  const selectedVariant = product?.variants.edges.find((v) => {
    return v.node.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    );
  })?.node;

  // Find matching image based on selected color/variant
  const matchingImageIndex = useMemo(() => {
    if (!product) return 0;
    
    // Look for color option
    const colorOption = selectedOptions["Color"] || selectedOptions["color"] || selectedOptions["Colour"];
    if (!colorOption) return selectedImage;

    // Try to find an image that matches the color in alt text
    const matchIndex = product.images.edges.findIndex((img) => {
      const altText = img.node.altText?.toLowerCase() || "";
      return altText.includes(colorOption.toLowerCase());
    });

    return matchIndex >= 0 ? matchIndex : selectedImage;
  }, [product, selectedOptions, selectedImage]);

  // Update selected image when variant changes
  useEffect(() => {
    if (matchingImageIndex !== selectedImage) {
      setSelectedImage(matchingImageIndex);
    }
  }, [matchingImageIndex]);

  // Preload images for smooth/fast transitions
  useEffect(() => {
    if (!product) return;
    const urls = product.images.edges.map((e) => e.node.url).filter(Boolean);
    urls.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, [product]);

  // Auto-slide images (fast + clean)
  useEffect(() => {
    if (!product || !autoSlide || product.images.edges.length <= 1) return;

    const timer = window.setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % product.images.edges.length);
    }, AUTOSLIDE_MS);

    return () => window.clearInterval(timer);
  }, [product, autoSlide]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions,
    });

    toast.success("Añadido al carrito", {
      description: `${product.title} × ${quantity}`,
      action: {
        label: "Ver Carrito",
        onClick: () => setCartOpen(true),
      },
    });
  };

  const handleToggleTag = async (tag: ProductTag) => {
    if (!product) return;
    setSavingTag(true);
    const currentTags = getTagsForProduct(product.id);
    const hasTag = currentTags.some(t => t.id === tag.id);
    
    try {
      if (hasTag) {
        await removeTag(product.id, tag.id);
        toast.success(`Etiqueta "${tag.name}" eliminada`);
      } else {
        await assignTag(product.id, tag.id);
        toast.success(`Etiqueta "${tag.name}" añadida`);
      }
    } catch (error) {
      toast.error('Error al actualizar etiqueta');
    } finally {
      setSavingTag(false);
    }
  };

  const tagsByGroup = getTagsByGroup();
  const productTags = product ? getTagsForProduct(product.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-xl text-muted-foreground mb-4">Producto no encontrado</p>
          <Button asChild variant="outline">
            <Link to="/products">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a Productos
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images.edges;
  const price = selectedVariant?.price || product.priceRange.minVariantPrice;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300 mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Volver a Productos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div className="space-y-4 animate-fade-up">
              {/* Main Image (fade carousel) */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border relative">
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <img
                      key={img.node.url}
                      src={img.node.url}
                      alt={img.node.altText || product.title}
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-out ${
                        idx === selectedImage ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ transitionDuration: `${FADE_MS}ms` }}
                    />
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Thumbnails - Auto-sliding with manual control */}
              {images.length > 1 && (
                <div 
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                  onMouseEnter={() => setAutoSlide(false)}
                  onMouseLeave={() => setAutoSlide(true)}
                >
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setAutoSlide(false);
                        window.setTimeout(() => setAutoSlide(true), 10000);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? "border-price-yellow shadow-lg shadow-price-yellow/20 scale-105"
                          : "border-border/50 hover:border-muted-foreground opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.node.url}
                        alt={img.node.altText || `${product.title} ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-36 lg:self-start space-y-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <div>
                <h1 className="text-2xl md:text-3xl font-display italic uppercase text-foreground mb-3 tracking-wide">
                  {product.title}
                </h1>
                <p className="text-2xl md:text-3xl font-bold text-price-yellow">
                  {formatPrice(price.amount, price.currencyCode)}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Admin Tag Editor */}
              {isAdmin && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium text-sm">Gestionar Etiquetas (Admin)</span>
                    {savingTag && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                  <div className="space-y-2">
                    {TAG_GROUPS.map(group => {
                      const groupTags = tagsByGroup[group] || [];
                      if (groupTags.length === 0) return null;
                      
                      return (
                        <div key={group} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 w-24 flex-shrink-0">
                            {group}:
                          </span>
                          {groupTags.map(tag => {
                            const isSelected = productTags.some(t => t.id === tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleToggleTag(tag)}
                                disabled={savingTag}
                                className={`
                                  text-xs px-3 py-1.5 rounded-full font-medium transition-all shadow-sm
                                  ${isSelected 
                                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 shadow-amber-200/50 dark:from-amber-800/60 dark:to-orange-800/50 dark:text-amber-50 dark:border-amber-600' 
                                    : 'bg-white/80 text-stone-600 border border-stone-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:text-amber-800 hover:border-amber-200 hover:shadow-md dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-700 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 dark:hover:text-amber-200 dark:hover:border-amber-700'
                                  }
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                              >
                                {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options */}
              {product.options.map((option) => (
                <div key={option.name}>
                  <h3 className="font-medium text-foreground mb-3">
                    {option.name}: <span className="text-price-yellow">{selectedOptions[option.name]}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleOptionChange(option.name, value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                          selectedOptions[option.name] === value
                            ? "bg-price-yellow text-background shadow-lg shadow-price-yellow/30"
                            : "bg-secondary text-foreground hover:bg-secondary/80 hover:scale-105"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Cantidad</h3>
                <div className="inline-flex items-center gap-1 bg-secondary rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-background transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-foreground">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-background transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <Button
                  onClick={handleAddToCart}
                  variant="hero"
                  size="xl"
                  className="w-full group"
                  disabled={!selectedVariant?.availableForSale}
                >
                  <ShoppingBag className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                  {selectedVariant?.availableForSale
                    ? "Añadir al Carrito"
                    : "Agotado"}
                </Button>

                {/* Features */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    Envío Gratis
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    30 Días Devolución
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    Pago Seguro
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20 pt-16 border-t border-border">
              <h2 className="text-2xl md:text-3xl font-display italic uppercase text-foreground mb-8">
                También te puede gustar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
