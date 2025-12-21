import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductTag } from "@/hooks/useProductTags";
import { useProductOverrides } from "@/hooks/useProductOverrides";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminModeStore } from "@/stores/adminModeStore";

interface ProductCardProps {
  product: ShopifyProduct;
  tags?: ProductTag[];
  showFeaturedBadge?: boolean;
}

export function ProductCard({ product, tags, showFeaturedBadge }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { node } = product;

  // Admin mode (only admins should see manual price overrides)
  const { isAdmin } = useAdmin();
  const { isAdminModeActive } = useAdminModeStore();
  const showOverridePrice = isAdmin && isAdminModeActive;

  // Get overrides from backend
  const { data: overrides } = useProductOverrides();
  const override = overrides?.find((o) => o.shopify_product_id === node.id);

  const imageUrl = node.images.edges[0]?.node.url;
  const firstVariant = node.variants.edges[0]?.node;

  // Prefer el precio del primer variant (modelo por defecto) para que coincida con Shopify
  const basePrice = firstVariant?.price ?? node.priceRange.minVariantPrice;

  // Apply overrides if they exist. Price override ONLY if price_enabled is true AND admin mode.
  const displayTitle = override?.title || node.title;
  const displayPrice = (showOverridePrice && override?.price !== null && override?.price !== undefined && override?.price_enabled !== false)
    ? { amount: override.price.toString(), currencyCode: basePrice.currencyCode }
    : basePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) return;

    addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions,
    });

    toast.success("Añadido al carrito", {
      description: displayTitle,
      action: {
        label: "Ver Carrito",
        onClick: () => setCartOpen(true),
      },
    });
  };

  return (
    <Link 
      to={`/product/${node.handle}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-price-yellow/50 transition-all duration-300">
        {/* Featured Badge */}
        {showFeaturedBadge && (
          <div className="absolute top-2 left-2 z-10 bg-price-yellow text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
            ★ DESTACADO
          </div>
        )}
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 justify-end max-w-[60%]">
            {tags.slice(0, 2).map(tag => (
              <span 
                key={tag.id}
                className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-2 py-0.5 rounded-full border border-border/50"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Image - Square */}
        <div className="aspect-square overflow-hidden bg-secondary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.images.edges[0]?.node.altText || displayTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Quick add button */}
        <Button
          variant="hero"
          size="icon"
          className="absolute bottom-20 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg h-8 w-8"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
        </Button>

        {/* Info inside card */}
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-foreground line-clamp-2 leading-tight group-hover:text-price-yellow transition-colors duration-300 text-sm">
            {displayTitle}
          </h3>
          {override?.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {override.subtitle}
            </p>
          )}
          <p className="text-price-yellow font-bold text-base">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
          </p>
        </div>
      </div>
    </Link>
  );
}
