import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Zap, Tag } from "lucide-react";

interface CategoryCarouselProps {
  products: ShopifyProduct[];
  categorySlug: string;
  getTagsForProduct: (productId: string) => any[];
}

// Individual product card in carousel
function CarouselProductCard({ 
  product, 
  index,
  isHighlighted 
}: { 
  product: ShopifyProduct; 
  index: number;
  isHighlighted: boolean;
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
      className={`flex-shrink-0 relative group transition-all duration-500 ${
        isHighlighted 
          ? 'scale-105 z-10' 
          : 'hover:scale-[1.02]'
      }`}
      style={{ width: '200px' }}
    >
      {/* Card container with 9:16-ish aspect ratio */}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isHighlighted 
          ? 'border-price-yellow shadow-lg shadow-price-yellow/30' 
          : hasOffer 
            ? 'border-red-500/50 hover:border-red-500' 
            : 'border-border/50 hover:border-price-yellow/50'
      }`}>
        {/* Offer Badge - Prominent if highlighted or has offer */}
        {(hasOffer || isHighlighted) && (
          <div className={`absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            hasOffer ? 'bg-red-500 text-white' : 'bg-price-yellow text-black'
          }`}>
            <Zap className="h-3 w-3" />
            {discountPercent ? `-${discountPercent}%` : 'OFERTA'}
          </div>
        )}

        {/* Image - Tall aspect ratio */}
        <div className="aspect-[3/4] overflow-hidden bg-secondary/30">
          <img 
            src={product.node.images.edges[0]?.node.url} 
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </div>

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 via-background/80 to-transparent">
          <h3 className={`font-semibold line-clamp-2 mb-2 transition-colors ${
            isHighlighted ? 'text-price-yellow' : 'text-foreground'
          }`} style={{ fontSize: isHighlighted ? '1rem' : '0.875rem' }}>
            {displayTitle}
          </h3>
          
          {/* Price section - Bigger when highlighted or has offer */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-bold text-price-yellow ${
              isHighlighted || hasOffer ? 'text-xl' : 'text-lg'
            }`}>
              {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
            </span>
            {hasOffer && originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice.toString(), displayPrice.currencyCode)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CategoryCarousel({ products, categorySlug, getTagsForProduct }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollRef.current || products.length === 0 || isPaused) return;

    const container = scrollRef.current;
    const scrollSpeed = 0.5; // pixels per frame - slow and smooth
    let animationId: number;
    let lastTime = 0;

    const scroll = (currentTime: number) => {
      if (lastTime === 0) lastTime = currentTime;
      const delta = currentTime - lastTime;
      
      if (delta > 16) { // ~60fps
        container.scrollLeft += scrollSpeed * (delta / 16);
        
        // Loop back to start when reaching end
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
          container.scrollLeft = 0;
        }
        
        // Update highlighted index based on scroll position
        const cardWidth = 216; // 200px + gap
        const currentIndex = Math.floor(container.scrollLeft / cardWidth) % products.length;
        setHighlightedIndex(currentIndex);
        
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [products.length, isPaused]);

  // Rotate highlight every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex(prev => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-8 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <CarouselProductCard 
            key={product.node.id}
            product={product}
            index={index}
            isHighlighted={index === highlightedIndex}
          />
        ))}
        {/* Duplicate for infinite scroll effect */}
        {products.slice(0, 3).map((product, index) => (
          <CarouselProductCard 
            key={`dup-${product.node.id}`}
            product={product}
            index={products.length + index}
            isHighlighted={false}
          />
        ))}
      </div>
    </div>
  );
}
