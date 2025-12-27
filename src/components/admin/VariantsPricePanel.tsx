import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ChevronDown, ChevronUp, Check } from "lucide-react";
import { updateProductPrice, formatPrice, fetchProductById } from "@/lib/shopify";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Variant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface VariantImage {
  url: string;
  altText: string | null;
}

interface VariantsPricePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  initialVariants: Array<{ node: Variant }>;
  images: Array<{ node: VariantImage }>;
  onVariantsUpdated: (updatedVariants: Array<{ node: Variant }>) => void;
}

interface GroupedVariant {
  groupValue: string;
  groupOption: string;
  variants: Array<{ node: Variant }>;
  image?: VariantImage;
  priceRange: { min: string; max: string };
}

export function VariantsPricePanel({
  open,
  onOpenChange,
  productId,
  productTitle,
  initialVariants,
  images,
  onVariantsUpdated,
}: VariantsPricePanelProps) {
  const [variants, setVariants] = useState(initialVariants);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // Sync with props
  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  // Fetch full product details when opening to ensure all variants are loaded
  useEffect(() => {
    if (open && productId) {
      setIsLoadingVariants(true);
      fetchProductById(productId)
        .then((product) => {
          if (product && product.variants.edges.length > 0) {
            // Only update if we have more variants or different data
            // But usually safer to just sync with source of truth
            setVariants(product.variants.edges);
            // Optional: Sync back to parent to update the list view cache
            onVariantsUpdated(product.variants.edges);
          }
        })
        .catch((err) => {
          console.error("Error fetching full product variants:", err);
          toast.error("Error al cargar variantes completas");
        })
        .finally(() => {
          setIsLoadingVariants(false);
        });
    }
  }, [open, productId]);

  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [savingVariants, setSavingVariants] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);

  const handleKeyDown = (e: any, variantId: string) => {
    if (e.ctrlKey && e.key === "v") {
      // Standard paste behavior
    }
  };

  // Group variants by first option (usually Color)
  const groupedVariants = useMemo(() => {
    if (variants.length === 0) return [];

    // Find the first option that has multiple values (usually Color)
    const firstVariant = variants[0]?.node;
    if (!firstVariant?.selectedOptions?.length) {
      // No options, return flat list
      return variants.map((v) => ({
        groupValue: v.node.title,
        groupOption: "",
        variants: [v],
        image: images[0]?.node,
        priceRange: { min: v.node.price.amount, max: v.node.price.amount },
      }));
    }

    // Determine grouping option index
    const options = firstVariant.selectedOptions;
    const preferredNames = ["Color", "Colour", "Modelo", "Model", "Estilo", "Style", "Design"];
    let groupOptionIndex = 0;
    
    // Find first matching preferred name
    for (const name of preferredNames) {
        const idx = options.findIndex(o => o.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
            groupOptionIndex = idx;
            break;
        }
    }

    const groupOption = options[groupOptionIndex]?.name || "Variante";
    const groups: Record<string, GroupedVariant> = {};

    variants.forEach((v) => {
      const groupValue = v.node.selectedOptions[groupOptionIndex]?.value || v.node.title;
      if (!groups[groupValue]) {
        // Try to find matching image
        const matchingImage = images.find((img) => {
          const alt = img.node.altText?.toLowerCase() || "";
          const url = img.node.url.toLowerCase();
          const val = groupValue.toLowerCase();
          return alt.includes(val) || url.includes(val);
        });

        groups[groupValue] = {
          groupValue,
          groupOption,
          variants: [],
          image: matchingImage?.node || images[0]?.node,
          priceRange: { min: v.node.price.amount, max: v.node.price.amount },
        };
      }
      groups[groupValue].variants.push(v);

      // Update price range
      const price = parseFloat(v.node.price.amount);
      const minPrice = parseFloat(groups[groupValue].priceRange.min);
      const maxPrice = parseFloat(groups[groupValue].priceRange.max);
      if (price < minPrice) groups[groupValue].priceRange.min = v.node.price.amount;
      if (price > maxPrice) groups[groupValue].priceRange.max = v.node.price.amount;
    });

    return Object.values(groups);
  }, [variants, images]);

  const toggleGroup = (groupValue: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupValue)) {
        next.delete(groupValue);
      } else {
        next.add(groupValue);
      }
      return next;
    });
  };

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const selectAllInGroup = (group: GroupedVariant) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      const allSelected = group.variants.every((v) => prev.has(v.node.id));
      group.variants.forEach((v) => {
        if (allSelected) {
          next.delete(v.node.id);
        } else {
          next.add(v.node.id);
        }
      });
      return next;
    });
  };

  const handlePriceChange = (variantId: string, value: string) => {
    setEditedPrices((prev) => ({ ...prev, [variantId]: value }));
  };

  const saveVariantPrice = async (variant: Variant) => {
    const newPrice = editedPrices[variant.id];
    if (!newPrice || newPrice === variant.price.amount) return;

    setSavingVariants((prev) => new Set(prev).add(variant.id));
    try {
      const res = await updateProductPrice(productId, variant.id, newPrice);
      if (!res.ok) return;

      // Update local state
      const updatedVariants = variants.map((v) =>
        v.node.id === variant.id
          ? { ...v, node: { ...v.node, price: { ...v.node.price, amount: newPrice } } }
          : v
      );
      onVariantsUpdated(updatedVariants);

      // Clear edited price
      setEditedPrices((prev) => {
        const next = { ...prev };
        delete next[variant.id];
        return next;
      });

      toast.success(`Precio actualizado: ${variant.title}`);
    } catch (error) {
      console.error("Error updating variant price:", error);
      toast.error(`Error al actualizar ${variant.title}`);
    } finally {
      setSavingVariants((prev) => {
        const next = new Set(prev);
        next.delete(variant.id);
        return next;
      });
    }
  };

  const saveAllEditedPrices = async () => {
    const variantIdsToSave = Object.keys(editedPrices);
    if (variantIdsToSave.length === 0) return;

    setSavingBulk(true);
    const succeededIds: string[] = [];
    let errorCount = 0;

    // Process in chunks to avoid rate limits/overloading but faster than sequential
    const CONCURRENCY = 5;
    for (let i = 0; i < variantIdsToSave.length; i += CONCURRENCY) {
      const chunk = variantIdsToSave.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(async (id) => {
        const price = editedPrices[id];
        try {
          const res = await updateProductPrice(productId, id, price);
          if (res.ok) {
            succeededIds.push(id);
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating variant ${id}:`, error);
          errorCount++;
        }
      }));
    }

    if (succeededIds.length > 0) {
      // Update local state for all successful saves
      const updatedVariants = variants.map((v) => {
        if (succeededIds.includes(v.node.id)) {
           return { ...v, node: { ...v.node, price: { ...v.node.price, amount: editedPrices[v.node.id] } } };
        }
        return v;
      });
      onVariantsUpdated(updatedVariants);
      
      // Remove succeeded from editedPrices
      setEditedPrices((prev) => {
        const next = { ...prev };
        succeededIds.forEach(id => delete next[id]);
        return next;
      });
      
      toast.success(`${succeededIds.length} precios guardados correctamente`);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} errores al guardar`);
    }
    setSavingBulk(false);
  };

  const saveBulkPrices = async () => {
    if (!bulkPrice.trim() || selectedVariants.size === 0) return;

    setSavingBulk(true);
    const variantsToUpdate = variants.filter((v) => selectedVariants.has(v.node.id));
    const succeededIds: string[] = [];
    let errorCount = 0;

    const CONCURRENCY = 5;
    const variantsChunks = [];
    for (let i = 0; i < variantsToUpdate.length; i += CONCURRENCY) {
      variantsChunks.push(variantsToUpdate.slice(i, i + CONCURRENCY));
    }

    for (const chunk of variantsChunks) {
      await Promise.all(chunk.map(async (v) => {
        try {
          const res = await updateProductPrice(productId, v.node.id, bulkPrice.trim());
          if (res.ok) {
            succeededIds.push(v.node.id);
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating ${v.node.title}:`, error);
          errorCount++;
        }
      }));
    }

    // Update local state (only if at least one succeeded)
    if (succeededIds.length > 0) {
      const updatedVariants = variants.map((v) =>
        succeededIds.includes(v.node.id)
          ? { ...v, node: { ...v.node, price: { ...v.node.price, amount: bulkPrice.trim() } } }
          : v
      );
      onVariantsUpdated(updatedVariants);
      toast.success(`${succeededIds.length} variante(s) actualizadas`);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} variante(s) fallaron`);
    }

    setSelectedVariants(new Set());
    setBulkPrice("");
    setSavingBulk(false);
  };

  const handleGroupPriceChange = (group: GroupedVariant, price: string) => {
    // Update all variants in the group locally
    const newEditedPrices = { ...editedPrices };
    group.variants.forEach(v => {
      newEditedPrices[v.node.id] = price;
    });
    setEditedPrices(newEditedPrices);
  };

  const currencyCode = variants[0]?.node.price.currencyCode || "EUR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Editar Precios de Variantes
              </DialogTitle>
              <DialogDescription className="truncate">
                {productTitle} • {variants.length} variantes
              </DialogDescription>
            </div>
            {Object.keys(editedPrices).length > 0 && (
              <Button 
                onClick={saveAllEditedPrices} 
                disabled={savingBulk}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {savingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Todo ({Object.keys(editedPrices).length})
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Bulk price editor */}
        {selectedVariants.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-price-yellow/10 border border-price-yellow/30 rounded-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedVariants.size} seleccionadas
            </span>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm">€</span>
              <Input
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Nuevo precio"
                type="number"
                step="0.01"
                className="w-28 h-8"
              />
              <Button
                size="sm"
                onClick={saveBulkPrices}
                disabled={savingBulk || !bulkPrice.trim()}
                className="bg-price-yellow text-background hover:bg-price-yellow/90"
              >
                {savingBulk ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Aplicar a todas
                  </>
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedVariants(new Set())}
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Variants list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoadingVariants ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando variantes...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-[auto_1fr_80px_60px] sm:grid-cols-[auto_1fr_140px_100px] gap-2 sm:gap-3 items-center px-2 sm:px-3 py-1 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 bg-background z-10">
                <div className="w-5 flex items-center justify-center">
                  <Checkbox 
                    checked={variants.length > 0 && selectedVariants.size === variants.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedVariants(new Set(variants.map(v => v.node.id)));
                      } else {
                        setSelectedVariants(new Set());
                      }
                    }}
                  />
                </div>
                <div>Variante</div>
                <div className="text-center">Precio</div>
                <div className="text-center">Disponible</div>
              </div>

              {groupedVariants.map((group) => {
            const isExpanded = expandedGroups.has(group.groupValue);
            const hasMultipleVariants = group.variants.length > 1;
            const allInGroupSelected = group.variants.every((v) =>
              selectedVariants.has(v.node.id)
            );

            return (
              <div
                key={group.groupValue}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Group header */}
                {hasMultipleVariants && (
                <div
                  className={`flex items-center gap-3 p-3 bg-muted/30 ${
                    hasMultipleVariants ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  onClick={() => hasMultipleVariants && toggleGroup(group.groupValue)}
                >
                  <Checkbox
                    checked={allInGroupSelected}
                    onCheckedChange={() => selectAllInGroup(group)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {group.image && (
                    <img
                      src={group.image.url}
                      alt={group.image.altText || group.groupValue}
                      className="w-14 h-14 object-cover rounded-lg border border-border"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{group.groupValue}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.variants.length} variante(s)
                    </p>
                  </div>

                  <div className="text-sm font-medium text-foreground whitespace-nowrap flex items-center gap-2">
                    {hasMultipleVariants ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                           <span className="text-xs text-muted-foreground">€</span>
                           <Input
                             placeholder={`${formatPrice(group.priceRange.min, currencyCode)}`}
                             className="h-7 w-20 text-sm px-1"
                             onChange={(e) => handleGroupPriceChange(group, e.target.value)}
                             type="number"
                             step="0.01"
                           />
                        </div>
                    ) : (
                      group.priceRange.min === group.priceRange.max
                        ? formatPrice(group.priceRange.min, currencyCode)
                        : `${formatPrice(group.priceRange.min, currencyCode)} - ${formatPrice(
                            group.priceRange.max,
                            currencyCode
                          )}`
                    )}
                  </div>

                  {hasMultipleVariants && (
                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Expanded variants */}
                {(isExpanded || !hasMultipleVariants) && (
                  <div className="divide-y divide-border">
                    {group.variants.map((v) => {
                      const variant = v.node;
                      const isSaving = savingVariants.has(variant.id);
                      const editedPrice = editedPrices[variant.id];
                      const currentPrice = editedPrice ?? variant.price.amount;
                      const hasChanges = editedPrice && editedPrice !== variant.price.amount;
                      const isSelected = selectedVariants.has(variant.id);

                      // Get display title (remove the group option if exists)
                      const displayTitle =
                        variant.selectedOptions.length > 1
                          ? variant.selectedOptions
                              .filter((o) => o.name !== group.groupOption)
                              .map((o) => o.value)
                              .join(" / ")
                          : variant.title;

                      return (
                        <div
                          key={variant.id}
                          className={`grid grid-cols-[auto_1fr_80px_60px] sm:grid-cols-[auto_1fr_140px_100px] gap-2 sm:gap-3 items-center px-2 sm:px-3 py-2 ${
                            isSelected ? "bg-price-yellow/5" : "hover:bg-muted/20"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleVariantSelection(variant.id)}
                          />

                          <div className="min-w-0 pl-1 sm:pl-2 flex items-center gap-2 sm:gap-3">
                            {!hasMultipleVariants && group.image && (
                              <img
                                src={group.image.url}
                                alt={group.image.altText || group.groupValue}
                                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-md border border-border hidden sm:block"
                              />
                            )}
                            <p className="text-xs sm:text-sm text-foreground truncate">
                              {displayTitle || variant.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">€</span>
                            <Input
                              value={currentPrice}
                              onChange={(e) => handlePriceChange(variant.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && hasChanges) {
                                  saveVariantPrice(variant);
                                }
                              }}
                              type="number"
                              step="0.01"
                              className="h-7 sm:h-8 text-xs sm:text-sm px-1 sm:px-3 w-full"
                            />
                            {hasChanges && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => saveVariantPrice(variant)}
                                disabled={isSaving}
                                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-green-600 hidden sm:flex"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            )}
                          </div>

                          <div className="text-center">
                            <span
                              className={`text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
                                variant.availableForSale
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {variant.availableForSale ? "Sí" : "No"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border mt-auto">
          <p className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
            Los cambios se guardan directamente en Shopify
          </p>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cerrar
            </Button>
            <Button 
              onClick={saveAllEditedPrices} 
              disabled={savingBulk || Object.keys(editedPrices).length === 0}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
            >
              {savingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios {Object.keys(editedPrices).length > 0 && `(${Object.keys(editedPrices).length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}