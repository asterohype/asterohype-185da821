import logoCiolinks from "@/assets/logo-ciolinks.png";
import logoLinksrz from "@/assets/logo-linksrz.png";
import { Send, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopifyProduct } from "@/lib/shopify";
interface SponsorsProps {
  products?: ShopifyProduct[];
}
export function Sponsors({
  products = []
}: SponsorsProps) {
  const sponsors = [{
    name: "CioLinks",
    logo: logoCiolinks,
    telegram: "https://t.me/Ciolinks",
    tiktok: "https://www.tiktok.com/@ciolinks"
  }, {
    name: "LinksRZ",
    logo: logoLinksrz,
    telegram: "https://t.me/linksrzofficial",
    tiktok: "https://www.tiktok.com/@linksrz1"
  }];

  // Get diverse products for display
  const diverseProducts = products.slice(0, 8);
  return <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-light text-foreground mb-2">
            ​Mas productos:   
          </h2>
          <p className="text-muted-foreground text-sm">
            Las marcas detrás de AsteroHype
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Owner boxes - Left side */}
          

          {/* Products - Right side */}
          {diverseProducts.length > 0 && <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {diverseProducts.map(product => <ProductCard key={product.node.id} product={product} />)}
              </div>
            </div>}
        </div>
      </div>
    </section>;
}