import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductOffer } from "@/hooks/useProductOffers";
import { Zap } from "lucide-react";

interface CategoryStaticGridProps {
  products: ShopifyProduct[];
  categorySlug: string;
  maxProducts?: number;
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
    <Link to={`/product/${product.node.handle}`} className="block h-full group">
      <div className="relative rounded-xl overflow-hidden border border-border/40 hover:border-price-yellow/50 transition-all h-full bg-card">
        {hasOffer && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
            <Zap className="h-2.5 w-2.5" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        <div className="aspect-[3/4] overflow-hidden relative bg-secondary/30">
          <img 
            src={product.node.images.edges[0]?.node.url} 
            alt={displayTitle} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            loading="lazy" 
          />
        </div>

        <div className="p-3">
          <h3 className="text-xs md:text-sm font-medium line-clamp-2 text-foreground mb-1 uppercase">
            {displayTitle}
          </h3>
          <span className="text-price-yellow font-bold text-sm md:text-base">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CategoryStaticGrid({ products, categorySlug, maxProducts = 7 }: CategoryStaticGridProps) {
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      const id = p.node.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, maxProducts);
  }, [products, maxProducts]);

  if (uniqueProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-4" aria-label={`Grid de ${categorySlug}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
        {uniqueProducts.map((p) => (
          <ProductCard key={p.node.id} product={p} />
        ))}
      </div>
    </section>
  );
}
