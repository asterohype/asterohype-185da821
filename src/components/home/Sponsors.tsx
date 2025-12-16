import logoCiolinks from "@/assets/logo-ciolinks.png";
import logoLinksrz from "@/assets/logo-linksrz.png";
import { Send, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopifyProduct } from "@/lib/shopify";

interface SponsorsProps {
  products?: ShopifyProduct[];
}

export function Sponsors({ products = [] }: SponsorsProps) {
  const sponsors = [
    {
      name: "CioLinks",
      logo: logoCiolinks,
      telegram: "https://t.me/Ciolinks",
      tiktok: "https://www.tiktok.com/@ciolinks",
    },
    {
      name: "LinksRZ",
      logo: logoLinksrz,
      telegram: "https://t.me/linksrzofficial",
      tiktok: "https://www.tiktok.com/@linksrz1",
    },
  ];

  // Get diverse products for display
  const diverseProducts = products.slice(0, 8);

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-light text-foreground mb-2">
            Nuestros Dueños
          </h2>
          <p className="text-muted-foreground text-sm">
            Las marcas detrás de AsteroHype
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Owner boxes - Left side */}
          <div className="flex flex-col gap-4 lg:w-64 flex-shrink-0">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="bg-card border border-border/50 rounded-xl p-4 hover:border-price-yellow/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
                    <img
                      src={sponsor.logo}
                      alt={`Logo de ${sponsor.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-foreground text-sm">{sponsor.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs flex-1 h-8"
                    asChild
                  >
                    <a href={sponsor.telegram} target="_blank" rel="noopener noreferrer">
                      <Send className="h-3 w-3" />
                      Telegram
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs flex-1 h-8"
                    asChild
                  >
                    <a href={sponsor.tiktok} target="_blank" rel="noopener noreferrer">
                      <Music2 className="h-3 w-3" />
                      TikTok
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Products - Right side */}
          {diverseProducts.length > 0 && (
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {diverseProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
