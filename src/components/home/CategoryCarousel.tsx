import { useMemo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Zap } from "lucide-react";

interface CategoryCarouselProps {
  products: ShopifyProduct[];
  categorySlug: string;
  getTagsForProduct: (productId: string) => any[];
  direction?: "left" | "right";
}

import { Star } from "lucide-react";

function ProductImageSquare({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="aspect-square overflow-hidden relative bg-secondary/20">
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  );
}

function ProductCard({ product, categorySlug }: { product: ShopifyProduct; categorySlug: string }) {
  const { data: overrides } = useProductOverrides();
  const { data: productOffer } = useProductOffer(product.node.id);

  const override = overrides?.find((o) => o.shopify_product_id === product.node.id);
  const displayTitle = override?.title || product.node.title;
  const displayPrice = override?.price
    ? {
        amount: override.price.toString(),
        currencyCode: product.node.priceRange.minVariantPrice.currencyCode,
      }
    : product.node.priceRange.minVariantPrice;

  // Static badge for Featured Products as requested
  const isFeatured = categorySlug === 'destacados'; 

  return (
    <Link to={`/product/${product.node.handle}`} className="block h-full">
      <div className="relative rounded-xl overflow-hidden border border-white/10 hover:border-price-yellow/50 transition-all h-full bg-[#0a0a0a] hover:scale-[1.03] duration-300 group">
        
        {/* Featured Badge - Top Left */}
        {isFeatured && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-price-yellow text-black shadow-lg">
            <Star className="h-3 w-3 fill-black" />
            DESTACADO
          </div>
        )}

        {/* Tags - Top Right (Mockup based on user image style) */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
           <span className="bg-white/90 text-black text-[9px] px-2 py-0.5 rounded-full font-medium">
             {product.node.productType || 'Producto'}
           </span>
        </div>

        <ProductImageSquare src={product.node.images.edges[0]?.node.url} alt={displayTitle} />

        <div className="p-3">
          <h3 className="text-sm font-bold line-clamp-2 text-white mb-1 leading-tight group-hover:text-price-yellow transition-colors">
            {displayTitle.toUpperCase()}
          </h3>
          <p className="text-[10px] text-gray-400 mb-2 line-clamp-1">
            {override?.subtitle || product.node.description.substring(0, 30)}
          </p>
          <span className="text-price-yellow font-bold text-lg">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CategoryCarousel({ products, categorySlug, direction = "right" }: CategoryCarouselProps) {
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      const id = p.node.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [products]);
  if (uniqueProducts.length === 0) return null;

  // Repeat products to avoid "empty track" when a category has few items
  const trackProducts = useMemo(() => {
    const base = uniqueProducts.length > 0 ? uniqueProducts : [];
    if (base.length === 0) return [];

    // Ensure one "half" of the marquee is wider than the viewport, otherwise you will see black gaps.
    const minCards = 20;
    const targetLen = Math.max(minCards, base.length * 3);
    const repeated = Array.from({ length: targetLen }, (_, i) => base[i % base.length]);

    // Duplicate for seamless infinite scroll
    return [...repeated, ...repeated];
  }, [uniqueProducts]);

  const marqueeClass = direction === "left" ? "astro-marquee-left" : "astro-marquee-right";

  return (
    <section className="relative overflow-hidden py-6" aria-label={`Carrusel de ${categorySlug}`}>
      <style>{`
        @keyframes astroMarqueeLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes astroMarqueeRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .astro-marquee-left { animation: astroMarqueeLeft 60s linear infinite; }
        .astro-marquee-right { animation: astroMarqueeRight 60s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .astro-marquee-left, .astro-marquee-right { animation: none !important; transform: none !important; }
        }
      `}</style>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div className={`flex gap-4 w-max ${marqueeClass} will-change-transform`}>
        {trackProducts.map((p, i) => (
          <div key={`${p.node.id}-${i}`} className="w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0">
            <ProductCard product={p} categorySlug={categorySlug} />
          </div>
        ))}
      </div>
    </section>
  );
}
