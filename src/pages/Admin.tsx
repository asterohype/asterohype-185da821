import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useProductTags, ProductTag } from '@/hooks/useProductTags';
import { fetchProducts, ShopifyProduct, updateProductTitle, updateProductPrice, formatPrice, deleteProduct } from '@/lib/shopify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Tag, Search, Shield, Check, ChevronDown, ChevronRight, Pencil, X, Save, DollarSign, Package, Trash2, LayoutDashboard, ListTodo, Star, BarChart3, Settings, Sparkles, Bell } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TesterCodesManager } from '@/components/admin/TesterCodesManager';
import { TesterEvaluationPanel } from '@/components/admin/TesterEvaluationPanel';
import { EditStatusRegistry } from '@/components/admin/EditStatusRegistry';
import { EditStatusChecklist } from '@/components/admin/EditStatusChecklist';
import { NewProductsPanel } from '@/components/admin/NewProductsPanel';
import { CollectionsPanel } from '@/components/admin/CollectionsPanel';
import { OverridesPanel } from '@/components/admin/OverridesPanel';
import { ModoIAPanel } from '@/components/admin/ModoIAPanel';
import { StockRequestsPanel } from '@/components/admin/StockRequestsPanel';
import { VariantsPricePanel } from '@/components/admin/VariantsPricePanel';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from "@/components/auth/AuthProvider";

const TAG_GROUPS = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];

type AdminTab = 'dashboard' | 'tags' | 'collections' | 'overrides' | 'costs' | 'evaluations' | 'edit-registry' | 'settings' | 'modo-ia' | 'requests';

import { motion } from 'framer-motion';

// Simple Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Admin Panel Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Error en el Panel de Administración</h2>
          <p className="text-muted-foreground mb-4">Ha ocurrido un error inesperado.</p>
          <pre className="bg-muted p-4 rounded text-xs text-left overflow-auto max-w-lg mx-auto mb-4">
            {this.state.error?.message}
          </pre>
          <Button onClick={() => window.location.reload()}>Recargar Página</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { tags, loading: tagsLoading, getTagsForProduct, getTagsByGroup, assignTag, removeTag, createTag, deleteTag, updateTag, refetch } = useProductTags();
  
  const tagsByGroup = getTagsByGroup(); // Get the grouped object once

  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagGroup, setNewTagGroup] = useState('General');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
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
  const [variantsPanelProductId, setVariantsPanelProductId] = useState<string | null>(null);
  const [tagManagerProductId, setTagManagerProductId] = useState<string | null>(null);
  const [showAdminRequest, setShowAdminRequest] = useState(false);
  const [showNewProductsPanel, setShowNewProductsPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [secretCode, setSecretCode] = useState('');
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const toggleAdminMode = () => setIsAdminModeActive(!isAdminModeActive);

  const handleSecretCodeSubmit = () => {
    if (secretCode === 'CIoMaaffsiXXfledd11978') {
      localStorage.setItem('asterohype_admin_override', 'true');
      toast.success('Acceso de administrador concedido');
      window.location.reload();
    } else {
      toast.error('Código incorrecto');
    }
  };

  // Tab management
  const currentTab = (searchParams.get('tab') as AdminTab) || 'dashboard';
  const setTab = (tab: AdminTab) => setSearchParams({ tab });

  // Check auth status
  useEffect(() => {
    if (!authLoading) {
      setIsAuthenticated(!!user);
    }
  }, [user, authLoading]);

  // If not admin and authenticated, show request modal option
  useEffect(() => {
    if (!adminLoading && !isAdmin && isAuthenticated) {
      setShowAdminRequest(true);
    }
  }, [isAdmin, adminLoading, isAuthenticated]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(5000);
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Error al cargar productos. Por favor recarga la página.');
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p => 
    p.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.node.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- Handlers ---
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag(newTagName, newTagGroup);
      setNewTagName('');
      toast.success('Etiqueta creada');
    } catch (error) {
      toast.error('Error al crear etiqueta');
    }
  };

  const handleUpdateTitle = async (productId: string) => {
    if (!editedTitle.trim()) return;
    setSavingProduct(productId);
    try {
      const result = await updateProductTitle(productId, editedTitle);
      if (result.ok) {
        setProducts(prev => prev.map(p => 
          p.node.id === productId ? { ...p, node: { ...p.node, title: editedTitle } } : p
        ));
        setEditingProduct(null);
        toast.success('Título actualizado');
      } else {
        toast.error(result.message || 'Error al actualizar título');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar título');
    } finally {
      setSavingProduct(null);
    }
  };

  const handleUpdatePrice = async (productId: string, variantId: string) => {
    if (!editedPrice.trim()) return;
    setSavingProduct(productId);
    try {
      const result = await updateProductPrice(productId, variantId, editedPrice);
      if (result.ok) {
        setProducts(prev => prev.map(p => {
          if (p.node.id === productId) {
            const updatedVariants = p.node.variants.edges.map(v => 
              v.node.id === variantId ? { 
                ...v, 
                node: { 
                  ...v.node, 
                  price: { ...v.node.price, amount: editedPrice } 
                } 
              } : v
            );
            return { ...p, node: { ...p.node, variants: { edges: updatedVariants } } };
          }
          return p;
        }));
        setEditingPrice(null);
        toast.success('Precio actualizado');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar precio');
    } finally {
      setSavingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProduct(productId);
    try {
      const result = await deleteProduct(productId);
      if (result.ok) {
        setProducts(prev => prev.filter(p => p.node.id !== productId));
        toast.success('Producto eliminado de Shopify');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar producto');
    } finally {
      setDeletingProduct(null);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCost = (productId: string) => {
    setExpandedCosts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Restringido</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Esta área está reservada para administradores. Si crees que deberías tener acceso, solicita permisos.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>Volver al Inicio</Button>
            {isAuthenticated ? (
              <Button onClick={() => setShowAdminRequest(true)}>Solicitar Acceso</Button>
            ) : (
              <Link to="/auth?redirect=/admin">
                <Button>Iniciar Sesión</Button>
              </Link>
            )}
          </div>
        </main>
        <AdminRequestModal open={showAdminRequest} onOpenChange={setShowAdminRequest} />
        <Footer />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <div className="flex flex-col md:flex-row flex-1 container mx-auto px-4 py-8 mt-20 md:mt-24 gap-8">
          {/* Mobile Tab Selector */}
          <div className="md:hidden w-full mb-4">
             <Select value={currentTab} onValueChange={(val) => setTab(val as AdminTab)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Resumen & Productos</SelectItem>
                <SelectItem value="edit-registry">Estado de Edición</SelectItem>
                <SelectItem value="tags">Etiquetas</SelectItem>
                <SelectItem value="collections">Colecciones</SelectItem>
                <SelectItem value="overrides">Personalización</SelectItem>
                <SelectItem value="modo-ia">Modo IA</SelectItem>
                <SelectItem value="costs">Costes & Beneficio</SelectItem>
                <SelectItem value="evaluations">Evaluaciones</SelectItem>
                <SelectItem value="requests">Solicitudes Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-28 space-y-2">
              <div className="mb-6 px-4">
                <h2 className="text-lg font-semibold tracking-tight">Panel Admin</h2>
                <p className="text-sm text-muted-foreground mb-4">Gestión de tienda</p>
                
                <Button 
                  variant={isAdminModeActive ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start gap-2 mb-2"
                  onClick={() => {
                    toggleAdminMode();
                    toast.success(isAdminModeActive ? 'Edición visual desactivada' : 'Edición visual activada');
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {isAdminModeActive ? 'Edición Visual: ON' : 'Edición Visual: OFF'}
                </Button>
              </div>
              
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Resumen & Productos', icon: LayoutDashboard },
                  { id: 'edit-registry', label: 'Registro de Edición', icon: ListTodo },
                  { id: 'evaluations', label: 'Evaluación Testers', icon: Star },
                  { id: 'requests', label: 'Solicitudes Stock', icon: Bell },
                  { id: 'modo-ia', label: 'MODO IA', icon: Sparkles, className: 'text-purple-600 font-medium' },
                  { id: 'tags', label: 'Etiquetas', icon: Tag },
                  { id: 'collections', label: 'Colecciones', icon: Package },
                  { id: 'overrides', label: 'Overrides Precio', icon: DollarSign },
                  { id: 'costs', label: 'Costes & CJ', icon: DollarSign },
                  { id: 'settings', label: 'Configuración', icon: Settings },
                ].map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Button 
                      variant={currentTab === item.id ? 'secondary' : 'ghost'} 
                      className={`w-full justify-start ${item.className || ''}`}
                      onClick={() => setTab(item.id as AdminTab)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile Navigation (Dropdown) - REMOVED DUPLICATE */}
          
          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            
            {/* Dashboard Tab (Original Product Management) */}
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Mobile Title & Actions */}
                <div className="md:hidden flex flex-col gap-4 mb-6">
                   <h1 className="text-2xl font-bold font-display italic uppercase">Gestión de Productos</h1>
                   <div className="flex flex-wrap gap-2">
                     <Button onClick={() => setShowNewProductsPanel(true)} className="flex-1 bg-primary text-primary-foreground text-sm h-10">
                       <Plus className="mr-1 h-4 w-4" /> Nuevos
                     </Button>
                     <Button variant="outline" onClick={toggleAdminMode} className={`flex-1 text-sm h-10 ${isAdminModeActive ? 'bg-primary/10 border-primary text-primary' : ''}`}>
                       <Pencil className="mr-1 h-4 w-4" /> {isAdminModeActive ? 'Edición ON' : 'Edición OFF'}
                     </Button>
                   </div>
                   <Input
                      placeholder="Buscar productos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 text-base"
                    />
                </div>

                <div className="hidden md:flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Gestión de Productos</h1>
                  <Button onClick={() => setShowNewProductsPanel(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevos Productos
                  </Button>
                </div>
                <NewProductsPanel open={showNewProductsPanel} onOpenChange={setShowNewProductsPanel} />
                
                {variantsPanelProductId && (
                  <VariantsPricePanel 
                    open={!!variantsPanelProductId} 
                    onOpenChange={(open) => !open && setVariantsPanelProductId(null)}
                    productId={variantsPanelProductId}
                    productTitle={products.find(p => p.node.id === variantsPanelProductId)?.node.title || ''}
                    initialVariants={products.find(p => p.node.id === variantsPanelProductId)?.node.variants.edges || []}
                    images={products.find(p => p.node.id === variantsPanelProductId)?.node.images.edges || []}
                    onVariantsUpdated={(updatedVariants) => {
                      setProducts(prev => prev.map(p => 
                        p.node.id === variantsPanelProductId
                          ? { ...p, node: { ...p.node, variants: { edges: updatedVariants } } }
                          : p
                      ));
                    }}
                  />
                )}

                {/* Tag Manager Dialog */}
                {tagManagerProductId && (
                  <Dialog open={!!tagManagerProductId} onOpenChange={(open) => !open && setTagManagerProductId(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Gestionar Etiquetas: {products.find(p => p.node.id === tagManagerProductId)?.node.title}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {TAG_GROUPS.map(group => (
                          <div key={group} className="border p-3 rounded-lg bg-card/50">
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase text-[10px] tracking-wider">{group}</h4>
                            <div className="flex flex-wrap gap-2">
                              {(tagsByGroup[group] || []).map(tag => {
                                const isAssigned = getTagsForProduct(tagManagerProductId).some(t => t.id === tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    onClick={async () => {
                                      if (isAssigned) await removeTag(tag.id, tagManagerProductId);
                                      else await assignTag(tag.id, tagManagerProductId);
                                    }}
                                    className={`text-xs px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                                      isAssigned 
                                        ? 'bg-price-yellow text-black border-price-yellow font-bold shadow-sm' 
                                        : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                                    }`}
                                  >
                                    {tag.name}
                                    {isAssigned && <Check className="h-3 w-3" />}
                                  </button>
                                );
                              })}
                              {(tagsByGroup[group] || []).length === 0 && (
                                <span className="text-xs text-muted-foreground italic">Sin etiquetas</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <div className="hidden md:flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar productos..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {productsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <div key={product.node.id} className="border rounded-lg bg-card hover:bg-accent/5 transition-colors h-full flex flex-col">
                          <CardContent className="p-3 flex flex-col h-full gap-3">
                            {/* Product Image - Optimized for Grid */}
                            <div className="w-full aspect-square bg-muted rounded-md overflow-hidden flex-shrink-0 relative group">
                              {product.node.images.edges[0] ? (
                                <img 
                                  src={product.node.images.edges[0].node.url} 
                                  alt={product.node.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Package className="h-8 w-8" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link to={`/product/${product.node.handle}`}>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                              {editingProduct === product.node.id ? (
                                <div className="flex flex-col gap-2">
                                  <Input 
                                    value={editedTitle} 
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateTitle(product.node.id);
                                      if (e.key === 'Escape') setEditingProduct(null);
                                    }}
                                  />
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" onClick={() => handleUpdateTitle(product.node.id)} disabled={!!savingProduct} className="h-7 px-2">
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingProduct(null)} className="h-7 px-2">
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <h3 className="font-bold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors" onClick={() => {
                                  setEditingProduct(product.node.id);
                                  setEditedTitle(product.node.title || '');
                                }}>
                                  {product.node.title || 'Sin título'}
                                </h3>
                              )}

                              <div className="flex items-center justify-between mt-auto pt-2 border-t">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Price:</span>
                                    {editingPrice === product.node.variants.edges[0]?.node.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input 
                                          value={editedPrice} 
                                          onChange={(e) => setEditedPrice(e.target.value)}
                                          className="h-6 w-14 px-1 text-xs"
                                        />
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdatePrice(product.node.id, product.node.variants.edges[0].node.id)}>
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span 
                                        className="font-bold text-sm cursor-pointer hover:underline"
                                        onClick={() => {
                                          setEditingPrice(product.node.variants.edges[0]?.node.id);
                                          setEditedPrice(product.node.variants.edges[0]?.node.price.amount || '0');
                                        }}
                                      >
                                        {formatPrice(product.node.priceRange.minVariantPrice.amount)}
                                      </span>
                                    )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1 mt-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => setVariantsPanelProductId(product.node.id)}
                                    title="Variantes"
                                  >
                                    <ListTodo className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 ${getTagsForProduct(product.node.id).some(t => t.name === 'Destacado') ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                    onClick={() => {
                                      const isFeatured = getTagsForProduct(product.node.id).some(t => t.name === 'Destacado');
                                      const featuredTag = tags.find(t => t.name === 'Destacado');
                                      if (featuredTag) {
                                        if (isFeatured) removeTag(featuredTag.id, product.node.id);
                                        else assignTag(featuredTag.id, product.node.id);
                                      }
                                    }}
                                  >
                                    <Star className={`h-3 w-3 ${getTagsForProduct(product.node.id).some(t => t.name === 'Destacado') ? 'fill-current' : ''}`} />
                                  </Button>

                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                          <AlertDialogDescription>Esta acción eliminará "{product.node.title}" de Shopify.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteProduct(product.node.id)} className="bg-destructive">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Registry Tab */}
            {currentTab === 'edit-registry' && (
              <EditStatusRegistry products={products} />
            )}

            {/* Evaluations Tab */}
            {currentTab === 'evaluations' && (
              <TesterEvaluationPanel products={products} />
            )}

            {/* MODO IA Tab */}
            {currentTab === 'modo-ia' && (
              <ModoIAPanel products={products} />
            )}

            {/* Collections Tab */}
            {currentTab === 'collections' && (
              <CollectionsPanel />
            )}

            {/* Overrides Tab */}
            {currentTab === 'overrides' && (
              <OverridesPanel />
            )}

            {/* Tags Tab */}
            {currentTab === 'tags' && (
              <div className="space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold">Gestión de Etiquetas</h1>
                
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader className="pb-3 md:pb-6">
                      <CardTitle>Crear Nueva Etiqueta</CardTitle>
                      <CardDescription>Añade nuevas etiquetas al sistema para categorizar productos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-end">
                        <div className="space-y-2 flex-1">
                          <label className="text-sm font-medium">Nombre</label>
                          <Input 
                            value={newTagName} 
                            onChange={(e) => setNewTagName(e.target.value)} 
                            placeholder="Ej: Verano 2024" 
                          />
                        </div>
                        <div className="space-y-2 w-full md:w-48">
                          <label className="text-sm font-medium">Grupo</label>
                          <Select value={newTagGroup} onValueChange={setNewTagGroup}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAG_GROUPS.map(g => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateTag} className="w-full md:w-auto">
                          <Plus className="h-4 w-4 mr-2" /> Crear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {TAG_GROUPS.map(group => (
                    <Card key={group}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{group}</CardTitle>
                          <Badge variant="secondary">{(tagsByGroup[group] || []).length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          {(tagsByGroup[group] || []).map(tag => (
                            <div key={tag.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md group">
                            {editingTagId === tag.id ? (
                               <div className="flex items-center gap-2 flex-1">
                                 <Input 
                                   value={editingTagName} 
                                   onChange={(e) => setEditingTagName(e.target.value)}
                                   className="h-7 text-sm"
                                 />
                                 <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => {
                                   if (editingTagName.trim()) {
                                     updateTag(tag.id, editingTagName.trim());
                                     setEditingTagId(null);
                                   }
                                 }}>
                                   <Check className="h-3 w-3" />
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setEditingTagId(null)}>
                                   <X className="h-3 w-3" />
                                 </Button>
                               </div>
                            ) : (
                              <>
                                <span className="text-sm">{tag.name}</span>
                                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-blue-500" 
                                    onClick={() => {
                                      setEditingTagId(tag.id);
                                      setEditingTagName(tag.name);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-destructive" 
                                    onClick={() => {
                                      if (confirm('¿Eliminar etiqueta?')) deleteTag(tag.id);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          ))}
                          {!tagsLoading && (tagsByGroup[group] || []).length === 0 && (
                            <span className="text-sm text-muted-foreground italic">Sin etiquetas</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Requests Tab */}
            {currentTab === 'requests' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Solicitudes de Stock</h1>
                <StockRequestsPanel />
              </div>
            )}

            {/* Costs Tab */}
            {currentTab === 'costs' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Gestión de Costes</h1>
                  <SyncCJCostsButton products={products} />
                </div>
                <div className="bg-muted p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Para gestionar los costes, ve a "Resumen & Productos" y despliega la opción "Gestionar Costes" en cada producto.
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {currentTab === 'settings' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Configuración</h1>
                <div className="grid gap-6 md:grid-cols-2">
                  <TesterCodesManager />
                  {/* More settings can go here */}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
