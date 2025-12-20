import { Check, Circle, CheckCircle2 } from "lucide-react";
import { useProductEditStatus, useUpsertEditStatus } from "@/hooks/useProductEditStatus";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface EditStatusChecklistProps {
  shopifyProductId: string;
}

const FIELDS = [
  { key: 'title_done', label: 'Título' },
  { key: 'price_done', label: 'Precio' },
  { key: 'about_done', label: 'Acerca de' },
  { key: 'description_done', label: 'Descripción' },
  { key: 'model_done', label: 'Modelo' },
  { key: 'color_done', label: 'Color' },
  { key: 'tags_done', label: 'Etiquetas' },
  { key: 'offers_done', label: 'Ofertas' },
  { key: 'images_done', label: 'Imágenes' },
] as const;

export function EditStatusChecklist({ shopifyProductId }: EditStatusChecklistProps) {
  const { data: status, isLoading } = useProductEditStatus(shopifyProductId);
  const upsertStatus = useUpsertEditStatus();

  const handleToggle = async (field: typeof FIELDS[number]['key'], currentValue: boolean) => {
    try {
      await upsertStatus.mutateAsync({
        shopify_product_id: shopifyProductId,
        [field]: !currentValue,
      });
      toast.success(`${FIELDS.find(f => f.key === field)?.label} ${!currentValue ? 'completado' : 'desmarcado'}`);
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleMarkAllComplete = async () => {
    try {
      await upsertStatus.mutateAsync({
        shopify_product_id: shopifyProductId,
        title_done: true,
        price_done: true,
        about_done: true,
        description_done: true,
        model_done: true,
        color_done: true,
        tags_done: true,
        offers_done: true,
        images_done: true,
      });
      toast.success('¡Producto marcado como completo!');
    } catch (error) {
      toast.error('Error al marcar como completo');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-card/50 rounded-xl border border-border/50">
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-secondary/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const allDone = status?.all_done ?? false;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${allDone ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]' : 'bg-card/50 border-border/50'}`}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <span className="text-sm font-semibold text-foreground">Estado de Edición</span>
        <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${allDone ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : 'text-muted-foreground'}`}>
          {allDone ? (
            <>
              <Check className="h-4 w-4" />
              Completo ✓
            </>
          ) : (
            <>
              <Circle className="h-3 w-3" />
              Pendiente
            </>
          )}
        </div>
      </div>

      {/* Individual fields */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {FIELDS.map((field) => {
          const isDone = status?.[field.key] ?? false;
          return (
            <button
              key={field.key}
              onClick={() => handleToggle(field.key, isDone)}
              disabled={upsertStatus.isPending}
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 text-xs rounded-lg transition-all duration-200 ${
                isDone
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent hover:border-border'
              }`}
            >
              <span className="truncate font-medium">{field.label}</span>
              {isDone && (
                <span className="text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)] text-sm">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mark all complete button */}
      {!allDone && (
        <Button
          onClick={handleMarkAllComplete}
          disabled={upsertStatus.isPending}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all duration-300"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar Todo Completo
        </Button>
      )}

      {allDone && (
        <div className="text-center py-2 text-primary font-semibold text-sm drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
          ✓ Edición Completa
        </div>
      )}
    </div>
  );
}
