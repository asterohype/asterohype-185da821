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
      <div className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-price-yellow/50 transition-all duration-300">
        {/* Image - Square */}
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
          className="absolute bottom-20 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg h-8 w-8"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
        </Button>

        {/* Info inside card */}
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-foreground line-clamp-2 leading-tight group-hover:text-price-yellow transition-colors duration-300 text-sm">
            {node.title}
          </h3>
          <p className="text-price-yellow font-bold text-base">
            {formatPrice(price.amount, price.currencyCode)}
          </p>
        </div>
      </div>
    </Link>
  );
}
