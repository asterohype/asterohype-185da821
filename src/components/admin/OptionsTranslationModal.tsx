import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useProductAI } from '@/hooks/useProductAI';
import { updateProductOptions, updateVariant } from '@/lib/shopify';
import { useOptionAliases } from '@/hooks/useOptionAliases';
import { toast } from 'sonner';
import { Loader2, Sparkles, Save, RefreshCw, Settings } from 'lucide-react';
import { ShopifyProduct } from '@/lib/shopify';

interface OptionsTranslationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ShopifyProduct['node'];
  onSuccess?: () => void;
}

export function OptionsTranslationModal({ open, onOpenChange, product, onSuccess }: OptionsTranslationModalProps) {
  const { translateOptions, apiKey, setApiKey } = useProductAI();
  const { saveAlias } = useOptionAliases();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // State for editable mappings
  // Map OptionName -> TranslatedName
  const [optionNameMap, setOptionNameMap] = useState<Record<string, string>>({});
  // Map ValueName -> TranslatedValue
  const [valueMap, setValueMap] = useState<Record<string, string>>({});
  
  // Selection for AI translation
  const [selectedForAi, setSelectedForAi] = useState<Record<string, boolean>>({});

  // Initialize maps
  useEffect(() => {
    if (open && product) {
      const initOptMap: Record<string, string> = {};
      const initValMap: Record<string, string> = {};
      const initSelected: Record<string, boolean> = {};
      
      product.options.forEach((opt, idx) => {
        initOptMap[opt.name] = opt.name;
        initSelected[opt.name] = true; // Default all selected
        opt.values.forEach(val => {
          initValMap[val] = val;
        });
      });
      
      setOptionNameMap(initOptMap);
      setValueMap(initValMap);
      setSelectedForAi(initSelected);
    }
  }, [open, product]);

  const handleAutoTranslate = async () => {
    setLoading(true);
    try {
      // Prepare data for AI (only selected)
      const optionsData = product.options
        .filter(opt => selectedForAi[opt.name])
        .map(opt => ({
          name: opt.name,
          values: opt.values
        }));
      
      if (optionsData.length === 0) {
        toast.error("Selecciona al menos una opción para traducir");
        setLoading(false);
        return;
      }

      const translated = await translateOptions(optionsData);
      
      const newOptMap = { ...optionNameMap };
      const newValMap = { ...valueMap };
      
      translated.forEach((tOpt, idx) => {
        const originalOpt = product.options[idx];
        if (originalOpt) {
          newOptMap[originalOpt.name] = tOpt.name;
          
          tOpt.values.forEach((tVal, vIdx) => {
            const originalVal = originalOpt.values[vIdx];
            if (originalVal) {
              newValMap[originalVal] = tVal;
            }
          });
        }
      });
      
      setOptionNameMap(newOptMap);
      setValueMap(newValMap);
      toast.success("Traducción generada. Revisa y guarda.");
    } catch (error) {
      console.error(error);
      toast.error("Error al traducir con IA");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setProgress(0);
    
    try {
      /* 
      // REMOVED: Saving aliases to local DB is disabled as per user request to avoid local DB sync issues.
      // 1. Save Aliases (Local Supabase) - As a backup and for frontend consistency immediately
      for (const [original, translated] of Object.entries(optionNameMap)) {
        if (original !== translated) {
          await saveAlias(product.id, original, translated);
        }
      }
      */
      
      // 2. Update Shopify Option Names
      const newOptions = product.options.map(opt => ({
        id: opt.id,
        name: optionNameMap[opt.name] || opt.name
      }));
      
      // Only update if changed
      const optionsChanged = newOptions.some((no, i) => no.name !== product.options[i].name);
      if (optionsChanged) {
        await updateProductOptions(product.id, newOptions);
      }
      
      // 3. Update Shopify Variant Values
      const variants = product.variants.edges;
      const total = variants.length;
      let completed = 0;
      
      // Process in chunks to prevent request timeouts
      const CHUNK_SIZE = 5;
      for (let i = 0; i < variants.length; i += CHUNK_SIZE) {
        const chunk = variants.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (edge) => {
          const variant = edge.node;
          const updates: any = {};
          let hasUpdates = false;
          
          // Shopify uses option1, option2, option3 matching the order of product.options
          product.options.forEach((opt, idx) => {
            const optKey = `option${idx + 1}`;
            // Find the value for this option in the variant
            const selectedOption = variant.selectedOptions?.find(so => so.name === opt.name);
            const originalValue = selectedOption?.value;
            
            if (originalValue) {
              const newValue = valueMap[originalValue] || originalValue;
              if (newValue !== originalValue) {
                updates[optKey] = newValue;
                hasUpdates = true;
              }
            }
          });
          
          if (hasUpdates && product.id && variant.id) {
            try {
              await updateVariant(product.id, variant.id, updates);
            } catch (err) {
              console.error(`Failed to update variant ${variant.id}`, err);
            }
          }
        }));
        
        completed += chunk.length;
        setProgress(Math.round((completed / total) * 100));
      }
      
      toast.success("Opciones actualizadas en Shopify correctamente");
      onSuccess?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error saving options:", error);
      toast.error("Error al guardar cambios en Shopify");
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto mt-10 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Traducir Opciones y Variantes</DialogTitle>
            <DialogDescription>
              Traduce los nombres de opciones (ej. Size &gt; Talla) y sus valores. 
              Los cambios se aplicarán directamente en Shopify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                title="Configuración API"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleAutoTranslate} 
                disabled={loading || saving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Traducir con IA
              </Button>
            </div>

            <div className="space-y-6">
              {product.options.map((opt, idx) => (
                <div key={opt.id || idx} className="border rounded-lg p-4 space-y-4 bg-secondary/20">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                    <Checkbox 
                      id={`select-ai-${opt.name}`}
                      checked={!!selectedForAi[opt.name]} 
                      onCheckedChange={(checked) => setSelectedForAi(prev => ({...prev, [opt.name]: !!checked}))} 
                    />
                    <Label htmlFor={`select-ai-${opt.name}`} className="text-sm text-muted-foreground cursor-pointer select-none">
                      Incluir en traducción IA
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nombre Original</Label>
                      <div className="font-medium">{opt.name}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Traducción (Nombre)</Label>
                      <Input 
                        value={optionNameMap[opt.name] || ''} 
                        onChange={(e) => setOptionNameMap(prev => ({ ...prev, [opt.name]: e.target.value }))}
                        placeholder="Ej. Talla"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Valores</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      {opt.values.map((val, valIdx) => (
                        <div key={`${val}-${valIdx}`} className="grid grid-cols-2 gap-2 items-center">
                          <div className="text-sm text-muted-foreground truncate" title={val}>
                            {val}
                          </div>
                          <Input 
                            value={valueMap[val] || ''} 
                            onChange={(e) => setValueMap(prev => ({ ...prev, [val]: e.target.value }))}
                            placeholder="Traducción"
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {saving && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Guardando cambios en Shopify...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de IA</DialogTitle>
            <DialogDescription>
              Introduce tu API Key de Google Gemini para habilitar la traducción automática.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>API Key (Google Gemini)</Label>
              <Input 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                type="password"
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-muted-foreground">
                Se guardará localmente en tu navegador.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
