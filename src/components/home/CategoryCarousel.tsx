import { useMemo, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Zap, Star } from "lucide-react";

interface CategoryCarouselProps {
  products: ShopifyProduct[];
  categorySlug: string;
  getTagsForProduct: (productId: string) => any[];
}

// Individual product card in carousel
function CarouselProductCard({
  product,
  categorySlug,
}: {
  product: ShopifyProduct;
  categorySlug: string;
}) {
  const { data: overrides } = useProductOverrides();
  const { data: productOffer } = useProductOffer(product.node.id);

  const override = overrides?.find((o) => o.shopify_product_id === product.node.id);
  const displayTitle = override?.title || product.node.title;
  const displayPrice = override?.price
    ? { amount: override.price.toString(), currencyCode: product.node.priceRange.minVariantPrice.currencyCode }
    : product.node.priceRange.minVariantPrice;

  const hasOffer = productOffer?.offer_active || productOffer?.discount_percent;
  const discountPercent = productOffer?.discount_percent;
  const originalPrice = productOffer?.original_price;

  return (
    <Link to={`/product/${product.node.handle}`} className="carousel-card flex-shrink-0 relative group transition-all duration-500 hover:scale-[1.02]">
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-500 h-full ${
        hasOffer ? "border-red-500/50 hover:border-red-500" : "border-border/30 hover:border-price-yellow/50"
      }`}>
        {/* Offer Badge */}
        {hasOffer && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg bg-red-500 text-white">
            <Zap className="h-4 w-4" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        {/* Image - 9:16 aspect ratio */}
        <div className="aspect-[9/16] overflow-hidden bg-secondary/30 relative">
          {(categorySlug === "tecnologia" || categorySlug === "accesorios") && product.node.images.edges[0]?.node.url ? (
            <>
              <img
                src={product.node.images.edges[0]?.node.url}
                alt={displayTitle}
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-70"
                aria-hidden="true"
                loading="lazy"
              />
              <img
                src={product.node.images.edges[0]?.node.url}
                alt={displayTitle}
                className="relative z-[1] w-full h-full object-contain"
                loading="lazy"
              />
            </>
          ) : (
            <img
              src={product.node.images.edges[0]?.node.url}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-bold line-clamp-2 mb-3 text-foreground text-base">{displayTitle}</h3>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-black text-price-yellow ${hasOffer ? "text-2xl" : "text-xl"}`}>
              {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
            </span>
            {hasOffer && originalPrice && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(originalPrice.toString(), displayPrice.currencyCode)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Highlighted center card overlay (static, products scroll behind)
function HighlightedCardOverlay({
  currentProduct,
  categorySlug,
}: {
  currentProduct: ShopifyProduct | null;
  categorySlug: string;
}) {
  const { data: overrides } = useProductOverrides();
  const { data: productOffer } = useProductOffer(currentProduct?.node.id || "");

  if (!currentProduct) return null;

  const override = overrides?.find((o) => o.shopify_product_id === currentProduct.node.id);
  const displayTitle = override?.title || currentProduct.node.title;
  const displayPrice = override?.price
    ? { amount: override.price.toString(), currencyCode: currentProduct.node.priceRange.minVariantPrice.currencyCode }
    : currentProduct.node.priceRange.minVariantPrice;

  const hasOffer = productOffer?.offer_active || productOffer?.discount_percent;
  const discountPercent = productOffer?.discount_percent;
  const originalPrice = productOffer?.original_price;

  return (
    <Link
      to={`/product/${currentProduct.node.handle}`}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[300px] md:w-[360px] lg:w-[400px] pointer-events-auto"
    >
      <div className="relative rounded-3xl overflow-hidden border-4 border-price-yellow shadow-[0_0_60px_hsl(var(--primary)/0.6)] bg-card transition-all duration-500 animate-scale-in">
        {/* DESTACADO Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold shadow-lg bg-price-yellow text-black">
          <Star className="h-4 w-4 fill-black" />
          DESTACADO
        </div>

        {/* Offer Badge */}
        {hasOffer && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg bg-red-500 text-white">
            <Zap className="h-4 w-4" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        {/* Image */}
        <div className="aspect-[9/16] overflow-hidden bg-secondary/30 relative">
          {(categorySlug === "tecnologia" || categorySlug === "accesorios") && currentProduct.node.images.edges[0]?.node.url ? (
            <>
              <img
                src={currentProduct.node.images.edges[0]?.node.url}
                alt={displayTitle}
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-70"
                aria-hidden="true"
              />
              <img
                src={currentProduct.node.images.edges[0]?.node.url}
                alt={displayTitle}
                className="relative z-[1] w-full h-full object-contain"
              />
            </>
          ) : (
            <img
              src={currentProduct.node.images.edges[0]?.node.url}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        </div>

        {/* Info overlay - BIGGER */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="font-bold line-clamp-2 mb-3 text-price-yellow text-xl">{displayTitle}</h3>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-black text-price-yellow text-4xl">
              {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
            </span>
            {hasOffer && originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(originalPrice.toString(), displayPrice.currencyCode)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CategoryCarousel({ products, categorySlug }: CategoryCarouselProps) {
  // De-duplicate by product id
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      const id = p.node.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [products]);

  // For infinite scroll, we need more copies to ensure seamless loop
  const duplicatedProducts = useMemo(() => {
    if (uniqueProducts.length === 0) return [];
    // 5x for smooth infinite loop without gaps
    return [...uniqueProducts, ...uniqueProducts, ...uniqueProducts, ...uniqueProducts, ...uniqueProducts];
  }, [uniqueProducts]);

  // Track which product is currently highlighted (in the center)
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update highlighted index based on scroll position
  useEffect(() => {
    if (uniqueProducts.length === 0) return;

    // Calculate interval based on animation speed
    const cardWidth = 340 + 24; // card width + gap
    const animationDuration = Math.max(uniqueProducts.length * 8, 40); // SLOWER: 8s per product, min 40s
    const timePerCard = (animationDuration * 1000) / uniqueProducts.length;

    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % uniqueProducts.length);
    }, timePerCard);

    return () => clearInterval(interval);
  }, [uniqueProducts.length]);

  if (uniqueProducts.length === 0) return null;

  // SLOWER animation (user feedback: was too fast)
  const animationDuration = Math.max(uniqueProducts.length * 8, 40); // 8s per product, min 40s

  const highlightedProduct = uniqueProducts[highlightedIndex] || null;

  return (
    <div className="relative overflow-hidden py-8" style={{ minHeight: "600px" }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/90 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/90 to-transparent z-20 pointer-events-none" />

      {/* Scrolling products behind */}
      <div
        ref={scrollContainerRef}
        className="carousel-scroll-container flex gap-6 px-12"
        style={{
          animation: `scroll-left-${categorySlug} ${animationDuration}s linear infinite`,
          width: "max-content",
        }}
      >
        {duplicatedProducts.map((product, index) => (
          <div key={`${product.node.id}-${index}`} className="w-[260px] md:w-[300px] lg:w-[340px] opacity-60">
            <CarouselProductCard product={product} categorySlug={categorySlug} />
          </div>
        ))}
      </div>

      {/* Static highlighted card in center */}
      <HighlightedCardOverlay currentProduct={highlightedProduct} categorySlug={categorySlug} />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scroll-left-${categorySlug} {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-${uniqueProducts.length} * (340px + 24px)));
          }
        }

        .carousel-scroll-container:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          @keyframes scroll-left-${categorySlug} {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-${uniqueProducts.length} * (300px + 24px)));
            }
          }
        }

        @media (max-width: 640px) {
          @keyframes scroll-left-${categorySlug} {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-${uniqueProducts.length} * (260px + 24px)));
            }
          }
        }
      `}</style>
    </div>
  );
}
