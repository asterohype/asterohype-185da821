import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

// Keywords mapping for STRICT category filtering - each category has EXCLUSIVE keywords
const CATEGORY_KEYWORDS: Record<string, { include: string[], exclude: string[] }> = {
  "tech": {
    include: ["secador", "hair dryer", "cepillo", "brush", "electronic", "gadget", "speaker", "altavoz", "power bank", "bluetooth", "smart watch", "auricular", "earphone", "headphone"],
    exclude: ["phone case", "funda", "carcasa", "coat", "jacket", "boots", "slippers", "desk", "table"]
  },
  "accesorios": {
    include: ["phone case", "leather texture phone", "funda", "carcasa", "protector", "cable", "charger", "cargador"],
    exclude: ["coat", "jacket", "boots", "desk", "table", "slippers"]
  },
  "home": {
    include: ["desk", "escritorio", "lamp", "lámpara", "table", "mesa", "slippers", "zapatillas casa", "linen slippers", "home", "hogar", "kitchen", "cocina", "decoration", "furniture", "organizer", "storage", "shelf"],
    exclude: ["phone case", "coat", "jacket", "boots", "secador"]
  },
  "ropa": {
    include: ["coat", "chaqueta", "jacket", "shirt", "camiseta", "pants", "pantalón", "dress", "vestido", "boots", "botas", "shoes", "zapatos", "sweater", "suéter", "hoodie", "cotton boots", "winter coat", "stand collar"],
    exclude: ["phone case", "desk", "table", "slippers", "secador", "lamp"]
  },
};

interface CategorySectionProps {
  title: string;
  categoryFilter?: string;
  limit?: number;
}

export function CategorySection({ title, categoryFilter, limit = 4 }: CategorySectionProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(50);
        let filtered = data;
        
        if (categoryFilter && CATEGORY_KEYWORDS[categoryFilter]) {
          const { include, exclude } = CATEGORY_KEYWORDS[categoryFilter];
          
          filtered = data.filter((product) => {
            const titleLower = product.node.title?.toLowerCase() || "";
            const searchText = titleLower;
            
            // Check if product matches ANY include keyword
            const hasInclude = include.some(keyword => 
              searchText.includes(keyword.toLowerCase())
            );
            
            // Check if product matches ANY exclude keyword
            const hasExclude = exclude.some(keyword => 
              searchText.includes(keyword.toLowerCase())
            );
            
            // Must match include AND not match exclude
            return hasInclude && !hasExclude;
          });
        }
        
        setProducts(filtered.slice(0, limit));
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, limit]);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

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
            <Link to="/products">
              Ver Todo
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div 
              key={product.node.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
