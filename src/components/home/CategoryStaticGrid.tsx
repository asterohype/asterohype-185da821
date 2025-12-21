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
      <div className="relative overflow-hidden transition-all h-full bg-card rounded-2xl hover:shadow-lg hover:shadow-price-yellow/10">
        {hasOffer && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
            <Zap className="h-2.5 w-2.5" />
            {discountPercent ? `-${discountPercent}%` : "OFERTA"}
          </div>
        )}

        <div className="aspect-square overflow-hidden relative bg-secondary/20 rounded-2xl">
          <img 
            src={product.node.images.edges[0]?.node.url} 
            alt={displayTitle} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-3" 
            loading="lazy" 
          />
        </div>

        <div className="p-3 text-center">
          <h3 className="text-sm font-medium line-clamp-2 text-foreground mb-1">
            {displayTitle}
          </h3>
          <span className="text-price-yellow font-bold text-base">
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
      <div className="flex flex-wrap justify-center gap-5 md:gap-8">
        {uniqueProducts.map((p, idx) => (
          <div 
            key={p.node.id} 
            className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] animate-fade-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
