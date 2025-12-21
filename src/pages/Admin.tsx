import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useProductTags, ProductTag } from '@/hooks/useProductTags';
import { fetchProducts, ShopifyProduct, updateProductTitle, updateProductPrice, formatPrice, deleteProduct } from '@/lib/shopify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Tag, Search, Shield, Check, ChevronDown, ChevronRight, Pencil, X, Save, DollarSign, Package, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminRequestModal } from '@/components/admin/AdminRequestModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProductCostManager } from '@/components/admin/ProductCostManager';
import { SyncCJCostsButton } from '@/components/admin/SyncCJCostsButton';
import { supabase } from '@/integrations/supabase/client';

const TAG_GROUPS = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { tags, loading: tagsLoading, getTagsForProduct, getTagsByGroup, assignTag, removeTag, createTag, refetch } = useProductTags();
  
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagGroup, setNewTagGroup] = useState('General');
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'General': true,
    'Ropa Detallado': false,
    'Estilos': false,
    'Destacados': false
  });
  const [expandedCosts, setExpandedCosts] = useState<Record<string, boolean>>({});
  const [showAdminRequest, setShowAdminRequest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // If not admin and authenticated, show request modal option
  useEffect(() => {
    if (!adminLoading && !isAdmin && isAuthenticated) {
      setShowAdminRequest(true);
    }
  }, [isAdmin, adminLoading, isAuthenticated]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(250);
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag(newTagName.trim(), newTagGroup);
      setNewTagName('');
      toast.success(`Etiqueta "${newTagName}" creada en ${newTagGroup}`);
    } catch (error) {
      toast.error('Error al crear etiqueta');
    }
  };

  const handleToggleTag = async (productId: string, tag: ProductTag) => {
    setSavingProduct(productId);
    const currentTags = getTagsForProduct(productId);
    const hasTag = currentTags.some(t => t.id === tag.id);
    
    try {
      if (hasTag) {
        await removeTag(productId, tag.id);
      } else {
        await assignTag(productId, tag.id);
      }
    } catch (error) {
      toast.error('Error al actualizar etiqueta');
    } finally {
      setSavingProduct(null);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCosts = (productId: string) => {
    setExpandedCosts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const startEditing = (product: ShopifyProduct) => {
    setEditingProduct(product.node.id);
    setEditedTitle(product.node.title);
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setEditedTitle('');
  };

  const saveTitle = async (product: ShopifyProduct) => {
    if (!editedTitle.trim() || editedTitle === product.node.title) {
      cancelEditing();
      return;
    }

    setSavingProduct(product.node.id);
    try {
      const res = await updateProductTitle(product.node.id, editedTitle.trim());
      if (!res.ok) return;

      setProducts(prev => prev.map(p => 
        p.node.id === product.node.id 
          ? { ...p, node: { ...p.node, title: editedTitle.trim() } }
          : p
      ));
      toast.success('Nombre actualizado');
      cancelEditing();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el nombre');
    } finally {
      setSavingProduct(null);
    }
  };

  const startEditingPrice = (product: ShopifyProduct) => {
    setEditingPrice(product.node.id);
    setEditedPrice(product.node.priceRange.minVariantPrice.amount);
  };

  const cancelEditingPrice = () => {
    setEditingPrice(null);
    setEditedPrice('');
  };

  const savePrice = async (product: ShopifyProduct) => {
    const currentPrice = product.node.priceRange.minVariantPrice.amount;
    if (!editedPrice.trim() || editedPrice === currentPrice) {
      cancelEditingPrice();
      return;
    }

    const firstVariant = product.node.variants.edges[0]?.node;
    if (!firstVariant) {
      toast.error('No se encontró variante del producto');
      return;
    }

    setSavingProduct(product.node.id);
    try {
      const res = await updateProductPrice(product.node.id, firstVariant.id, editedPrice.trim());
      if (!res.ok) return;

      setProducts(prev => prev.map(p => 
        p.node.id === product.node.id 
          ? { 
              ...p, 
              node: { 
                ...p.node, 
                priceRange: {
                  ...p.node.priceRange,
                  minVariantPrice: {
                    ...p.node.priceRange.minVariantPrice,
                    amount: editedPrice.trim()
                  }
                }
              } 
            }
          : p
      ));
      toast.success('Precio actualizado');
      cancelEditingPrice();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar el precio');
    } finally {
      setSavingProduct(null);
    }
  };

  const handleDeleteProduct = async (product: ShopifyProduct) => {
    setDeletingProduct(product.node.id);
    try {
      await deleteProduct(product.node.id);
      setProducts(prev => prev.filter(p => p.node.id !== product.node.id));
      toast.success(`Producto "${product.node.title}" eliminado`);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setDeletingProduct(null);
    }
  };

  const tagsByGroup = getTagsByGroup();
  const filteredProducts = products.filter(p => 
    p.node.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (adminLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-price-yellow" />
      </div>
    );
  }

  // Show access request screen for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-md">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-fade-up">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-display uppercase italic text-foreground animate-fade-up" style={{ animationDelay: '100ms' }}>
                Acceso <span className="text-price-yellow">Administrador</span>
              </h1>
              <p className="text-muted-foreground animate-fade-up" style={{ animationDelay: '200ms' }}>
                {isAuthenticated 
                  ? "Necesitas permisos de administrador para acceder a esta sección."
                  : "Inicia sesión para solicitar acceso de administrador."
                }
              </p>
              {isAuthenticated ? (
                <Button 
                  onClick={() => setShowAdminRequest(true)} 
                  className="animate-fade-up"
                  style={{ animationDelay: '300ms' }}
                >
                  Solicitar Acceso Admin
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowAuthModal(true)} 
                  className="animate-fade-up"
                  style={{ animationDelay: '300ms' }}
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </main>
        <Footer />
        <AdminRequestModal open={showAdminRequest} onOpenChange={setShowAdminRequest} />
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-up">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-price-yellow" />
              <h1 className="text-3xl font-display uppercase italic text-foreground">
                Panel de <span className="text-price-yellow">Administración</span>
              </h1>
            </div>
            <SyncCJCostsButton products={products} />
          </div>

          {/* Create Tag Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Crear Nueva Etiqueta
            </h2>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Nombre de la etiqueta..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="max-w-xs"
              />
              <Select value={newTagGroup} onValueChange={setNewTagGroup}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {TAG_GROUPS.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateTag} variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </div>
            
            {/* Existing Tags by Group */}
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Etiquetas existentes:</p>
              {TAG_GROUPS.map(group => {
                const groupTags = tagsByGroup[group] || [];
                if (groupTags.length === 0) return null;
                return (
                  <div key={group} className="border border-border/50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <span className="font-medium text-sm text-foreground">{group}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{groupTags.length}</Badge>
                        {expandedGroups[group] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                    {expandedGroups[group] && (
                      <div className="flex flex-wrap gap-2 p-3 bg-background/50">
                        {groupTags.map(tag => (
                          <Badge 
                            key={tag.id} 
                            className="px-3 py-1.5 rounded-full font-medium shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200/80 hover:shadow-md hover:scale-105 transition-all cursor-default dark:from-amber-900/40 dark:to-orange-900/30 dark:text-amber-100 dark:border-amber-700/60"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Asignar Etiquetas a Productos
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>

            {productsLoading || tagsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredProducts.map(product => {
                  const productTags = getTagsForProduct(product.node.id);
                  const isSaving = savingProduct === product.node.id;
                  
                  return (
                    <div 
                      key={product.node.id}
                      className="flex flex-col gap-4 p-4 bg-secondary/30 rounded-lg border border-border/50"
                    >
                      {/* Product Info */}
                      <div className="flex gap-3">
                        <img 
                          src={product.node.images.edges[0]?.node.url}
                          alt={product.node.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          {editingProduct === product.node.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTitle(product);
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveTitle(product)}
                                disabled={isSaving}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground text-sm line-clamp-2">
                                {product.node.title}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(product)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {/* Price editing */}
                          {editingPrice === product.node.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">€</span>
                              <Input
                                value={editedPrice}
                                onChange={(e) => setEditedPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') savePrice(product);
                                  if (e.key === 'Escape') cancelEditingPrice();
                                }}
                                className="h-6 text-xs w-20"
                                type="number"
                                step="0.01"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => savePrice(product)}
                                disabled={isSaving}
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingPrice}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold text-price-yellow">
                                {formatPrice(product.node.priceRange.minVariantPrice.amount, product.node.priceRange.minVariantPrice.currencyCode)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingPrice(product)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {productTags.length > 0 
                              ? productTags.map(t => t.name).join(', ')
                              : 'Sin etiquetas'
                            }
                          </p>
                        </div>
                        {isSaving && (
                          <Loader2 className="h-4 w-4 animate-spin text-price-yellow flex-shrink-0" />
                        )}
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deletingProduct === product.node.id}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 flex-shrink-0"
                            >
                              {deletingProduct === product.node.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El producto "{product.node.title}" será eliminado permanentemente de Shopify.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Cost Management Toggle */}
                      <div className="border-t border-border/30 pt-3">
                        <button
                          onClick={() => toggleCosts(product.node.id)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Gestión de Costes CJ</span>
                          {expandedCosts[product.node.id] ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                        
                        {expandedCosts[product.node.id] && (
                          <div className="mt-3">
                            <ProductCostManager
                              shopifyProductId={product.node.id}
                              productTitle={product.node.title}
                              sellingPrice={parseFloat(product.node.priceRange.minVariantPrice.amount)}
                              currencyCode={product.node.priceRange.minVariantPrice.currencyCode}
                            />
                          </div>
                        )}
                      </div>

                      {/* Tags Selection by Group */}
                      <div className="space-y-2">
                        {TAG_GROUPS.map(group => {
                          const groupTags = tagsByGroup[group] || [];
                          if (groupTags.length === 0) return null;
                          
                          return (
                            <div key={group} className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 flex-shrink-0">
                                {group}:
                              </span>
                              {groupTags.map(tag => {
                                const isSelected = productTags.some(t => t.id === tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    onClick={() => handleToggleTag(product.node.id, tag)}
                                    disabled={isSaving}
                                    className={`
                                      text-xs px-3 py-1.5 rounded-full font-medium transition-all shadow-sm
                                      ${isSelected 
                                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 shadow-amber-200/50 dark:from-amber-800/60 dark:to-orange-800/50 dark:text-amber-50 dark:border-amber-600' 
                                        : 'bg-stone-100/80 text-stone-600 border border-stone-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:text-amber-800 hover:border-amber-200 hover:shadow-md dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-700 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 dark:hover:text-amber-200 dark:hover:border-amber-700'
                                      }
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                  >
                                    {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                                    {tag.name}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}