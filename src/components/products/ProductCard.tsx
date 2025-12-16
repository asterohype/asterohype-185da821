import { Link } from "react-router-dom";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { node } = product;

  const imageUrl = node.images.edges[0]?.node.url;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;

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

    toast.success("Added to cart", {
      description: node.title,
      action: {
        label: "View Cart",
        onClick: () => setCartOpen(true),
      },
    });
  };

  return (
    <Link 
      to={`/product/${node.handle}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border hover-lift">
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-secondary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.images.edges[0]?.node.altText || node.title}
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
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-display text-foreground italic uppercase line-clamp-2 leading-tight group-hover:text-title-blue transition-colors duration-300 text-sm tracking-wide">
          {node.title}
        </h3>
        <p className="text-price-yellow font-semibold text-sm">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      </div>
    </Link>
  );
}
