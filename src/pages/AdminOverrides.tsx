import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductOverrides, ProductOverride } from "@/hooks/useProductOverrides";
import { useAdmin } from "@/hooks/useAdmin";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Loader2, Search, DollarSign, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminOverrides() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { data: overrides, isLoading: overridesLoading, refetch } = useProductOverrides();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(250);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-price-yellow" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Filter overrides that have a price set
  const overridesWithPrice = (overrides || []).filter(o => o.price !== null);

  // Match overrides with products
  const overridesWithProducts = overridesWithPrice
    .map(override => {
      const product = products.find(p => p.node.id === override.shopify_product_id);
      return { override, product };
    })
    .filter(item => {
      if (!item.product) return false;
      if (searchQuery === "") return true;
      return item.product.node.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleTogglePriceEnabled = async (override: ProductOverride) => {
    setUpdatingId(override.shopify_product_id);
    try {
      const newValue = !override.price_enabled;
      const { error } = await supabase
        .from("product_overrides")
        .update({ price_enabled: newValue })
        .eq("shopify_product_id", override.shopify_product_id);
      
      if (error) throw error;
      
      await refetch();
      toast.success(newValue ? "Precio override activado" : "Precio override desactivado (usará Shopify)");
    } catch (error) {
      console.error("Error toggling price_enabled:", error);
      toast.error("Error al cambiar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-display uppercase italic text-foreground">
              Gestionar <span className="text-price-yellow">Override de Precios</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Activa o desactiva el precio personalizado para cada producto. Cuando está desactivado, se muestra el precio real de Shopify.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos con override..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {overridesLoading || productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : overridesWithProducts.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay productos con override de precio</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Cuando edites un precio en el detalle de producto, aparecerá aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overridesWithProducts.map(({ override, product }) => {
                if (!product) return null;
                const isUpdating = updatingId === override.shopify_product_id;
                const shopifyPrice = product.node.variants.edges[0]?.node.price || product.node.priceRange.minVariantPrice;
                
                return (
                  <div
                    key={override.id}
                    className={`flex items-center gap-4 p-4 bg-card border rounded-xl transition-colors ${
                      override.price_enabled ? "border-price-yellow/50" : "border-border opacity-60"
                    }`}
                  >
                    {/* Image */}
                    <img
                      src={product.node.images.edges[0]?.node.url}
                      alt={product.node.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {override.title || product.node.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-muted-foreground">
                          Shopify: <span className="text-foreground">{formatPrice(shopifyPrice.amount, shopifyPrice.currencyCode)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Override: <span className="text-price-yellow font-semibold">{formatPrice(override.price?.toString() || "0", shopifyPrice.currencyCode)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {override.price_enabled ? (
                          <span className="flex items-center gap-1 text-price-yellow">
                            <Eye className="h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Desactivado
                          </span>
                        )}
                      </span>
                      <Switch
                        checked={override.price_enabled}
                        onCheckedChange={() => handleTogglePriceEnabled(override)}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
