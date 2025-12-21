import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ChevronDown, ChevronUp, Check } from "lucide-react";
import { updateProductPrice, formatPrice } from "@/lib/shopify";
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
  variants: Array<{ node: Variant }>;
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
  variants,
  images,
  onVariantsUpdated,
}: VariantsPricePanelProps) {
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [savingVariants, setSavingVariants] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);

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

    const groupOption = firstVariant.selectedOptions[0]?.name || "Variante";
    const groups: Record<string, GroupedVariant> = {};

    variants.forEach((v) => {
      const groupValue = v.node.selectedOptions[0]?.value || v.node.title;
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

  const saveBulkPrices = async () => {
    if (!bulkPrice.trim() || selectedVariants.size === 0) return;

    setSavingBulk(true);
    const variantsToUpdate = variants.filter((v) => selectedVariants.has(v.node.id));
    let successCount = 0;
    let errorCount = 0;

    for (const v of variantsToUpdate) {
      try {
        const res = await updateProductPrice(productId, v.node.id, bulkPrice.trim());
        if (res.ok) successCount++;
        else errorCount++;
      } catch (error) {
        console.error(`Error updating ${v.node.title}:`, error);
        errorCount++;
      }
    }

    // Update local state (only if at least one succeeded)
    if (successCount > 0) {
      const updatedVariants = variants.map((v) =>
        selectedVariants.has(v.node.id)
          ? { ...v, node: { ...v.node, price: { ...v.node.price, amount: bulkPrice.trim() } } }
          : v
      );
      onVariantsUpdated(updatedVariants);
    }

    if (successCount > 0) {
      toast.success(`${successCount} variante(s) actualizadas`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} variante(s) fallaron`);
    }

    setSelectedVariants(new Set());
    setBulkPrice("");
    setSavingBulk(false);
  };

  const currencyCode = variants[0]?.node.price.currencyCode || "EUR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Precios de Variantes
          </DialogTitle>
          <DialogDescription className="truncate">
            {productTitle} • {variants.length} variantes
          </DialogDescription>
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
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_140px_100px] gap-3 items-center px-2 py-1 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 bg-background z-10">
            <div className="w-5"></div>
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

                  <div className="text-sm font-medium text-foreground whitespace-nowrap">
                    {group.priceRange.min === group.priceRange.max
                      ? formatPrice(group.priceRange.min, currencyCode)
                      : `${formatPrice(group.priceRange.min, currencyCode)} - ${formatPrice(
                          group.priceRange.max,
                          currencyCode
                        )}`}
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

                      // Get display title (remove first option if it's the group)
                      const displayTitle =
                        variant.selectedOptions.length > 1
                          ? variant.selectedOptions
                              .slice(1)
                              .map((o) => o.value)
                              .join(" / ")
                          : variant.title;

                      return (
                        <div
                          key={variant.id}
                          className={`grid grid-cols-[auto_1fr_140px_100px] gap-3 items-center px-3 py-2 ${
                            isSelected ? "bg-price-yellow/5" : "hover:bg-muted/20"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleVariantSelection(variant.id)}
                          />

                          <div className="min-w-0 pl-2">
                            <p className="text-sm text-foreground truncate">
                              {displayTitle || variant.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">€</span>
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
                              className="h-8 text-sm"
                            />
                            {hasChanges && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => saveVariantPrice(variant)}
                                disabled={isSaving}
                                className="h-8 w-8 flex-shrink-0 text-green-600"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>

                          <div className="text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
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
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Los cambios se guardan directamente en Shopify
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}