import { Link } from "react-router-dom";
import { ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductTag } from "@/hooks/useProductTags";

interface CategorySectionProps {
  title: string;
  products: ShopifyProduct[];
  tagSlug?: string;
  getTagsForProduct?: (productId: string) => ProductTag[];
}

export function CategorySection({ title, products, tagSlug, getTagsForProduct }: CategorySectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div className="animate-fade-up">
            <h2 className="text-2xl md:text-3xl font-display uppercase italic text-foreground tracking-wide">
              {title}
            </h2>
            <div className="w-16 h-1 bg-price-yellow mt-3 rounded-full" />
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto group">
            <Link to={tagSlug ? `/products?tag=${tagSlug}` : "/products"}>
              Ver Todo
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product, index) => (
            <div 
              key={product.node.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard 
                product={product} 
                tags={getTagsForProduct ? getTagsForProduct(product.node.id) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}