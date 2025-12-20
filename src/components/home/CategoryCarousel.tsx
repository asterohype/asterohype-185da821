import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Zap } from "lucide-react";

interface CategoryCarouselProps {
  products: ShopifyProduct[];
  categorySlug: string;
  getTagsForProduct: (productId: string) => any[];
}

// Individual product card in carousel - MUCH LARGER
function CarouselProductCard({
  product,
  isHighlighted,
  categorySlug,
}: {
  product: ShopifyProduct;
  isHighlighted: boolean;
  categorySlug: string;
}) {
  const { data: overrides } = useProductOverrides();
  const { data: productOffer } = useProductOffer(product.node.id);
  
  const override = overrides?.find(o => o.shopify_product_id === product.node.id);
  const displayTitle = override?.title || product.node.title;
  const displayPrice = override?.price 
    ? { amount: override.price.toString(), currencyCode: product.node.priceRange.minVariantPrice.currencyCode }
    : product.node.priceRange.minVariantPrice;

  const hasOffer = productOffer?.offer_active || productOffer?.discount_percent;
  const discountPercent = productOffer?.discount_percent;
  const originalPrice = productOffer?.original_price;

  return (
    <Link
      to={`/product/${product.node.handle}`}
      className={`carousel-card flex-shrink-0 relative group transition-all duration-500 ${
        isHighlighted 
          ? 'scale-[1.08] z-20' 
          : 'hover:scale-[1.03]'
      }`}
    >
      {/* Card container with tall aspect ratio - LARGER SIZE */}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-500 h-full ${
        isHighlighted 
          ? 'border-price-yellow shadow-[0_0_40px_hsl(var(--primary)/0.5)]' 
          : hasOffer 
            ? 'border-red-500/50 hover:border-red-500' 
            : 'border-border/30 hover:border-price-yellow/50'
      }`}>
        {/* Offer Badge - Prominent if highlighted or has offer */}
        {(hasOffer || isHighlighted) && (
          <div className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
            hasOffer ? 'bg-red-500 text-white' : 'bg-price-yellow text-black'
          }`}>
            <Zap className="h-4 w-4" />
            {discountPercent ? `-${discountPercent}%` : 'OFERTA'}
          </div>
        )}

        {/* Image - 9:16 aspect ratio (tall) */}
        <div className="aspect-[9/16] overflow-hidden bg-secondary/30 relative">
          {/* For Tecnología/Accesorios we must NOT crop: show full image (contain) with a blurred backdrop */}
          {(categorySlug === 'tecnologia' || categorySlug === 'accesorios') && product.node.images.edges[0]?.node.url ? (
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
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Info overlay at bottom - Larger text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className={`font-bold line-clamp-2 mb-3 transition-all duration-300 ${
            isHighlighted ? 'text-price-yellow text-lg' : 'text-foreground text-base'
          }`}>
            {displayTitle}
          </h3>
          
          {/* Price section - Much bigger when highlighted */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-black text-price-yellow transition-all duration-300 ${
              isHighlighted ? 'text-3xl' : hasOffer ? 'text-2xl' : 'text-xl'
            }`}>
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

export function CategoryCarousel({ products, categorySlug }: CategoryCarouselProps) {
  // De-duplicate by product id to avoid repeats inside a section
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      const id = p.node.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [products]);

  // Duplicate products for infinite loop effect
  const duplicatedProducts = useMemo(() => {
    if (uniqueProducts.length === 0) return [];
    // Triple the products for seamless infinite scroll
    return [...uniqueProducts, ...uniqueProducts, ...uniqueProducts];
  }, [uniqueProducts]);

  // Highlight the center product (middle of the visible area)
  const highlightIndex = uniqueProducts.length; // Start of second set is the "center"

  if (uniqueProducts.length === 0) return null;

  // Faster by default (user feedback: was too slow)
  const animationDuration = Math.max(uniqueProducts.length * 2, 12); // Minimum 12s

  return (
    <div className="relative overflow-hidden py-8">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

      {/* CSS Infinite Scroll Container */}
      <div
        className="carousel-scroll-container flex gap-6 px-12"
        style={{
          animation: `scroll-left ${animationDuration}s linear infinite`,
          width: 'max-content',
        }}
      >
        {duplicatedProducts.map((product, index) => {
          const isHighlighted = index === highlightIndex; // only ONE highlighted

          return (
            <div key={`${product.node.id}-${index}`} className="w-[280px] md:w-[320px] lg:w-[340px]">
              <CarouselProductCard product={product} isHighlighted={isHighlighted} categorySlug={categorySlug} />
            </div>
          );
        })}
      </div>

      {/* CSS Keyframes injected via style tag */}
      <style>{`
        @keyframes scroll-left {
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
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-${uniqueProducts.length} * (280px + 24px)));
            }
          }
        }
      `}</style>
    </div>
  );
}