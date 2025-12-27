import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCollections } from "@/hooks/useCollections";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Package, Check, X, GripVertical, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function CollectionsPanel() {
  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    addProductToCollection,
    removeProductFromCollection,
    getProductsForCollection
  } = useCollections();

  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Form states
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Product assignment dialog
  const [assigningCollectionId, setAssigningCollectionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts(100);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (collectionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-price-yellow"></div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsCreating(true);
    try {
      await createCollection(newName, newDescription || undefined, newImageUrl || undefined);
      toast.success("Colección creada");
      setNewName("");
      setNewDescription("");
      setNewImageUrl("");
    } catch (error) {
      toast.error("Error al crear la colección");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateCollection(id, {
        name: editName,
        description: editDescription || null,
        image_url: editImageUrl || null
      });
      toast.success("Colección actualizada");
      setEditingId(null);
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta colección? Se eliminarán también los productos asignados.")) return;
    
    try {
      await deleteCollection(id);
      toast.success("Colección eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      await updateCollection(id, { is_active: !currentValue });
      toast.success(currentValue ? "Colección desactivada" : "Colección activada");
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleToggleProduct = async (collectionId: string, productId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await removeProductFromCollection(collectionId, productId);
      } else {
        await addProductToCollection(collectionId, productId);
      }
    } catch (error) {
      toast.error("Error al modificar productos");
    }
  };

  const startEditing = (collection: typeof collections[0]) => {
    setEditingId(collection.id);
    setEditName(collection.name);
    setEditDescription(collection.description || "");
    setEditImageUrl(collection.image_url || "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Colecciones</h1>
          <p className="text-muted-foreground mt-2">Crea packs de productos para mostrar en la tienda</p>
        </div>
      </div>

      {/* Create new collection form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-price-yellow" />
          Nueva Colección
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Pack Verano"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">URL de imagen</Label>
            <Input
              id="imageUrl"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descripción de la colección..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={isCreating || !newName.trim()}
          className="mt-4"
          variant="hero"
        >
          {isCreating ? "Creando..." : "Crear Colección"}
        </Button>
      </div>

      {/* Collections list */}
      <div className="space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay colecciones creadas</p>
          </div>
        ) : (
          collections.map((collection) => {
            const assignedProductIds = getProductsForCollection(collection.id);
            const isEditing = editingId === collection.id;

            return (
              <div
                key={collection.id}
                className={`bg-card border rounded-xl p-5 transition-colors ${
                  collection.is_active ? "border-border" : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Image preview */}
                    <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {collection.image_url ? (
                        <img src={collection.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nombre"
                          />
                          <Input
                            value={editImageUrl}
                            onChange={(e) => setEditImageUrl(e.target.value)}
                            placeholder="URL de imagen"
                          />
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Descripción"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdate(collection.id)}>
                              <Check className="h-4 w-4 mr-1" /> Guardar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-foreground text-lg">{collection.name}</h3>
                          {collection.description && (
                            <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {assignedProductIds.length} productos · Slug: {collection.slug}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        <Switch
                          checked={collection.is_active}
                          onCheckedChange={() => handleToggleActive(collection.id, collection.is_active)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {collection.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssigningCollectionId(collection.id)}
                          >
                            <GripVertical className="h-4 w-4 mr-1" />
                            Productos
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Productos en "{collection.name}"</DialogTitle>
                            <p className="text-sm text-muted-foreground">Gestiona los productos asignados a esta colección</p>
                          </DialogHeader>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                            {productsLoading ? (
                              <p className="col-span-full text-center text-muted-foreground">Cargando...</p>
                            ) : (
                              products.map((product) => {
                                const isAssigned = assignedProductIds.includes(product.node.id);
                                return (
                                  <button
                                    key={product.node.id}
                                    onClick={() => handleToggleProduct(collection.id, product.node.id, isAssigned)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                      isAssigned
                                        ? "border-price-yellow ring-2 ring-price-yellow/30"
                                        : "border-border hover:border-border/80"
                                    }`}
                                  >
                                    <div className="aspect-square">
                                      <img
                                        src={product.node.images.edges[0]?.node.url}
                                        alt={product.node.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="p-2 bg-card">
                                      <p className="text-xs font-medium text-foreground line-clamp-1">
                                        {product.node.title}
                                      </p>
                                    </div>
                                    {isAssigned && (
                                      <div className="absolute top-2 right-2 bg-price-yellow text-background rounded-full p-1">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(collection)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(collection.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
