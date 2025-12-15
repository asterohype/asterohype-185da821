import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Minus, Plus, Trash2, CreditCard, Loader2, Sparkles, Package } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";

export function CartDrawer() {
  const { 
    items, 
    isLoading, 
    isOpen,
    updateQuantity, 
    removeItem, 
    createCheckout,
    setOpen,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const currency = items[0]?.price.currencyCode || 'EUR';

  const handleCheckout = async () => {
    try {
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        setOpen(false);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background border-l border-border/50">
        <SheetHeader className="flex-shrink-0 pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-price-yellow/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-price-yellow" />
            </div>
            <div>
              <span className="font-display uppercase italic tracking-wide">Tu Carrito</span>
              <p className="text-sm font-normal text-muted-foreground">
                {totalItems === 0 ? "Vacío" : `${totalItems} artículo${totalItems !== 1 ? 's' : ''}`}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-medium text-lg">Tu carrito está vacío</p>
                <p className="text-muted-foreground text-sm mt-1">Añade productos para comenzar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable items area */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-3 scrollbar-hide">
                {items.map((item, index) => (
                  <div 
                    key={item.variantId} 
                    className="flex gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-price-yellow/30 transition-all duration-300 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-20 h-20 bg-secondary rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {item.product.node.images?.edges?.[0]?.node && (
                        <img
                          src={item.product.node.images.edges[0].node.url}
                          alt={item.product.node.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm leading-tight line-clamp-2 group-hover:text-price-yellow transition-colors duration-300">
                        {item.product.node.title}
                      </h4>
                      {item.selectedOptions.length > 0 && item.selectedOptions[0].value !== "Default Title" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.selectedOptions.map(option => option.value).join(' / ')}
                        </p>
                      )}
                      <p className="font-bold text-price-yellow mt-2">
                        {formatPrice(item.price.amount, item.price.currencyCode)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        className="h-7 w-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors duration-300"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      
                      <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
                        <button
                          className="h-7 w-7 rounded-lg hover:bg-background flex items-center justify-center transition-colors"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                        <button
                          className="h-7 w-7 rounded-lg hover:bg-background flex items-center justify-center transition-colors"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Fixed checkout section */}
              <div className="flex-shrink-0 space-y-4 pt-6 border-t border-border/50 mt-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">
                    {formatPrice(totalPrice.toString(), currency)}
                  </span>
                </div>
                
                {/* Shipping notice */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-price-yellow/10 border border-price-yellow/20">
                  <Package className="h-4 w-4 text-price-yellow flex-shrink-0" />
                  <span className="text-xs text-price-yellow">Envío gratis en pedidos +50€</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-price-yellow">
                    {formatPrice(totalPrice.toString(), currency)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full h-14 rounded-2xl bg-price-yellow hover:bg-price-yellow/90 text-background font-bold text-base shadow-lg shadow-price-yellow/25 hover:shadow-xl hover:shadow-price-yellow/30 transition-all duration-300" 
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Pago seguro con encriptación SSL
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
