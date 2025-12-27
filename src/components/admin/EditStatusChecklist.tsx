import { Check, Circle, CheckCircle2, RotateCcw, Plus, Trash2, Settings2, X, MessageSquare, Save } from "lucide-react";
import { useProductEditStatus, useUpsertEditStatus, useEditStatusFields, useAddEditStatusField, useRemoveEditStatusField, useProductCustomStatuses, useToggleCustomStatus, EditStatusField } from "@/hooks/useProductEditStatus";
import { useProductOverride, useUpsertOverride } from "@/hooks/useProductOverrides";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EditStatusChecklistProps {
  shopifyProductId: string;
}

export function EditStatusChecklist({ shopifyProductId }: EditStatusChecklistProps) {
  const { data: status, isLoading: statusLoading } = useProductEditStatus(shopifyProductId);
  const { data: fields = [], isLoading: fieldsLoading } = useEditStatusFields();
  const { data: customStatuses = [], isLoading: customLoading } = useProductCustomStatuses(shopifyProductId);
  
  const upsertStatus = useUpsertEditStatus();
  const addField = useAddEditStatusField();
  const removeField = useRemoveEditStatusField();
  const toggleCustom = useToggleCustomStatus();
  
  const { data: override } = useProductOverride(shopifyProductId);
  const upsertOverride = useUpsertOverride();
  const [noteText, setNoteText] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (override?.notes) {
      setNoteText(override.notes);
      setShowNotes(true);
    }
  }, [override]);

  const handleSaveNote = async () => {
    try {
      await upsertOverride.mutateAsync({
        shopify_product_id: shopifyProductId,
        notes: noteText
      });
      toast.success("Nota guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar la nota");
    }
  };

  const [isManaging, setIsManaging] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  const handleToggle = async (field: EditStatusField, currentValue: boolean) => {
    if (isManaging) return; // Disable toggle in management mode

    try {
      if (field.is_custom) {
        await toggleCustom.mutateAsync({
          productId: shopifyProductId,
          fieldKey: field.key,
          isDone: !currentValue
        });
      } else {
        await upsertStatus.mutateAsync({
          shopify_product_id: shopifyProductId,
          [field.key]: !currentValue,
        });
      }
      toast.success(`${field.label} ${!currentValue ? 'completado ✅' : 'desmarcado'}`);
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    try {
      const key = `custom_${Date.now()}_done`; // Unique key
      await addField.mutateAsync({ key, label: newFieldName });
      setNewFieldName("");
      setIsAddingOpen(false);
      toast.success("Campo añadido");
    } catch (error) {
      toast.error("Error al añadir campo");
    }
  };

  const handleRemoveField = async (key: string) => {
    if (!confirm("¿Estás seguro de que quieres ocultar este campo de todos los productos?")) return;
    try {
      await removeField.mutateAsync(key);
      toast.success("Campo ocultado");
    } catch (error) {
      toast.error("Error al ocultar campo");
    }
  };

  const handleMarkAllComplete = async () => {
    try {
      // Update standard fields
      const standardUpdates: any = { shopify_product_id: shopifyProductId };
      fields.filter(f => !f.is_custom).forEach(f => {
        standardUpdates[f.key] = true;
      });
      
      const promises: Promise<any>[] = [
        upsertStatus.mutateAsync(standardUpdates)
      ];

      // Update custom fields
      fields.filter(f => f.is_custom).forEach(f => {
        promises.push(toggleCustom.mutateAsync({
          productId: shopifyProductId,
          fieldKey: f.key,
          isDone: true
        }));
      });

      await Promise.all(promises);
      toast.success('¡Producto marcado como completo! ✅');
    } catch (error) {
      toast.error('Error al marcar como completo');
    }
  };

  const handleUnmarkAll = async () => {
    try {
      // Update standard fields
      const standardUpdates: any = { shopify_product_id: shopifyProductId };
      fields.filter(f => !f.is_custom).forEach(f => {
        standardUpdates[f.key] = false;
      });
      
      const promises: Promise<any>[] = [
        upsertStatus.mutateAsync(standardUpdates)
      ];

      // Update custom fields
      fields.filter(f => f.is_custom).forEach(f => {
        promises.push(toggleCustom.mutateAsync({
          productId: shopifyProductId,
          fieldKey: f.key,
          isDone: false
        }));
      });

      await Promise.all(promises);
      toast.success('Estado reiniciado');
    } catch (error) {
      toast.error('Error al reiniciar estado');
    }
  };

  if (statusLoading || fieldsLoading || customLoading) {
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

  // Calculate completion
  const totalFields = fields.length;
  let completedFields = 0;
  
  fields.forEach(f => {
    let isDone = false;
    if (f.is_custom) {
      isDone = customStatuses.find(s => s.field_key === f.key)?.is_done ?? false;
    } else {
      isDone = (status as any)?.[f.key] ?? false;
    }
    if (isDone) completedFields++;
  });

  const allDone = totalFields > 0 && completedFields === totalFields;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${allDone ? 'bg-price-yellow/20 border-price-yellow/50' : 'bg-card/50 border-border/50'}`}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Estado de Edición</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-5 w-5 ${isManaging ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            onClick={() => setIsManaging(!isManaging)}
            title="Gestionar campos"
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${allDone ? 'text-price-yellow' : 'text-muted-foreground'}`}>
          {allDone ? (
            <>
              <Check className="h-4 w-4" />
              Completo ✅
            </>
          ) : (
            <>
              <Circle className="h-3 w-3" />
              {completedFields}/{totalFields}
            </>
          )}
        </div>
      </div>

      {/* Individual fields */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fields.map((field) => {
          let isDone = false;
          if (field.is_custom) {
            isDone = customStatuses.find(s => s.field_key === field.key)?.is_done ?? false;
          } else {
            isDone = (status as any)?.[field.key] ?? false;
          }

          return (
            <div key={field.key} className="relative group">
              <button
                onClick={() => handleToggle(field, isDone)}
                disabled={upsertStatus.isPending || toggleCustom.isPending || isManaging}
                className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-2 text-xs rounded-lg transition-all duration-200 ${
                  isDone
                    ? 'bg-price-yellow/20 text-price-yellow border border-price-yellow/40'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent hover:border-border'
                } ${isManaging ? 'opacity-60 cursor-default' : ''}`}
              >
                <span className="truncate font-medium">{field.label}</span>
                {!isManaging && isDone && (
                  <span className="text-price-yellow text-sm">✅</span>
                )}
              </button>
              
              {isManaging && (
                <button
                  onClick={() => handleRemoveField(field.key)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:bg-destructive/90 z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        
        {/* Add Field Button */}
        {isManaging && (
          <Dialog open={isAddingOpen} onOpenChange={setIsAddingOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
              >
                <Plus className="h-3 w-3" />
                Añadir
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Añadir campo de estado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Input
                    id="name"
                    placeholder="Nombre del campo (ej: Video)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  />
                  <Button onClick={handleAddField}>Guardar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
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

      {/* Notes Section */}
      <div className="mt-4 pt-4 border-t border-border/30">
        {!showNotes && !noteText ? (
          <button 
            onClick={() => setShowNotes(true)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground w-full p-2 hover:bg-secondary/50 rounded-lg transition-colors group"
          >
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1.5 rounded-md text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            Añadir Nota / Recordatorio
          </button>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1.5 rounded-md text-yellow-600 dark:text-yellow-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold">Nota Interna</span>
              </div>
              <button 
                onClick={() => setShowNotes(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-900/30 rounded-lg p-3 shadow-sm relative group/note">
              <Textarea 
                placeholder="Escribe detalles importantes sobre este producto..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[100px] text-sm resize-none bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50 p-0"
              />
              
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-yellow-200/30 dark:border-yellow-900/20">
                {noteText && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("¿Borrar nota?")) {
                        setNoteText("");
                        upsertOverride.mutateAsync({
                          shopify_product_id: shopifyProductId,
                          notes: ""
                        }).then(() => toast.success("Nota borrada"));
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Borrar
                  </Button>
                )}
                <Button 
                  type="button"
                  size="sm" 
                  className="h-7 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/60 border border-yellow-200 dark:border-yellow-800"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveNote();
                  }}
                  disabled={upsertOverride.isPending}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
