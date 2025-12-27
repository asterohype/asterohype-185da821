import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Loader2, Mail } from "lucide-react";

interface StockNotificationFormProps {
  shopifyProductId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
}

export function StockNotificationForm({
  shopifyProductId,
  variantId,
  productTitle,
  variantTitle,
}: StockNotificationFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("stock_notifications").insert({
        email,
        shopify_product_id: shopifyProductId,
        variant_id: variantId,
        product_title: productTitle,
        variant_title: variantTitle,
        status: 'pending'
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("¡Te avisaremos!", {
        description: "Recibirás un email cuando haya stock disponible.",
      });
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("Error al guardar tu solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full py-4 px-6 rounded-xl bg-secondary/50 border border-border text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
            <Bell className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-foreground">¡Aviso guardado!</h3>
          <p className="text-sm text-muted-foreground">
            Te enviaremos un correo a <strong>{email}</strong> en cuanto esté disponible.
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
          >
            Avisar a otro correo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 text-amber-600 mb-1">
        <Bell className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium">Producto agotado temporalmente</span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Tu email para avisarte"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 bg-background"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Avísame cuando haya stock
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground text-center">
        No te enviaremos spam, solo un aviso cuando vuelva.
      </p>
    </div>
  );
}
