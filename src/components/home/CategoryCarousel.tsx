import { useMemo, useEffect, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Star, Zap } from "lucide-react";

interface CategoryCarouselProps {
  products: ShopifyProduct[];
  categorySlug: string;
  getTagsForProduct: (productId: string) => any[];
  direction?: "left" | "right";
}

const ASPECT_CATEGORIES = new Set(["tecnologia", "accesorios"]);

const ProductImage916 = forwardRef<
  HTMLDivElement,
  {
    src?: string;
    alt: string;
    mode: "cover" | "contain-filled";
  }
>(function ProductImage916({ src, alt, mode }, ref) {
  return (
    <div ref={ref} className="aspect-[9/16] overflow-hidden relative bg-secondary/30">
      {mode === "contain-filled" && src ? (
        <>
          {/* Fondo: cover SIN blur para evitar bandas grises/blancas */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110 opacity-90"
            loading="lazy"
          />
          {/* Imagen real: intacta (sin recorte) */}
          <img
            src={src}
            alt={alt}
            className="relative z-10 w-full h-full object-contain"
            loading="lazy"
          />
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
    </div>
  );
});

function SmallCard({ product, imageMode }: { product: ShopifyProduct; imageMode: "cover" | "contain-filled" }) {
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
      <div className="relative rounded-xl overflow-hidden border border-border/40 hover:border-price-yellow/50 transition-colors h-full bg-card/50">
        {hasOffer && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
            <Zap className="h-3 w-3" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        <ProductImage916 src={product.node.images.edges[0]?.node.url} alt={displayTitle} mode={imageMode} />

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

function HighlightedCard({
  product,
  imageMode,
}: {
  product: ShopifyProduct;
  imageMode: "cover" | "contain-filled";
}) {
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
  const originalPrice = productOffer?.original_price;

  return (
    <Link to={`/product/${product.node.handle}`} className="block w-full h-full">
      <div className="relative h-full rounded-3xl overflow-hidden border-4 border-price-yellow bg-card shadow-[0_0_50px_hsl(var(--primary)/0.18)]">
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold shadow-lg bg-price-yellow text-primary-foreground">
          <Star className="h-4 w-4" />
          DESTACADO
        </div>

        {hasOffer && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg bg-destructive text-destructive-foreground">
            <Zap className="h-4 w-4" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        <ProductImage916 src={product.node.images.edges[0]?.node.url} alt={displayTitle} mode={imageMode} />

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

  const imageMode: "cover" | "contain-filled" = ASPECT_CATEGORIES.has(categorySlug) ? "contain-filled" : "cover";

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Slow cadence to feel like scroll (no pop-up)
  useEffect(() => {
    if (uniqueProducts.length === 0) return;

    const t = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % uniqueProducts.length);
    }, 8000);

    return () => clearInterval(t);
  }, [uniqueProducts.length]);

  if (uniqueProducts.length === 0) return null;

  const highlightedProduct = uniqueProducts[highlightedIndex];

  // Continuous marquee behind
  const trackProducts = useMemo(() => {
    const base = uniqueProducts.length > 0 ? uniqueProducts : [];
    return [...base, ...base];
  }, [uniqueProducts]);

  const marqueeClass = direction === "left" ? "astro-marquee-left" : "astro-marquee-right";

  return (
    <section className="relative overflow-hidden py-8" aria-label={`Carrusel de ${categorySlug}`}>
      <style>{`
        @keyframes astroMarqueeLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes astroMarqueeRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .astro-marquee-left { animation: astroMarqueeLeft 55s linear infinite; }
        .astro-marquee-right { animation: astroMarqueeRight 55s linear infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      {/* moving track */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 opacity-55">
        <div className="w-[200%]">
          <div className={`flex gap-4 ${marqueeClass}`}>
            {trackProducts.map((p, i) => (
              <div key={`${p.node.id}-${i}`} className="w-[160px] md:w-[180px] lg:w-[200px] flex-shrink-0">
                <SmallCard product={p} imageMode={imageMode} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* center highlight */}
      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-[380px] lg:max-w-[420px] h-[500px] md:h-[550px] lg:h-[600px]">
          <HighlightedCard product={highlightedProduct} imageMode={imageMode} />
        </div>
      </div>
    </section>
  );
}
