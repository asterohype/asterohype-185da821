import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useProductTags, ProductTag } from '@/hooks/useProductTags';
import { fetchProducts, ShopifyProduct } from '@/lib/shopify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Tag, Search, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { tags, loading: tagsLoading, getTagsForProduct, assignTag, removeTag, createTag, refetch } = useProductTags();
  
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      toast.error('Acceso denegado. Solo administradores.');
    }
  }, [isAdmin, adminLoading, navigate]);

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
      await createTag(newTagName.trim());
      setNewTagName('');
      toast.success(`Etiqueta "${newTagName}" creada`);
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

  const filteredProducts = products.filter(p => 
    p.node.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-price-yellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-price-yellow" />
            <h1 className="text-3xl font-display uppercase italic text-foreground">
              Panel de <span className="text-price-yellow">Administración</span>
            </h1>
          </div>

          {/* Create Tag Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Crear Nueva Etiqueta
            </h2>
            <div className="flex gap-3">
              <Input
                placeholder="Nombre de la etiqueta..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="max-w-xs"
              />
              <Button onClick={handleCreateTag} variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </div>
            
            {/* Existing Tags */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Etiquetas existentes:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="px-3 py-1">
                    {tag.name}
                  </Badge>
                ))}
              </div>
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
                      className="flex flex-col sm:flex-row gap-4 p-4 bg-secondary/30 rounded-lg border border-border/50"
                    >
                      {/* Product Info */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        <img 
                          src={product.node.images.edges[0]?.node.url}
                          alt={product.node.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground text-sm line-clamp-2">
                            {product.node.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {productTags.length > 0 
                              ? productTags.map(t => t.name).join(', ')
                              : 'Sin etiquetas'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Tags Selection */}
                      <div className="flex flex-wrap gap-1.5 items-start">
                        {isSaving && (
                          <Loader2 className="h-4 w-4 animate-spin text-price-yellow mr-2" />
                        )}
                        {tags.map(tag => {
                          const isSelected = productTags.some(t => t.id === tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => handleToggleTag(product.node.id, tag)}
                              disabled={isSaving}
                              className={`
                                text-xs px-2 py-1 rounded-full border transition-all
                                ${isSelected 
                                  ? 'bg-price-yellow text-background border-price-yellow' 
                                  : 'bg-transparent text-muted-foreground border-border hover:border-price-yellow/50'
                                }
                                disabled:opacity-50
                              `}
                            >
                              {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                              {tag.name}
                            </button>
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
