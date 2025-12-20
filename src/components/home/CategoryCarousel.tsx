import { useMemo, useEffect, useState, useCallback } from "react";
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

// Individual product card (smaller, scrolls behind)
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

  return (
    <Link to={`/product/${product.node.handle}`} className="block h-full">
      <div className="relative rounded-xl overflow-hidden border border-border/30 hover:border-price-yellow/50 transition-all h-full bg-card/50">
        {hasOffer && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
            <Zap className="h-3 w-3" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}
        <div className="aspect-[9/16] overflow-hidden bg-secondary/30">
          <img
            src={product.node.images.edges[0]?.node.url}
            alt={displayTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium line-clamp-2 text-foreground mb-1">{displayTitle}</h3>
          <span className="text-price-yellow font-bold text-lg">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Highlighted center card with animations
function HighlightedCard({
  product,
  categorySlug,
  isEntering,
}: {
  product: ShopifyProduct | null;
  categorySlug: string;
  isEntering: boolean;
}) {
  const { data: overrides } = useProductOverrides();
  const { data: productOffer } = useProductOffer(product?.node.id || "");

  if (!product) return null;

  const override = overrides?.find((o) => o.shopify_product_id === product.node.id);
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
      className={`block w-full h-full transition-all duration-700 ${
        isEntering ? "animate-scale-in" : ""
      }`}
    >
      {/* Card with golden rounded border */}
      <div className="relative h-full rounded-3xl overflow-hidden border-4 border-price-yellow shadow-[0_0_50px_hsl(var(--primary)/0.4)] bg-card">
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

        {/* Image with zoom effect */}
        <div className="aspect-[9/16] overflow-hidden bg-secondary/30 relative">
          <img
            src={product.node.images.edges[0]?.node.url}
            alt={displayTitle}
            className={`w-full h-full object-cover transition-transform duration-1000 ${
              isEntering ? "scale-110" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Info overlay */}
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

  // Track current highlighted index
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isEntering, setIsEntering] = useState(true);

  // Animation interval - change product every 4 seconds
  useEffect(() => {
    if (uniqueProducts.length === 0) return;

    const interval = setInterval(() => {
      setIsEntering(true);
      setHighlightedIndex((prev) => (prev + 1) % uniqueProducts.length);
      
      // Reset entering animation after it plays
      const timeout = setTimeout(() => setIsEntering(false), 700);
      return () => clearTimeout(timeout);
    }, 4000);

    return () => clearInterval(interval);
  }, [uniqueProducts.length]);

  if (uniqueProducts.length === 0) return null;

  const highlightedProduct = uniqueProducts[highlightedIndex] || null;
  
  // Products for the sides (excluding the highlighted one)
  const sideProducts = useMemo(() => {
    return uniqueProducts.filter((_, i) => i !== highlightedIndex);
  }, [uniqueProducts, highlightedIndex]);

  return (
    <div className="relative overflow-hidden py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-stretch gap-4 h-[500px] md:h-[550px] lg:h-[600px]">
          {/* Left side products (scrolling) */}
          <div className="hidden md:flex flex-col gap-3 w-[180px] lg:w-[220px] overflow-hidden">
            {sideProducts.slice(0, 2).map((product, idx) => (
              <div key={`left-${product.node.id}`} className="flex-1 opacity-60 hover:opacity-100 transition-opacity">
                <CarouselProductCard product={product} categorySlug={categorySlug} />
              </div>
            ))}
          </div>

          {/* Center highlighted card - static position */}
          <div className="flex-1 max-w-[380px] lg:max-w-[420px] mx-auto">
            <HighlightedCard 
              product={highlightedProduct} 
              categorySlug={categorySlug}
              isEntering={isEntering}
            />
          </div>

          {/* Right side products (scrolling) */}
          <div className="hidden md:flex flex-col gap-3 w-[180px] lg:w-[220px] overflow-hidden">
            {sideProducts.slice(2, 4).map((product, idx) => (
              <div key={`right-${product.node.id}`} className="flex-1 opacity-60 hover:opacity-100 transition-opacity">
                <CarouselProductCard product={product} categorySlug={categorySlug} />
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {uniqueProducts.slice(0, 8).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsEntering(true);
                setHighlightedIndex(idx);
                setTimeout(() => setIsEntering(false), 700);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === highlightedIndex 
                  ? "w-6 bg-price-yellow" 
                  : "bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
