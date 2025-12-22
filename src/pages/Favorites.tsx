import { useFavoritesStore } from "@/stores/favoritesStore";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchModal } from "@/components/search/SearchModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, ShopifyProduct } from "@/lib/shopify";

export default function Favorites() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["favorites-products", favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const query = `
        query getProductsByIds($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              description
              handle
              productType
              tags
              images(first: 2) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              options {
                name
                values
              }
            }
          }
        }
      `;

      const response = await storefrontApiRequest(query, { ids: favorites });

      // Map nodes to ShopifyProduct format
      const nodes = (response.data?.nodes || []).filter(Boolean);
      return nodes.map((node: ShopifyProduct['node']) => ({ node })) as ShopifyProduct[];
    },
    enabled: favorites.length > 0,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-32 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
            <h1 className="text-3xl font-display uppercase italic">
              Mis Favoritos
            </h1>
            {favorites.length > 0 && (
              <span className="text-muted-foreground">({favorites.length})</span>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No tienes favoritos aún</h2>
              <p className="text-muted-foreground">
                Explora nuestra tienda y guarda tus productos favoritos
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: favorites.length }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.node.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <MobileNavBar
        onSearchClick={() => setIsSearchOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <SearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />

      <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />

      <CartDrawer />
    </div>
  );
}
