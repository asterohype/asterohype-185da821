import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, Link2, TrendingUp, Package, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProductCosts, ProductCost } from '@/hooks/useProductCosts';
import { formatPrice } from '@/lib/shopify';

interface CJProductData {
  productId: string;
  productName: string;
  sku: string;
  sellPrice: number;
  productImage: string;
  productWeight: number;
  categoryName: string;
  variants: Array<{
    vid: string;
    variantSku: string;
    variantNameEn: string;
    variantPrice: number;
    variantWeight: number;
  }>;
}

interface ProductCostManagerProps {
  shopifyProductId: string;
  productTitle: string;
  sellingPrice: number;
  currencyCode: string;
}

export function ProductCostManager({ 
  shopifyProductId, 
  productTitle, 
  sellingPrice,
  currencyCode 
}: ProductCostManagerProps) {
  const { getCostForProduct, saveCost, calculateProfit, refetch } = useProductCosts();
  const [cjProductId, setCjProductId] = useState('');
  const [productCostValue, setProductCostValue] = useState('');
  const [shippingCostValue, setShippingCostValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCJ, setFetchingCJ] = useState(false);
  const [cjData, setCjData] = useState<CJProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const costData = getCostForProduct(shopifyProductId);
  const { totalCost, profit, profitMargin } = calculateProfit(sellingPrice, costData);

  // Load existing data
  useEffect(() => {
    if (costData) {
      setProductCostValue(costData.product_cost.toString());
      setShippingCostValue(costData.shipping_cost.toString());
      // Extract CJ Product ID from notes if exists
      if (costData.notes) {
        try {
          const parsed = JSON.parse(costData.notes);
          if (parsed.cj_product_id) {
            setCjProductId(parsed.cj_product_id);
          }
        } catch {
          // Notes is not JSON, might be plain text
        }
      }
    }
  }, [costData]);

  // Fetch from existing cj_product_id if available
  useEffect(() => {
    const fetchCjProductId = async () => {
      const { data } = await supabase
        .from('product_costs')
        .select('cj_product_id')
        .eq('shopify_product_id', shopifyProductId.replace('gid://shopify/Product/', ''))
        .maybeSingle();
      
      if (data?.cj_product_id) {
        setCjProductId(data.cj_product_id);
      }
    };
    fetchCjProductId();
  }, [shopifyProductId]);

  const fetchCJCosts = async () => {
    if (!cjProductId.trim()) {
      setError('Ingresa un CJ Product ID');
      return;
    }

    setFetchingCJ(true);
    setError(null);
    
    try {
      // Fetch product data
      const { data, error: fnError } = await supabase.functions.invoke('cj-product-cost', {
        body: { cjProductId: cjProductId.trim() }
      });

      if (fnError) throw fnError;
      
      if (!data.success) {
        setError(data.error || 'Producto no encontrado en CJ');
        return;
      }

      setCjData(data.product);
      
      // Auto-fill the product cost from CJ
      if (data.product.sellPrice) {
        setProductCostValue(data.product.sellPrice.toString());
      }

      // Fetch shipping cost using first variant
      if (data.product.variants && data.product.variants.length > 0) {
        const firstVariant = data.product.variants[0];
        
        const { data: freightData, error: freightError } = await supabase.functions.invoke('cj-freight', {
          body: { 
            vid: firstVariant.vid, 
            quantity: 1, 
            destCountry: 'ES' // España por defecto
          }
        });

        if (!freightError && freightData?.success && freightData.cheapestOption) {
          const shippingCost = freightData.cheapestOption.logisticPrice;
          setShippingCostValue(shippingCost.toString());
          toast.success(`Producto: $${data.product.sellPrice} + Envío: $${shippingCost} (${freightData.cheapestOption.logisticName})`);
        } else {
          toast.success('Datos de producto obtenidos (envío no disponible)');
        }
      } else {
        toast.success('Datos de CJ obtenidos correctamente');
      }
    } catch (err) {
      console.error('Error fetching CJ data:', err);
      setError('Error al conectar con CJ');
    } finally {
      setFetchingCJ(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const productCost = parseFloat(productCostValue) || 0;
      const shippingCost = parseFloat(shippingCostValue) || 0;
      
      await saveCost(shopifyProductId, productCost, shippingCost, JSON.stringify({
        cj_product_id: cjProductId,
        cj_data: cjData
      }));

      // Also update the cj_product_id column
      const normalizedId = shopifyProductId.replace('gid://shopify/Product/', '');
      await supabase
        .from('product_costs')
        .update({ cj_product_id: cjProductId || null })
        .eq('shopify_product_id', normalizedId);

      toast.success('Costes guardados');
      refetch();
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const syncFromCJ = async () => {
    if (!cjProductId) {
      toast.error('Primero asigna un CJ Product ID');
      return;
    }
    await fetchCJCosts();
    if (cjData) {
      await handleSave();
    }
  };

  const newProfit = sellingPrice - (parseFloat(productCostValue) || 0) - (parseFloat(shippingCostValue) || 0);
  const newMargin = sellingPrice > 0 ? (newProfit / sellingPrice) * 100 : 0;

  return (
    <div className="bg-secondary/20 rounded-lg p-4 space-y-4 border border-border/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-price-yellow" />
          Gestión de Costes
        </h4>
        {costData && (
          <Badge variant={profitMargin >= 30 ? 'default' : profitMargin >= 15 ? 'secondary' : 'destructive'}>
            {profitMargin.toFixed(1)}% margen
          </Badge>
        )}
      </div>

      {/* CJ Product ID */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          CJ Product ID
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: 1000123456789"
            value={cjProductId}
            onChange={(e) => setCjProductId(e.target.value)}
            className="text-sm h-9"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCJCosts}
            disabled={fetchingCJ || !cjProductId.trim()}
            className="h-9 px-3"
          >
            {fetchingCJ ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      {/* CJ Data Preview */}
      {cjData && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            ✓ Vinculado a CJ
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {cjData.productName}
          </p>
          <p className="text-xs text-muted-foreground">
            SKU: {cjData.sku} | Coste CJ: ${cjData.sellPrice}
          </p>
        </div>
      )}

      {/* Cost Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            Coste Producto (€)
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productCostValue}
            onChange={(e) => setProductCostValue(e.target.value)}
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Coste Envío (€)
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={shippingCostValue}
            onChange={(e) => setShippingCostValue(e.target.value)}
            className="text-sm h-9"
          />
        </div>
      </div>

      {/* Profit Preview */}
      <div className="bg-background/50 rounded-lg p-3 border border-border/30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Venta</p>
            <p className="text-sm font-semibold text-price-yellow">
              {formatPrice(sellingPrice.toString(), currencyCode)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Coste Total</p>
            <p className="text-sm font-semibold text-foreground">
              €{((parseFloat(productCostValue) || 0) + (parseFloat(shippingCostValue) || 0)).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Beneficio</p>
            <p className={`text-sm font-bold flex items-center justify-center gap-1 ${newProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className="h-3 w-3" />
              €{newProfit.toFixed(2)}
              <span className="text-[10px] font-normal">({newMargin.toFixed(0)}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Costes
        </Button>
        {cjProductId && (
          <Button
            size="sm"
            variant="outline"
            onClick={syncFromCJ}
            disabled={fetchingCJ}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${fetchingCJ ? 'animate-spin' : ''}`} />
            Sync CJ
          </Button>
        )}
      </div>
    </div>
  );
}
