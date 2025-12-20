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

function ProductImage916({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="aspect-[9/16] overflow-hidden relative bg-card">
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-overlay/80 via-overlay/20 to-transparent" />
    </div>
  );
}

function ProductCard({ product }: { product: ShopifyProduct }) {
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

  const hasOffer = productOffer?.offer_active || productOffer?.discount_percent;
  const discountPercent = productOffer?.discount_percent;

  return (
    <Link to={`/product/${product.node.handle}`} className="block h-full">
      <div className="relative rounded-xl overflow-hidden border border-border/40 hover:border-price-yellow/50 transition-all h-full bg-card hover:scale-[1.03] duration-300">
        {hasOffer && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
            <Zap className="h-3 w-3" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        <ProductImage916 src={product.node.images.edges[0]?.node.url} alt={displayTitle} />

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

    const minCards = 14; // enough to fill wide screens + seamless loop
    const repeats = Math.max(2, Math.ceil(minCards / base.length));
    const repeated = Array.from({ length: repeats }, (_, i) => base[i % base.length]);

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
        .astro-marquee-left:hover, .astro-marquee-right:hover { animation-play-state: paused; }
      `}</style>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div className="w-[200%]">
      <div className={`flex gap-4 ${marqueeClass}`}>
          {trackProducts.map((p, i) => (
            <div key={`${p.node.id}-${i}`} className="w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
