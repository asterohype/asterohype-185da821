import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct } from "@/lib/shopify";

interface FeaturedImageMarqueeProps {
  products: ShopifyProduct[];
  direction?: "left" | "right";
}

function FeaturedImageCard({ product }: { product: ShopifyProduct }) {
  const image = product.node.images.edges[0]?.node;
  
  return (
    <Link to={`/product/${product.node.handle}`} className="block h-full group">
      <div className="relative aspect-[3/4] md:aspect-square overflow-hidden rounded-xl border border-white/5 hover:border-price-yellow/50 transition-all duration-300">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
        
        {image ? (
          <img 
            src={image.url} 
            alt={image.altText || product.node.title} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-secondary/20 flex items-center justify-center text-muted-foreground text-xs">
            Sin imagen
          </div>
        )}

        {/* Optional: Title on hover overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-end justify-center">
            <span className="text-white text-sm font-bold uppercase tracking-wider text-center drop-shadow-md">
                {product.node.title}
            </span>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedImageMarquee({ products, direction = "right" }: FeaturedImageMarqueeProps) {
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

  // Duplicate logic for smooth scrolling
  const trackProducts = useMemo(() => {
    const base = uniqueProducts.length > 0 ? uniqueProducts : [];
    if (base.length === 0) return [];

    const minCards = 15;
    const targetLen = Math.max(minCards, base.length * 3);
    const repeated = Array.from({ length: targetLen }, (_, i) => base[i % base.length]);

    return [...repeated, ...repeated];
  }, [uniqueProducts]);

  // Split into two rows for visual interest
  const row1 = trackProducts.filter((_, i) => i % 2 === 0);
  const row2 = trackProducts.filter((_, i) => i % 2 !== 0);

  return (
    <section className="relative overflow-hidden py-6 space-y-4" aria-label="Productos Destacados">
      <style>{`
        @keyframes astroMarqueeImgLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes astroMarqueeImgRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .astro-marquee-img-left { animation: astroMarqueeImgLeft 80s linear infinite; }
        .astro-marquee-img-right { animation: astroMarqueeImgRight 80s linear infinite; }
        .astro-marquee-img-left:hover, .astro-marquee-img-right:hover { animation-play-state: paused; }
      `}</style>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Row 1: Right direction (or default) */}
      <div className={`flex gap-4 w-max astro-marquee-img-right will-change-transform`}>
        {row1.map((p, i) => (
          <div key={`${p.node.id}-${i}-r1`} className="w-[160px] md:w-[220px] flex-shrink-0">
            <FeaturedImageCard product={p} />
          </div>
        ))}
      </div>

      {/* Row 2: Left direction (opposite) */}
      <div className={`flex gap-4 w-max astro-marquee-img-left will-change-transform`}>
        {row2.map((p, i) => (
          <div key={`${p.node.id}-${i}-r2`} className="w-[160px] md:w-[220px] flex-shrink-0">
            <FeaturedImageCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
