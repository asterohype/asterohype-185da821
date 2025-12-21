import { Check, Circle, CheckCircle2, RotateCcw } from "lucide-react";
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
      toast.success(`${FIELDS.find(f => f.key === field)?.label} ${!currentValue ? 'completado ✅' : 'desmarcado'}`);
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
      toast.success('¡Producto marcado como completo! ✅');
    } catch (error) {
      toast.error('Error al marcar como completo');
    }
  };

  const handleUnmarkAll = async () => {
    try {
      await upsertStatus.mutateAsync({
        shopify_product_id: shopifyProductId,
        title_done: false,
        price_done: false,
        about_done: false,
        description_done: false,
        model_done: false,
        color_done: false,
        tags_done: false,
        offers_done: false,
        images_done: false,
      });
      toast.success('Estado reiniciado');
    } catch (error) {
      toast.error('Error al reiniciar estado');
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
    <div className={`p-4 rounded-xl border transition-all duration-300 ${allDone ? 'bg-price-yellow/20 border-price-yellow/50' : 'bg-card/50 border-border/50'}`}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <span className="text-sm font-semibold text-foreground">Estado de Edición</span>
        <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${allDone ? 'text-price-yellow' : 'text-muted-foreground'}`}>
          {allDone ? (
            <>
              <Check className="h-4 w-4" />
              Completo ✅
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
                  ? 'bg-price-yellow/20 text-price-yellow border border-price-yellow/40'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent hover:border-border'
              }`}
            >
              <span className="truncate font-medium">{field.label}</span>
              {isDone && (
                <span className="text-price-yellow text-sm">✅</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      {!allDone ? (
        <Button
          onClick={handleMarkAllComplete}
          disabled={upsertStatus.isPending}
          className="w-full bg-price-yellow/20 hover:bg-price-yellow/30 text-price-yellow border border-price-yellow/40 transition-all duration-300"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar Todo Completo
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="text-center py-2 text-price-yellow font-semibold text-sm">
            ✅ Edición Completa
          </div>
          <Button
            onClick={handleUnmarkAll}
            disabled={upsertStatus.isPending}
            variant="outline"
            className="w-full border-border/50 text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Deshacer (volver a pendiente)
          </Button>
        </div>
      )}
    </div>
  );
}
