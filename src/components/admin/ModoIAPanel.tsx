import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopifyProduct, updateProductTitle, updateShopifyProduct, updateProductTags } from '@/lib/shopify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, Image as ImageIcon, Search, CheckCircle2, AlertCircle, Edit, ExternalLink, Settings, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { useUpsertOverride, useProductOverrides } from "@/hooks/useProductOverrides";
import { useProductAI, AVAILABLE_MODELS, GeneratedResult } from '@/hooks/useProductAI';

interface ModoIAPanelProps {
  products: ShopifyProduct[];
}

type FilterType = 'all' | 'generated' | 'completed' | 'missing';

const ITEMS_PER_PAGE = 12;

export function ModoIAPanel({ products }: ModoIAPanelProps) {
  const { 
    apiKey, setApiKey, saveApiKeyToCloud,
    selectedModel, setSelectedModel, 
    customModel, setCustomModel, 
    analyzeProduct 
  } = useProductAI();

  const [showSettings, setShowSettings] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, GeneratedResult>>({});
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Hook for overrides
  const upsertOverride = useUpsertOverride();
  const { data: allOverrides } = useProductOverrides();
  
  // Edit Modal State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    subtitle: string;
    gender: string;
    highlight: string;
    about: string;
    description: string;
    saveTitle: boolean;
    saveSubtitle: boolean;
    saveTags: boolean;
    saveAbout: boolean;
    saveDescription: boolean;
  }>({
    title: '',
    subtitle: '',
    gender: '',
    highlight: '',
    about: '',
    description: '',
    saveTitle: true,
    saveSubtitle: true,
    saveTags: true,
    saveAbout: true,
    saveDescription: true
  });

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.node.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    const id = p.node.id;
    const result = results[id];
    const hasGenerated = result?.status === 'done';
    
    // Check if "completed"
    const override = allOverrides?.find(o => o.shopify_product_id === id);
    const hasSubtitle = !!override?.subtitle || p.node.title.includes(' - ');
    const hasGenderTag = (p.node.tags || []).some(t => t.startsWith('Gender:') || t === 'Hombre' || t === 'Mujer' || t === 'Unisex');
    
    const isCompleted = hasSubtitle && hasGenderTag;

    switch (filterType) {
      case 'generated': return hasGenerated;
      case 'completed': return isCompleted;
      case 'missing': return !hasGenerated && !isCompleted;
      case 'all': default: return true;
    }
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProductIds(newSet);
  };

  const selectAll = () => {
    // Select all FILTERED products, not just current page
    const allFilteredIds = filteredProducts.map(p => p.node.id);
    const allSelected = allFilteredIds.every(id => selectedProductIds.has(id));
    
    if (allSelected) {
      // Deselect all filtered
      const newSet = new Set(selectedProductIds);
      allFilteredIds.forEach(id => newSet.delete(id));
      setSelectedProductIds(newSet);
    } else {
      // Select all filtered
      const newSet = new Set(selectedProductIds);
      allFilteredIds.forEach(id => newSet.add(id));
      setSelectedProductIds(newSet);
    }
  };

  // Helper to update result state
  const updateResult = (id: string, data: Partial<GeneratedResult>) => {
    setResults(prev => ({
      ...prev,
      [id]: { ...prev[id], ...data }
    }));
  };

  // Batch Analysis
  const handleBatchAnalyze = async () => {
    setIsBatchProcessing(true);
    const idsToProcess = Array.from(selectedProductIds);
    
    for (const id of idsToProcess) {
      const product = products.find(p => p.node.id === id);
      // Skip if already analyzing or done (unless we want to regenerate? for now assume skip if done to avoid waste)
      // Actually user might want to regenerate. Let's process if selected.
      
      if (product) {
        setCurrentProcessingId(id);
        await analyzeProduct(
          product,
          (id) => updateResult(id, { id, status: 'analyzing', originalTitle: product.node.title }),
          (id, res) => updateResult(id, res),
          (id, err) => updateResult(id, { id, status: 'error', error: err, originalTitle: product.node.title })
        );
      }
    }
    
    setCurrentProcessingId(null);
    setIsBatchProcessing(false);
    toast.success('Análisis por lotes completado');
  };

  // Helper function to save a single product's changes
  const saveProductChanges = async (id: string, data: { 
    title?: string, 
    subtitle?: string,
    gender?: string,
    highlight?: string,
    about?: string, 
    description?: string,
    saveTitle: boolean,
    saveSubtitle: boolean,
    saveTags: boolean,
    saveAbout: boolean,
    saveDescription: boolean 
  }) => {
    const product = products.find(p => p.node.id === id);
    if (!product) return;

    // 1. Save Title (Combined with Subtitle for Shopify compatibility)
    if (data.saveTitle && data.title) {
      let titleToSave = data.title;
      // If subtitle is also selected/present, append it with standard separator
      if (data.saveSubtitle && data.subtitle) {
        titleToSave = `${data.title} - ${data.subtitle}`;
      }

      if (titleToSave !== product.node.title) {
        await updateProductTitle(id, titleToSave);
      }
    }

    /*
    // 2. Save Subtitle (Override) - REMOVED to prefer Shopify Title format
    if (data.saveSubtitle && data.subtitle) {
      await upsertOverride.mutateAsync({
        shopify_product_id: id,
        subtitle: data.subtitle
      });
    }
    */

    // 3. Save Tags (Gender + Highlight)
    if (data.saveTags) {
      const currentTags = product.node.tags || [];
      // Filter out existing Gender/Highlight tags to avoid duplicates/conflicts
      const newTags = currentTags.filter(t => 
        !t.startsWith('Gender:') && 
        !t.startsWith('Highlight:') && 
        !['Hombre', 'Mujer', 'Unisex', 'Niños'].includes(t)
      );
      
      if (data.gender) newTags.push(`Gender:${data.gender}`);
      if (data.highlight) newTags.push(`Highlight:${data.highlight}`);
      
      const tagsString = newTags.join(',');
      await updateProductTags(id, tagsString);
    }

    // 4. Save "About" (Override)
    // Clean up markdown just in case
    const cleanAbout = data.about?.replace(/\*\*/g, '') || '';
    if (data.saveAbout && cleanAbout) {
      await upsertOverride.mutateAsync({
        shopify_product_id: id,
        description: cleanAbout
      });
    }

    // 5. Save Description (Shopify)
    if (data.saveDescription && data.description) {
      let finalDescription = '';
      
      finalDescription += `<div class="product-detailed-description">
        ${data.description}
      </div>`;

      // PRESERVE IMAGES
      const originalHtml = product.node.descriptionHtml || product.node.description || '';
      const existingImages = originalHtml.match(/<img[^>]+>/g) || [];
      const imagesToAppend = existingImages.filter(imgTag => !finalDescription.includes(imgTag));
      
      if (imagesToAppend.length > 0) {
         finalDescription += `<div class="product-original-images" style="margin-top: 30px;">
           ${imagesToAppend.join('<br/>')}
         </div>`;
      }

      await updateShopifyProduct({
        id: id,
        descriptionHtml: finalDescription
      });
    }
  };

  // Batch Save
  const handleBatchSave = async () => {
    setIsBatchSaving(true);
    let savedCount = 0;
    
    const idsToSave = Array.from(selectedProductIds).filter(id => results[id]?.status === 'done');
    
    if (idsToSave.length === 0) {
      toast.info("No hay productos seleccionados con contenido generado para guardar.");
      setIsBatchSaving(false);
      return;
    }

    try {
      for (const id of idsToSave) {
        const result = results[id];
        if (result) {
          await saveProductChanges(id, {
            title: result.generatedTitle,
            subtitle: result.generatedSubtitle,
            gender: result.generatedGender,
            highlight: result.generatedHighlight,
            about: result.generatedAbout,
            description: result.generatedDescription,
            saveTitle: result.selectedForSave?.title ?? true,
            saveSubtitle: true, // Default to true for batch
            saveTags: true, // Default to true for batch
            saveAbout: result.selectedForSave?.about ?? true,
            saveDescription: result.selectedForSave?.description ?? true,
          });
          savedCount++;
        }
      }
      toast.success(`${savedCount} productos guardados correctamente`);
      
      const newSelected = new Set(selectedProductIds);
      idsToSave.forEach(id => newSelected.delete(id));
      setSelectedProductIds(newSelected);
      
    } catch (error) {
      console.error("Error in batch save:", error);
      toast.error("Error al guardar algunos productos");
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (id: string) => {
    const result = results[id];
    const product = products.find(p => p.node.id === id);
    if (!result || !product) return;

    setEditingProductId(id);
    setEditForm({
      title: result.generatedTitle || product.node.title,
      subtitle: result.generatedSubtitle || '',
      gender: result.generatedGender || '',
      highlight: result.generatedHighlight || '',
      about: (result.generatedAbout || '').replace(/\*\*/g, ''),
      description: result.generatedDescription || product.node.description,
      saveTitle: result.selectedForSave?.title ?? true,
      saveSubtitle: true,
      saveTags: true,
      saveAbout: result.selectedForSave?.about ?? true,
      saveDescription: result.selectedForSave?.description ?? true,
    });
  };

  // Save Single (from Modal)
  const handleSaveSingle = async () => {
    if (!editingProductId) return;
    
    try {
      await saveProductChanges(editingProductId, editForm);

      toast.success('Producto guardado correctamente');
      setEditingProductId(null);
      
      // Update result status or remove it?
      // Maybe just keep it as is.
      
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar cambios');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 bg-background z-10 sticky top-0 pb-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
              MODO IA (Generador Masivo)
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Selecciona productos, genera contenido con IA y guarda cambios masivamente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={!apiKey ? "animate-pulse border-red-500 text-red-500 h-9 w-9" : "h-9 w-9"}
              title="Configuración IA"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBatchAnalyze}
              disabled={selectedProductIds.size === 0 || isBatchProcessing || !apiKey}
              className="h-9 text-xs md:text-sm"
            >
              {isBatchProcessing ? (
                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4 text-purple-500" />
              )}
              Generar ({selectedProductIds.size})
            </Button>

            <Button 
              variant="default"
              onClick={handleBatchSave}
              disabled={selectedProductIds.size === 0 || isBatchSaving}
              className="bg-green-600 hover:bg-green-700 h-9 text-xs md:text-sm"
            >
              {isBatchSaving ? (
                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              )}
              <span className="hidden sm:inline">Guardar</span> ({selectedProductIds.size})
            </Button>
          </div>
        </div>

        {/* AI Settings Panel */}
        {showSettings && (
          <Card className="bg-muted/30 border-dashed border-2">
            <CardContent className="pt-6 pb-6">
              <div className="grid gap-4 md:grid-cols-2 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Google AI Studio API Key</label>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Pega tu API Key aquí (AIzaSy...)"
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        saveApiKeyToCloud(apiKey)
                          .then(() => toast.success('API Key guardada en tu cuenta'))
                          .catch((err) => {
                            console.error(err);
                            toast.error('Error al guardar API Key');
                          });
                      }}
                      title="Guardar API Key en la nube"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obtén tu clave gratis en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google AI Studio</a>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo de IA</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModel === 'custom' && (
                    <Input 
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Ej: gemini-3.0-pro"
                      className="mt-2 font-mono text-sm"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="generated">Generados por IA</SelectItem>
                <SelectItem value="completed">Ya completados</SelectItem>
                <SelectItem value="missing">Falta contenido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <Checkbox 
              checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={selectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer whitespace-nowrap">
              Seleccionar ({filteredProducts.length})
            </label>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 pb-20">
            {paginatedProducts.map((product, index) => {
              const id = product.node.id;
              const result = results[id];
              const isSelected = selectedProductIds.has(id);
              const isProcessing = currentProcessingId === id;

              return (
                <div
                  key={id}
                  className="h-full animate-in fade-in zoom-in-95 duration-300"
                >
                  <Card className={`relative overflow-hidden transition-all h-full flex flex-col ${isSelected ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : 'hover:shadow-md'}`}>
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 z-10 flex gap-1 md:gap-2">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(id)}
                        className="bg-white/90 backdrop-blur-sm shadow-sm h-3 w-3 md:h-4 md:w-4"
                      />
                    </div>
                    
                    <div className="aspect-square bg-muted/20 relative group overflow-hidden">
                      {product.node.images.edges[0] ? (
                        <motion.img 
                          whileHover={{ scale: 1.05 }}
                          src={product.node.images.edges[0].node.url} 
                          alt={product.node.title}
                          className="w-full h-full object-cover p-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      
                      {/* Status Overlay */}
                      <AnimatePresence>
                        {result && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"
                          >
                            {result.status === 'analyzing' && (
                              <div className="flex flex-col items-center text-white">
                                <Loader2 className="h-4 w-4 md:h-8 md:w-8 animate-spin mb-1 md:mb-2" />
                              </div>
                            )}
                            {result.status === 'done' && (
                              <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center text-green-400"
                              >
                                <CheckCircle2 className="h-6 w-6 md:h-10 md:w-10 mb-1 md:mb-2" />
                              </motion.div>
                            )}
                            {result.status === 'error' && (
                              <div className="flex flex-col items-center text-red-400">
                                <AlertCircle className="h-6 w-6 md:h-10 md:w-10 mb-1 md:mb-2" />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <CardContent className="p-2 md:p-4 flex-1 flex flex-col">
                      <h3 className="font-medium text-[10px] md:text-sm line-clamp-2 mb-2 min-h-[1.5rem] md:min-h-[2.5rem] leading-tight" title={product.node.title}>
                        {result?.generatedTitle || product.node.title}
                      </h3>
                      
                      <div className="flex gap-1 md:gap-2 mt-auto">
                        <a 
                          href={`/product/${product.node.handle}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 w-6 md:h-9 md:w-9 p-0"
                          onClick={(e) => e.stopPropagation()}
                          title="Ver producto"
                        >
                          <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                        </a>

                        {result?.status === 'done' ? (
                          <Button 
                          size="sm" 
                          variant="default" 
                          className="w-full bg-green-600 hover:bg-green-700 transition-colors h-6 text-[10px] px-1 md:h-9 md:text-sm md:px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(id);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1 md:mr-2" /> <span className="hidden md:inline">Revisar</span>
                        </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="w-full transition-all hover:bg-purple-100 dark:hover:bg-purple-900/20 h-6 text-[10px] px-1 md:h-9 md:text-sm md:px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentProcessingId(id);
                              analyzeProduct(
                                product,
                                (id) => updateResult(id, { id, status: 'analyzing', originalTitle: product.node.title }),
                                (id, res) => updateResult(id, res),
                                (id, err) => updateResult(id, { id, status: 'error', error: err, originalTitle: product.node.title })
                              ).then(() => setCurrentProcessingId(null));
                            }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1 md:mr-2 text-purple-500" />
                                <span className="hidden md:inline">Generar</span>
                                <span className="md:hidden">IA</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Edit/Review Modal */}
      <Dialog open={!!editingProductId} onOpenChange={(open) => !open && setEditingProductId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar y Guardar</DialogTitle>
            <DialogDescription>
              Verifica el contenido generado por la IA antes de guardar en Shopify.
            </DialogDescription>
          </DialogHeader>

          {editingProductId && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Left: Product Info & Title */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="h-20 w-20 bg-white rounded border flex-shrink-0">
                    <img 
                      src={products.find(p => p.node.id === editingProductId)?.node.images.edges[0]?.node.url} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Original</Badge>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {products.find(p => p.node.id === editingProductId)?.node.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Título Generado (Limpio)</label>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="save-title" 
                        checked={editForm.saveTitle}
                        onCheckedChange={(c) => setEditForm(prev => ({ ...prev, saveTitle: !!c }))}
                      />
                      <label htmlFor="save-title" className="text-xs cursor-pointer">Guardar</label>
                    </div>
                  </div>
                  <Input 
                    value={editForm.title} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Solo el nombre del producto (sin subtítulo ni género).</p>
                </div>

                <div className="space-y-2 border p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Subtítulo (Override)</label>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="save-subtitle" 
                        checked={editForm.saveSubtitle}
                        onCheckedChange={(c) => setEditForm(prev => ({ ...prev, saveSubtitle: !!c }))}
                      />
                      <label htmlFor="save-subtitle" className="text-xs cursor-pointer">Guardar</label>
                    </div>
                  </div>
                  <Input 
                    value={editForm.subtitle} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2 border p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Género</label>
                      <Checkbox 
                        id="save-tags" 
                        checked={editForm.saveTags}
                        onCheckedChange={(c) => setEditForm(prev => ({ ...prev, saveTags: !!c }))}
                      />
                    </div>
                    <Input 
                      value={editForm.gender} 
                      onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                      placeholder="Ej: Hombre"
                    />
                  </div>
                  <div className="space-y-2 border p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Highlight</label>
                    </div>
                    <Input 
                      value={editForm.highlight} 
                      onChange={(e) => setEditForm(prev => ({ ...prev, highlight: e.target.value }))}
                      placeholder="Ej: Materiales reciclados"
                    />
                  </div>
                </div>

                <div className="space-y-2 border p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sección "Acerca de"</label>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="save-about" 
                        checked={editForm.saveAbout}
                        onCheckedChange={(c) => setEditForm(prev => ({ ...prev, saveAbout: !!c }))}
                      />
                      <label htmlFor="save-about" className="text-xs cursor-pointer">Guardar</label>
                    </div>
                  </div>
                  <Textarea 
                    value={editForm.about} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, about: e.target.value }))}
                    className="h-32"
                  />
                  <p className="text-xs text-muted-foreground">Se guardará como "Acerca de este producto" (Debajo del precio). Se eliminarán los asteriscos ** automáticamente.</p>
                </div>
              </div>

              {/* Right: Description */}
              <div className="space-y-2 border p-3 rounded-lg flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Descripción Detallada (HTML/Markdown)</label>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="save-desc" 
                      checked={editForm.saveDescription}
                      onCheckedChange={(c) => setEditForm(prev => ({ ...prev, saveDescription: !!c }))}
                    />
                    <label htmlFor="save-desc" className="text-xs cursor-pointer">Guardar</label>
                  </div>
                </div>
                <Textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="flex-1 min-h-[400px] font-mono text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingProductId(null)}>Cancelar</Button>
            <Button onClick={handleSaveSingle} className="bg-purple-600 hover:bg-purple-700">
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
