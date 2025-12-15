import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

// Keywords mapping for better category filtering
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "tech": ["phone case", "leather texture phone", "cable", "charger", "cargador", "auricular", "earphone", "headphone", "watch", "reloj", "smart", "electronic", "gadget", "speaker", "altavoz", "power bank", "bateria", "usb", "bluetooth"],
  "accesorios": ["phone case", "leather texture phone", "case", "funda", "carcasa", "protector", "cable", "strap", "correa", "holder", "soporte"],
  "home": ["desk", "escritorio", "lamp", "lámpara", "chair", "silla", "table", "mesa", "home", "hogar", "kitchen", "cocina", "decoration", "decoración", "furniture", "mueble", "organizer", "storage", "shelf"],
  "ropa": ["coat", "chaqueta", "jacket", "shirt", "camiseta", "pants", "pantalón", "dress", "vestido", "boots", "botas", "shoes", "zapatos", "slippers", "zapatillas", "sweater", "suéter", "hoodie", "cotton", "winter", "warm", "clothing", "wear", "fashion"],
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
          const keywords = CATEGORY_KEYWORDS[categoryFilter];
          
          filtered = data.filter((product) => {
            const titleLower = product.node.title?.toLowerCase() || "";
            const descLower = product.node.description?.toLowerCase() || "";
            const productType = product.node.productType?.toLowerCase() || "";
            const tags = product.node.tags?.map(t => t.toLowerCase()) || [];
            
            // Check if any keyword matches
            return keywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase()) ||
              descLower.includes(keyword.toLowerCase()) ||
              productType.includes(keyword.toLowerCase()) ||
              tags.some(tag => tag.includes(keyword.toLowerCase()))
            );
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
