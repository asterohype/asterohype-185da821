import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductTag } from "@/hooks/useProductTags";
import { useProductOverrides, splitTitle } from "@/hooks/useProductOverrides";

interface ProductCardProps {
  product: ShopifyProduct;
  tags?: ProductTag[];
  showFeaturedBadge?: boolean;
}

export function ProductCard({ product, tags, showFeaturedBadge }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { node } = product;

  // Get overrides from backend (for separator only now)
  const { data: overrides } = useProductOverrides();
  const override = overrides?.find((o) => o.shopify_product_id === node.id);

  const imageUrl = node.images.edges[0]?.node.url;
  const firstVariant = node.variants.edges[0]?.node;

  // Price always comes from Shopify variant
  const basePrice = firstVariant?.price ?? node.priceRange.minVariantPrice;

  // Title/subtitle from Shopify title split by separator
  const { title: displayTitle, subtitle: displaySubtitle } = splitTitle(
    node.title,
    override?.title_separator || null
  );
  
  // Price is always from Shopify
  const displayPrice = basePrice;

  // Extract color values if available
  const colorOption = node.options?.find(opt => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'color');
  const colorValues = colorOption?.values.slice(0, 4) || [];

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
        <div className="aspect-square overflow-hidden bg-secondary relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.images.edges[0]?.node.altText || displayTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground absolute inset-0">
              No image
            </div>
          )}
        </div>

        {/* Quick add button */}
        <Button
          variant="default"
          size="icon"
          className="absolute bottom-20 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg h-8 w-8 bg-price-yellow text-background hover:bg-price-yellow/90"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
        </Button>

        {/* Info inside card */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <div>
            <h3 className="font-medium text-foreground line-clamp-1 leading-tight group-hover:text-price-yellow transition-colors duration-300 text-sm">
              {displayTitle}
            </h3>
            {displaySubtitle && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {displaySubtitle}
              </p>
            )}
          </div>

          {/* Stars (Placeholder if no reviews, or use real data if available via prop - simplifying for now) */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-yellow-400 text-[10px]">★</span>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">(0)</span>
          </div>

          {/* Price */}
          <p className="text-price-yellow font-bold text-sm">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
          </p>

          {/* Color Swatches */}
          {colorValues.length > 0 && (
            <div className="flex gap-1">
              {colorValues.map((color, idx) => (
                <div 
                  key={idx}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color.toLowerCase() }} // Basic color mapping, might need real hex codes
                  title={color}
                />
              ))}
              {colorOption && colorOption.values.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{colorOption.values.length - 4}</span>
              )}
            </div>
          )}

          {/* Quick View Button - Mobile optimized */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full h-8 text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground gap-2"
            onClick={(e) => {
              e.preventDefault(); // Prevent link navigation
              // Logic for quick view or just cart
              handleAddToCart(e);
            }}
          >
            <ShoppingBag className="w-3 h-3" />
            Agregar al Carrito
          </Button>
        </div>
      </div>
    </Link>
  );
}
