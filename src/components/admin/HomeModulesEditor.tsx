import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, GripVertical, Flame, Zap, Gift, Sparkles, Star, Heart, TrendingUp, Clock, ShoppingBag, Eye, X, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Reorder } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { useProductTags } from '@/hooks/useProductTags';
import { fetchProducts, ShopifyProduct } from '@/lib/shopify';

// Available icons for selection
const ICON_OPTIONS = [
    { value: 'Flame', label: 'Fuego', component: Flame },
    { value: 'Zap', label: 'Rayo', component: Zap },
    { value: 'Gift', label: 'Regalo', component: Gift },
    { value: 'Sparkles', label: 'Brillos', component: Sparkles },
    { value: 'Star', label: 'Estrella', component: Star },
    { value: 'Heart', label: 'Corazón', component: Heart },
    { value: 'TrendingUp', label: 'Tendencia', component: TrendingUp },
    { value: 'Clock', label: 'Reloj', component: Clock },
    { value: 'ShoppingBag', label: 'Bolsa', component: ShoppingBag },
];

const COLOR_OPTIONS = [
    { value: 'amber', label: 'Ámbar (Naranja)', class: 'bg-amber-100 text-amber-800' },
    { value: 'purple', label: 'Púrpura', class: 'bg-purple-100 text-purple-800' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', label: 'Verde', class: 'bg-green-100 text-green-800' },
    { value: 'rose', label: 'Rosa', class: 'bg-rose-100 text-rose-800' },
    { value: 'slate', label: 'Gris', class: 'bg-slate-100 text-slate-800' },
];

const ImageCarousel = ({ images, interval = 2000 }: { images: string[], interval?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            i === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
};

export interface HomeModule {
    id: string;
    title: string;
    icon: string;
    tag_filter: string;
    color_theme: string;
    display_order: number;
    is_active: boolean;
}

export function HomeModulesEditor() {
    const [modules, setModules] = useState<HomeModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentModule, setCurrentModule] = useState<Partial<HomeModule>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Product management inside module
    const { getProductsForTag, assignTag, removeTag, getTagsForProduct, tags: allTags } = useProductTags();
    const [moduleProducts, setModuleProducts] = useState<ShopifyProduct[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const fetchModules = async () => {
        setLoading(true);
        const { data, error } = await (supabase as any)
            .from('home_modules')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) {
            toast.error("Error cargando módulos");
            console.error(error);
        } else {
            setModules(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchModules();
        // Pre-fetch products for search
        fetchProducts(300).then(setAllProducts);
    }, []);

    // Fetch products for current module tag
    useEffect(() => {
        if (currentModule.tag_filter && dialogOpen) {
            const productIds = getProductsForTag(currentModule.tag_filter);
            const foundProducts = allProducts.filter(p => productIds.includes(p.node.id));
            setModuleProducts(foundProducts);
        }
    }, [currentModule.tag_filter, dialogOpen, allProducts, getProductsForTag]);

    const handleSave = async () => {
        if (!currentModule.title || !currentModule.tag_filter) {
            toast.error("Título y Etiqueta son obligatorios");
            return;
        }

        const moduleData = {
            title: currentModule.title,
            icon: currentModule.icon || 'Star',
            tag_filter: currentModule.tag_filter,
            color_theme: currentModule.color_theme || 'amber',
            is_active: currentModule.is_active ?? true,
            display_order: currentModule.display_order ?? modules.length + 1
        };

        let error;
        if (currentModule.id) {
            const { error: updateError } = await (supabase as any)
                .from('home_modules')
                .update(moduleData)
                .eq('id', currentModule.id);
            error = updateError;
        } else {
            const { error: insertError } = await (supabase as any)
                .from('home_modules')
                .insert(moduleData);
            error = insertError;
        }

        if (error) {
            toast.error("Error al guardar módulo");
            console.error(error);
        } else {
            toast.success("Módulo guardado");
            setDialogOpen(false);
            fetchModules();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este módulo?")) return;
        
        const { error } = await (supabase as any)
            .from('home_modules')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Error al eliminar");
        } else {
            toast.success("Módulo eliminado");
            fetchModules();
        }
    };

    const handleReorder = async (newOrder: HomeModule[]) => {
        setModules(newOrder);
        const updates = newOrder.map((m, index) => ({
            id: m.id,
            display_order: index + 1
        }));

        for (const update of updates) {
             await (supabase as any)
                .from('home_modules')
                .update({ display_order: update.display_order })
                .eq('id', update.id);
        }
    };

    const handleAddProductToModule = async (product: ShopifyProduct) => {
        if (!currentModule.tag_filter) return;
        
        // Find tag ID for the filter string
        const tag = allTags.find(t => t.name === currentModule.tag_filter);
        if (!tag) {
            // Tag doesn't exist in DB yet, create or warn?
            // Assuming tag exists or we just rely on Shopify string tags?
            // The hook 'assignTag' requires ID.
            toast.error(`La etiqueta "${currentModule.tag_filter}" no existe en el sistema de etiquetas. Créala primero.`);
            return;
        }

        try {
            await assignTag(product.node.id, tag.id);
            toast.success("Producto añadido al módulo");
            // Refresh list
            const updatedProducts = [...moduleProducts, product];
            setModuleProducts(updatedProducts);
        } catch (e) {
            toast.error("Error añadiendo producto");
        }
    };

    const handleRemoveProductFromModule = async (productId: string) => {
         if (!currentModule.tag_filter) return;
         const tag = allTags.find(t => t.name === currentModule.tag_filter);
         if (!tag) return;

         try {
             await removeTag(productId, tag.id);
             toast.success("Producto eliminado del módulo");
             setModuleProducts(moduleProducts.filter(p => p.node.id !== productId));
         } catch (e) {
             toast.error("Error eliminando producto");
         }
    };

    const openNew = () => {
        setCurrentModule({
            title: '',
            icon: 'Star',
            tag_filter: '',
            color_theme: 'amber',
            is_active: true
        });
        setIsEditing(false);
        setDialogOpen(true);
        setModuleProducts([]);
    };

    const openEdit = (module: HomeModule) => {
        setCurrentModule(module);
        setIsEditing(true);
        setDialogOpen(true);
    };

    const getIconComponent = (iconName: string) => {
        const icon = ICON_OPTIONS.find(i => i.value === iconName);
        return icon ? icon.component : Star;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Módulos de Inicio</h2>
                    <p className="text-muted-foreground">Gestiona las secciones destacadas de la página principal.</p>
                </div>
                <Button onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Módulo
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Reorder.Group axis="y" values={modules} onReorder={handleReorder} className="space-y-4">
                        {modules.map((module) => {
                            const Icon = getIconComponent(module.icon);
                            return (
                                <Reorder.Item key={module.id} value={module}>
                                    <Card className="cursor-grab active:cursor-grabbing">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="cursor-grab text-muted-foreground">
                                                <GripVertical className="h-5 w-5" />
                                            </div>
                                            
                                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                                                module.color_theme === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                module.color_theme === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                module.color_theme === 'green' ? 'bg-green-100 text-green-600' :
                                                module.color_theme === 'rose' ? 'bg-rose-100 text-rose-600' :
                                                module.color_theme === 'slate' ? 'bg-slate-100 text-slate-600' :
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{module.title}</h3>
                                                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                    <span>Tag: <code className="bg-muted px-1 rounded">{module.tag_filter}</code></span>
                                                    <span>•</span>
                                                    <span className={module.is_active ? "text-green-600" : "text-muted-foreground"}>
                                                        {module.is_active ? "Activo" : "Inactivo"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setCurrentModule(module);
                                                    setShowPreview(true);
                                                }}>
                                                    <Eye className="h-4 w-4 mr-2" /> Preview
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(module)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(module.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Módulo' : 'Nuevo Módulo'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título del Módulo</Label>
                                    <Input 
                                        id="title" 
                                        value={currentModule.title || ''} 
                                        onChange={e => setCurrentModule({...currentModule, title: e.target.value})}
                                        placeholder="Ej. TOP VENTAS"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tag">Etiqueta (Tag de Shopify)</Label>
                                    <Input 
                                        id="tag" 
                                        value={currentModule.tag_filter || ''} 
                                        onChange={e => setCurrentModule({...currentModule, tag_filter: e.target.value})}
                                        placeholder="Ej. Top, Ofertas, Nuevos..."
                                    />
                                    <p className="text-xs text-muted-foreground">Los productos con esta etiqueta aparecerán en este módulo.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Icono</Label>
                                        <Select 
                                            value={currentModule.icon} 
                                            onValueChange={v => setCurrentModule({...currentModule, icon: v})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona icono" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ICON_OPTIONS.map(opt => {
                                                    const Icon = opt.component;
                                                    return (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4" />
                                                                {opt.label}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Color Tema</Label>
                                        <Select 
                                            value={currentModule.color_theme} 
                                            onValueChange={v => setCurrentModule({...currentModule, color_theme: v})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona color" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COLOR_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full ${opt.class.split(' ')[0]}`}></div>
                                                            {opt.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={currentModule.is_active}
                                        onCheckedChange={c => setCurrentModule({...currentModule, is_active: c})}
                                    />
                                    <Label>Módulo Activo</Label>
                                </div>
                            </div>
                            
                            <div className="space-y-4 border-l pl-4">
                                <Label className="text-lg">Productos en este módulo</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Buscar para añadir..." 
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                </div>
                                
                                {productSearch && (
                                    <div className="border rounded-md max-h-40 overflow-y-auto bg-muted/50 p-2 space-y-1">
                                        {allProducts
                                            .filter(p => p.node.title.toLowerCase().includes(productSearch.toLowerCase()))
                                            .filter(p => !moduleProducts.some(mp => mp.node.id === p.node.id))
                                            .slice(0, 5)
                                            .map(p => (
                                                <div key={p.node.id} className="flex justify-between items-center text-sm p-1 hover:bg-white rounded cursor-pointer" onClick={() => {
                                                    handleAddProductToModule(p);
                                                    setProductSearch('');
                                                }}>
                                                    <span className="truncate">{p.node.title}</span>
                                                    <Plus className="h-3 w-3" />
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {moduleProducts.length === 0 ? (
                                        <p className="text-muted-foreground text-sm italic">No hay productos con la etiqueta "{currentModule.tag_filter}"</p>
                                    ) : (
                                        moduleProducts.map(product => (
                                            <div key={product.node.id} className="flex items-center gap-2 p-2 bg-card border rounded-md group">
                                                <img src={product.node.images.edges[0]?.node.url} className="h-8 w-8 rounded object-cover" />
                                                <span className="text-sm truncate flex-1">{product.node.title}</span>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                    onClick={() => handleRemoveProductFromModule(product.node.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50">
                    <DialogHeader>
                        <DialogTitle>Vista Previa: {currentModule.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 px-4">
                        {currentModule.tag_filter && (
                            <HomeModuleRenderer 
                                module={currentModule as HomeModule} 
                                products={allProducts}
                                getProductsForTag={getProductsForTag}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function HomeModuleRenderer({ module, products, getProductsForTag }: { module: HomeModule, products: ShopifyProduct[], getProductsForTag: (tag: string) => any[] }) {
    const moduleProducts = products.filter(p => {
        const assignedIds = getProductsForTag(module.tag_filter);
        const simpleId = p.node.id.replace('gid://shopify/Product/', '');
        return assignedIds.includes(p.node.id) || assignedIds.includes(simpleId);
    });
    
    const Icon = ICON_OPTIONS.find(i => i.value === module.icon)?.component || Star;
    
    const colorClass = module.color_theme === 'purple' ? 'text-purple-400' :
                       module.color_theme === 'blue' ? 'text-blue-400' :
                       module.color_theme === 'green' ? 'text-green-400' :
                       module.color_theme === 'rose' ? 'text-rose-400' :
                       module.color_theme === 'slate' ? 'text-slate-400' :
                       'text-amber-400';

    const bgClass = module.color_theme === 'purple' ? 'from-purple-500/10 to-transparent' :
                       module.color_theme === 'blue' ? 'from-blue-500/10 to-transparent' :
                       module.color_theme === 'green' ? 'from-green-500/10 to-transparent' :
                       module.color_theme === 'rose' ? 'from-rose-500/10 to-transparent' :
                       module.color_theme === 'slate' ? 'from-slate-500/10 to-transparent' :
                       'from-amber-500/10 to-transparent';

    return (
        <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${bgClass} p-5 h-full min-h-[380px] flex flex-col`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <Icon className={`h-5 w-5 ${colorClass}`} />
                <h3 className="font-display text-lg md:text-xl font-bold tracking-wide">{module.title}</h3>
            </div>

            {/* Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3 flex-1">
                {moduleProducts.slice(0, 4).map((product: any) => {
                    const productImages = product.node.images.edges.map((e: any) => e.node.url);
                    return (
                        <a key={product.node.id} href={`/product/${product.node.handle}`} className="group relative aspect-square rounded-lg overflow-hidden bg-background/50 border border-black/5 hover:border-black/10 transition-colors">
                            <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                                <ImageCarousel images={productImages} interval={3000 + Math.random() * 2000} />
                            </div>
                            {/* Hot Badge for first item if relevant */}
                            {module.tag_filter.toLowerCase().includes('oferta') && (
                                <div className="absolute bottom-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">HOT</div>
                            )}
                        </a>
                    );
                })}
                {/* Fillers if less than 4 */}
                {Array.from({ length: Math.max(0, 4 - moduleProducts.length) }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted/20 flex items-center justify-center border border-dashed border-muted/30">
                        <span className="text-xs text-muted-foreground/30">Empty</span>
                    </div>
                ))}
            </div>

            {/* Footer Link */}
            <div className="mt-6 pt-4 border-t border-border/10">
                <a href={`/products?tag=${module.tag_filter}`} className={`text-sm font-medium hover:underline flex items-center gap-1 ${colorClass}`}>
                    {module.tag_filter.toLowerCase().includes('oferta') ? 'Ver ofertas' : 
                     module.tag_filter.toLowerCase().includes('nuevo') ? 'Explorar' :
                     module.tag_filter.toLowerCase().includes('coleccion') ? 'Ver colección' :
                     'Ver más'} <ChevronRight className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}

export function HomeModules({ products, getProductsForTag, loading }: { products: any[], getProductsForTag: (tag: string) => any[], loading: boolean }) {
    const [modules, setModules] = useState<HomeModule[]>([]);
    
    useEffect(() => {
        const fetchModules = async () => {
            const { data } = await (supabase as any)
                .from('home_modules')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (data) setModules(data);
        };
        fetchModules();
    }, []);

    if (loading && modules.length === 0) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-xl bg-muted/20 animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map(module => (
                <HomeModuleRenderer 
                    key={module.id} 
                    module={module} 
                    products={products}
                    getProductsForTag={getProductsForTag}
                />
            ))}
        </div>
    );
}
