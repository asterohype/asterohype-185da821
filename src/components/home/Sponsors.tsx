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
  return;
}