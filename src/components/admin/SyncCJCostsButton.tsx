import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct } from '@/lib/shopify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SyncResult {
  shopifyId: string;
  shopifyTitle: string;
  matched: boolean;
  cjProductId?: string;
  cjName?: string;
  productCost?: number;
  shippingCost?: number;
  updated: boolean;
}

interface SyncCJCostsButtonProps {
  products: ShopifyProduct[];
  onSyncComplete?: () => void;
}

export function SyncCJCostsButton({ products, onSyncComplete }: SyncCJCostsButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    totalProducts: number;
    matchedCount: number;
    updatedCount: number;
    cjProductsAvailable: number;
    results: SyncResult[];
  } | null>(null);

  const handleSync = async () => {
    if (products.length === 0) {
      toast.error('No hay productos para sincronizar');
      return;
    }

    setSyncing(true);
    
    try {
      // Prepare products data for the edge function
      const shopifyProducts = products.map(p => ({
        id: p.node.id,
        title: p.node.title,
        handle: p.node.handle,
      }));

      const { data, error } = await supabase.functions.invoke('sync-cj-costs', {
        body: { shopifyProducts }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error en la sincronización');
      }

      setResults(data);
      setShowResults(true);
      
      toast.success(`Sincronización completada: ${data.matchedCount}/${data.totalProducts} productos vinculados`);
      onSyncComplete?.();
      
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Error al sincronizar costes de CJ');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSync}
        disabled={syncing || products.length === 0}
        variant="outline"
        className="gap-2"
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync Costes CJ
          </>
        )}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Sincronización Completada
            </DialogTitle>
            <DialogDescription>
              Resultados de la sincronización con CJ Dropshipping
            </DialogDescription>
          </DialogHeader>

          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{results.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Total Productos</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.matchedCount}</p>
                  <p className="text-xs text-muted-foreground">Vinculados</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{results.updatedCount}</p>
                  <p className="text-xs text-muted-foreground">Actualizados</p>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{results.cjProductsAvailable}</p>
                  <p className="text-xs text-muted-foreground">Productos CJ</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tasa de vinculación</span>
                  <span>{((results.matchedCount / results.totalProducts) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={(results.matchedCount / results.totalProducts) * 100} 
                  className="h-2"
                />
              </div>

              {/* Results list */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {results.results.map((r, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                        r.matched 
                          ? 'bg-green-500/5 border border-green-500/20' 
                          : 'bg-secondary/30 border border-border/30'
                      }`}
                    >
                      {r.matched ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-foreground">
                          {r.shopifyTitle}
                        </p>
                        {r.matched && (
                          <p className="text-xs text-muted-foreground truncate">
                            → {r.cjName}
                          </p>
                        )}
                      </div>
                      {r.matched && r.productCost !== undefined && (
                        <Badge variant="outline" className="flex-shrink-0">
                          €{(r.productCost + (r.shippingCost || 0)).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Help text for unmatched */}
              {results.matchedCount < results.totalProducts && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Los productos no vinculados pueden tener nombres diferentes en CJ. 
                    Puedes vincularlos manualmente usando el CJ Product ID en la sección de costes de cada producto.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
