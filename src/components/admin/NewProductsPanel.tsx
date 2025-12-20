import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useProductEditStatuses } from "@/hooks/useProductEditStatus";
import { Loader2, Package, Check, Circle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewProductsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProductsPanel({ open, onOpenChange }: NewProductsPanelProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: editStatuses } = useProductEditStatuses();

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(250);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    if (open) {
      loadProducts();
    }
  }, [open]);

  // Get products that are incomplete (not all_done)
  const incompleteProducts = products.filter((product) => {
    const status = editStatuses?.find(s => s.shopify_product_id === product.node.id);
    // If no status exists or not all_done, it's incomplete
    return !status?.all_done;
  });

  // Products with no edit status at all (completely new)
  const completelyNewProducts = products.filter((product) => {
    const status = editStatuses?.find(s => s.shopify_product_id === product.node.id);
    return !status;
  });

  // Products with partial status
  const partiallyEditedProducts = incompleteProducts.filter((product) => {
    const status = editStatuses?.find(s => s.shopify_product_id === product.node.id);
    return status && !status.all_done;
  });

  const getStatusInfo = (productId: string) => {
    const status = editStatuses?.find(s => s.shopify_product_id === productId);
    if (!status) return { completed: 0, total: 9, fields: [] };
    
    const fields = [
      { key: 'title_done', label: 'Título', done: status.title_done },
      { key: 'price_done', label: 'Precio', done: status.price_done },
      { key: 'about_done', label: 'Acerca de', done: status.about_done },
      { key: 'description_done', label: 'Descripción', done: status.description_done },
      { key: 'model_done', label: 'Modelo', done: status.model_done },
      { key: 'color_done', label: 'Color', done: status.color_done },
      { key: 'tags_done', label: 'Etiquetas', done: status.tags_done },
      { key: 'offers_done', label: 'Ofertas', done: status.offers_done },
      { key: 'images_done', label: 'Imágenes', done: status.images_done },
    ];
    
    const completed = fields.filter(f => f.done).length;
    return { completed, total: 9, fields };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-price-yellow" />
            Productos Nuevos / Pendientes
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{completelyNewProducts.length}</p>
            <p className="text-xs text-muted-foreground">Sin editar</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{partiallyEditedProducts.length}</p>
            <p className="text-xs text-muted-foreground">Parcialmente editados</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{products.length - incompleteProducts.length}</p>
            <p className="text-xs text-muted-foreground">Completados</p>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : incompleteProducts.length === 0 ? (
            <div className="text-center py-20">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">¡Todos los productos están completos!</p>
              <p className="text-sm text-muted-foreground">No hay productos pendientes de editar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Completely new products first */}
              {completelyNewProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-red-400" />
                    Sin editar ({completelyNewProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {completelyNewProducts.slice(0, 20).map((product) => (
                      <ProductRow key={product.node.id} product={product} statusInfo={getStatusInfo(product.node.id)} isNew />
                    ))}
                    {completelyNewProducts.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{completelyNewProducts.length - 20} más productos sin editar
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Partially edited products */}
              {partiallyEditedProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-amber-400" />
                    Parcialmente editados ({partiallyEditedProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {partiallyEditedProducts.map((product) => (
                      <ProductRow key={product.node.id} product={product} statusInfo={getStatusInfo(product.node.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({ 
  product, 
  statusInfo,
  isNew = false 
}: { 
  product: ShopifyProduct; 
  statusInfo: { completed: number; total: number; fields: { key: string; label: string; done: boolean }[] };
  isNew?: boolean;
}) {
  const progressPercent = (statusInfo.completed / statusInfo.total) * 100;
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-secondary/50 ${
      isNew ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'
    }`}>
      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        {product.node.images.edges[0]?.node.url ? (
          <img 
            src={product.node.images.edges[0].node.url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.node.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[120px]">
            <div 
              className={`h-full rounded-full ${isNew ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {statusInfo.completed}/{statusInfo.total}
          </span>
        </div>
        {/* Show incomplete fields */}
        {!isNew && statusInfo.fields.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {statusInfo.fields.filter(f => !f.done).slice(0, 4).map((field) => (
              <span key={field.key} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {field.label}
              </span>
            ))}
            {statusInfo.fields.filter(f => !f.done).length > 4 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                +{statusInfo.fields.filter(f => !f.done).length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <Link to={`/product/${product.node.handle}`}>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <ExternalLink className="h-3 w-3" />
          Editar
        </Button>
      </Link>
    </div>
  );
}
