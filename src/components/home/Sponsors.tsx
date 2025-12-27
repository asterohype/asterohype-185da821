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
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-center mb-12">Nuestros Sponsors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {sponsors.map((sponsor) => (
            <div key={sponsor.name} className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
              <img src={sponsor.logo} alt={sponsor.name} className="h-16 object-contain mb-4" />
              <h3 className="text-xl font-semibold mb-4">{sponsor.name}</h3>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={sponsor.telegram} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4 mr-2" />
                    Telegram
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={sponsor.tiktok} target="_blank" rel="noopener noreferrer">
                    <Music2 className="h-4 w-4 mr-2" />
                    TikTok
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}