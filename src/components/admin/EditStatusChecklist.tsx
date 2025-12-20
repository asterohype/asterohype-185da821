import { Check, Circle } from "lucide-react";
import { useProductEditStatus, useToggleEditStatusField } from "@/hooks/useProductEditStatus";
import { toast } from "sonner";

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
  const toggleField = useToggleEditStatusField();

  const handleToggle = async (field: typeof FIELDS[number]['key'], currentValue: boolean) => {
    try {
      await toggleField.mutateAsync({
        shopifyProductId,
        field,
        value: !currentValue,
      });
      toast.success(`${FIELDS.find(f => f.key === field)?.label} ${!currentValue ? 'completado' : 'desmarcado'}`);
    } catch (error) {
      toast.error('Error al actualizar estado');
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
    <div className={`p-4 rounded-xl border transition-colors ${allDone ? 'bg-green-500/10 border-green-500/30' : 'bg-card/50 border-border/50'}`}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <span className="text-sm font-semibold text-foreground">Estado de Edición</span>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${allDone ? 'text-green-500' : 'text-muted-foreground'}`}>
          {allDone ? (
            <>
              <Check className="h-4 w-4" />
              Completo
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
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map((field) => {
          const isDone = status?.[field.key] ?? false;
          return (
            <button
              key={field.key}
              onClick={() => handleToggle(field.key, isDone)}
              disabled={toggleField.isPending}
              className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg transition-all ${
                isDone
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent hover:border-border'
              }`}
            >
              {isDone ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <Circle className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="truncate">{field.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
