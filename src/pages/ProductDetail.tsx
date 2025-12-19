import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, fetchProducts, formatPrice, ShopifyProduct, updateProductTitle, updateProductPrice, updateProductDescription, deleteProductImage, addProductImage, deleteProduct } from "@/lib/shopify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "@/components/products/ProductCard";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useProductTags, ProductTag } from "@/hooks/useProductTags";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Minus, Plus, ShoppingBag, Check, Truck, Shield, RotateCcw, Tag, Pencil, Save, X, Trash2, ImagePlus } from "lucide-react";
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

const FADE_MS = 280;
const AUTOSLIDE_MS = 2200;

const TAG_GROUPS = ['General', 'Ropa Detallado', 'Estilos', 'Destacados'];

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [autoSlide, setAutoSlide] = useState(true);
  const [savingTag, setSavingTag] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImage, setShowAddImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  
  const { isAdmin } = useAdmin();
  const { isAdminModeActive } = useAdminModeStore();
  const { tags, getTagsForProduct, getTagsByGroup, assignTag, removeTag } = useProductTags();
  
  const showAdminControls = isAdmin && isAdminModeActive;

  useEffect(() => {
    async function loadProduct() {
      if (!handle) return;
      try {
        const data = await fetchProductByHandle(handle);
        setProduct(data);
        // Initialize selected options with first values
        if (data?.options) {
          const initialOptions: Record<string, string> = {};
          data.options.forEach((option) => {
            if (option.values.length > 0) {
              initialOptions[option.name] = option.values[0];
            }
          });
          setSelectedOptions(initialOptions);
        }
        
        // Fetch related products
        const allProducts = await fetchProducts(20);
        // Filter to show products that are not the current one
        const related = allProducts
          .filter((p) => p.node.handle !== handle)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [handle]);

  // Find selected variant
  const selectedVariant = product?.variants.edges.find((v) => {
    return v.node.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    );
  })?.node;

  // Find matching image based on selected color/variant
  const matchingImageIndex = useMemo(() => {
    if (!product) return 0;
    
    // Look for color option
    const colorOption = selectedOptions["Color"] || selectedOptions["color"] || selectedOptions["Colour"];
    if (!colorOption) return selectedImage;

    // Try to find an image that matches the color in alt text
    const matchIndex = product.images.edges.findIndex((img) => {
      const altText = img.node.altText?.toLowerCase() || "";
      return altText.includes(colorOption.toLowerCase());
    });

    return matchIndex >= 0 ? matchIndex : selectedImage;
  }, [product, selectedOptions, selectedImage]);

  // Update selected image when variant changes
  useEffect(() => {
    if (matchingImageIndex !== selectedImage) {
      setSelectedImage(matchingImageIndex);
    }
  }, [matchingImageIndex]);

  // Preload images for smooth/fast transitions
  useEffect(() => {
    if (!product) return;
    const urls = product.images.edges.map((e) => e.node.url).filter(Boolean);
    urls.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, [product]);

  // Auto-slide images (fast + clean)
  useEffect(() => {
    if (!product || !autoSlide || product.images.edges.length <= 1) return;

    const timer = window.setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % product.images.edges.length);
    }, AUTOSLIDE_MS);

    return () => window.clearInterval(timer);
  }, [product, autoSlide]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions,
    });

    toast.success("Añadido al carrito", {
      description: `${product.title} × ${quantity}`,
      action: {
        label: "Ver Carrito",
        onClick: () => setCartOpen(true),
      },
    });
  };

  const handleToggleTag = async (tag: ProductTag) => {
    if (!product) return;
    setSavingTag(true);
    const currentTags = getTagsForProduct(product.id);
    const hasTag = currentTags.some(t => t.id === tag.id);
    
    try {
      if (hasTag) {
        await removeTag(product.id, tag.id);
        toast.success(`Etiqueta "${tag.name}" eliminada`);
      } else {
        await assignTag(product.id, tag.id);
        toast.success(`Etiqueta "${tag.name}" añadida`);
      }
    } catch (error) {
      toast.error('Error al actualizar etiqueta');
    } finally {
      setSavingTag(false);
    }
  };

  const startEditingTitle = () => {
    if (product) {
      setEditedTitle(product.title);
      setEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (!product || !editedTitle.trim() || editedTitle === product.title) {
      setEditingTitle(false);
      return;
    }
    
    setSavingProduct(true);
    try {
      await updateProductTitle(product.id, editedTitle.trim());
      setProduct({ ...product, title: editedTitle.trim() });
      toast.success('Nombre actualizado en Shopify');
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Error al actualizar el nombre');
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditingPrice = () => {
    if (product) {
      const currentPrice = selectedVariant?.price.amount || product.priceRange.minVariantPrice.amount;
      setEditedPrice(currentPrice);
      setEditingPrice(true);
    }
  };

  const savePrice = async () => {
    if (!product || !selectedVariant || !editedPrice.trim()) {
      setEditingPrice(false);
      return;
    }
    
    setSavingProduct(true);
    try {
      await updateProductPrice(product.id, selectedVariant.id, editedPrice.trim());
      // Update local product state
      const updatedVariants = product.variants.edges.map(v => 
        v.node.id === selectedVariant.id 
          ? { ...v, node: { ...v.node, price: { ...v.node.price, amount: editedPrice.trim() } } }
          : v
      );
      setProduct({ 
        ...product, 
        variants: { edges: updatedVariants },
        priceRange: { 
          ...product.priceRange, 
          minVariantPrice: { ...product.priceRange.minVariantPrice, amount: editedPrice.trim() } 
        }
      });
      toast.success('Precio actualizado en Shopify');
      setEditingPrice(false);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar el precio');
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditingDescription = () => {
    if (product) {
      setEditedDescription(product.description || '');
      setEditingDescription(true);
    }
  };

  const saveDescription = async () => {
    if (!product) {
      setEditingDescription(false);
      return;
    }
    
    setSavingProduct(true);
    try {
      await updateProductDescription(product.id, editedDescription);
      setProduct({ ...product, description: editedDescription });
      toast.success('Descripción actualizada en Shopify');
      setEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Error al actualizar la descripción');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    if (!product) return;
    
    // Get image ID from the product images array
    const imageEdge = product.images.edges[index];
    if (!imageEdge) return;
    
    // Extract image ID from URL or use index-based approach
    // Shopify images have IDs in their URLs or we need to fetch them
    const imageId = imageEdge.node.url.match(/\/(\d+)\//)?.[1];
    
    if (!imageId) {
      toast.error('No se pudo identificar la imagen');
      return;
    }

    setSavingProduct(true);
    try {
      await deleteProductImage(product.id, imageId);
      // Update local state
      const updatedImages = product.images.edges.filter((_, i) => i !== index);
      setProduct({ ...product, images: { edges: updatedImages } });
      if (selectedImage >= updatedImages.length) {
        setSelectedImage(Math.max(0, updatedImages.length - 1));
      }
      toast.success('Imagen eliminada de Shopify');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleAddImage = async () => {
    if (!product || !newImageUrl.trim()) return;
    
    setSavingProduct(true);
    try {
      const result = await addProductImage(product.id, newImageUrl.trim());
      // Update local state with new image
      const newImage = {
        node: {
          url: newImageUrl.trim(),
          altText: null
        }
      };
      setProduct({ 
        ...product, 
        images: { edges: [...product.images.edges, newImage] } 
      });
      setNewImageUrl('');
      setShowAddImage(false);
      toast.success('Imagen añadida a Shopify');
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Error al añadir la imagen');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    setDeletingProduct(true);
    try {
      await deleteProduct(product.id);
      toast.success(`Producto "${product.title}" eliminado de Shopify`);
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setDeletingProduct(false);
    }
  };

  const tagsByGroup = getTagsByGroup();
  const productTags = product ? getTagsForProduct(product.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-xl text-muted-foreground mb-4">Producto no encontrado</p>
          <Button asChild variant="outline">
            <Link to="/products">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a Productos
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images.edges;
  const price = selectedVariant?.price || product.priceRange.minVariantPrice;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300 mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Volver a Productos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div className="space-y-4 animate-fade-up">
              {/* Main Image (fade carousel) */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border relative">
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <img
                      key={img.node.url}
                      src={img.node.url}
                      alt={img.node.altText || product.title}
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-out ${
                        idx === selectedImage ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ transitionDuration: `${FADE_MS}ms` }}
                    />
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Thumbnails - Auto-sliding with manual control + Admin controls */}
              {(images.length > 0 || showAdminControls) && (
                <div className="space-y-3">
                  <div 
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                    onMouseEnter={() => setAutoSlide(false)}
                    onMouseLeave={() => setAutoSlide(true)}
                  >
                    {images.map((img, index) => (
                      <div key={index} className="relative flex-shrink-0 group">
                        <button
                          onClick={() => {
                            setSelectedImage(index);
                            setAutoSlide(false);
                            window.setTimeout(() => setAutoSlide(true), 10000);
                          }}
                          className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            selectedImage === index
                              ? "border-price-yellow shadow-lg shadow-price-yellow/20 scale-105"
                              : "border-border/50 hover:border-muted-foreground opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img.node.url}
                            alt={img.node.altText || `${product.title} ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </button>
                        {/* Delete button for admin */}
                        {showAdminControls && (
                          <button
                            onClick={() => handleDeleteImage(img.node.url, index)}
                            disabled={savingProduct}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add image button for admin */}
                    {showAdminControls && (
                      <button
                        onClick={() => setShowAddImage(true)}
                        className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-price-yellow/50 hover:border-price-yellow flex items-center justify-center text-price-yellow/70 hover:text-price-yellow transition-all"
                      >
                        <ImagePlus className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                  
                  {/* Add image form */}
                  {showAdminControls && showAddImage && (
                    <div className="bg-stone-200/80 dark:bg-stone-800/80 rounded-xl p-3 space-y-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="URL de la imagen..."
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddImage}
                          disabled={savingProduct || !newImageUrl.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {savingProduct ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                          Añadir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setShowAddImage(false); setNewImageUrl(''); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-36 lg:self-start space-y-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <div>
                {/* Editable Title */}
                {showAdminControls && editingTitle ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="text-xl font-display italic uppercase"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={saveTitle}
                      disabled={savingProduct}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                      {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingTitle(false)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-2xl md:text-3xl font-display italic uppercase text-foreground tracking-wide">
                      {product.title}
                    </h1>
                    {showAdminControls && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={startEditingTitle}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deletingProduct}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                            >
                              {deletingProduct ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El producto "{product.title}" será eliminado permanentemente de Shopify.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteProduct}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                )}
                
                {/* Editable Price */}
                {showAdminControls && editingPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-price-yellow">€</span>
                    <Input
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePrice();
                        if (e.key === 'Escape') setEditingPrice(false);
                      }}
                      className="text-xl font-bold w-32"
                      type="number"
                      step="0.01"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={savePrice}
                      disabled={savingProduct}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                      {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPrice(false)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl md:text-3xl font-bold text-price-yellow">
                      {formatPrice(price.amount, price.currencyCode)}
                    </p>
                    {showAdminControls && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={startEditingPrice}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-price-yellow"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Description - Editable */}
              {showAdminControls && editingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Descripción del producto..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveDescription}
                      disabled={savingProduct}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDescription(false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-muted-foreground leading-relaxed flex-1">
                    {product.description || (showAdminControls ? 'Sin descripción' : '')}
                  </p>
                  {showAdminControls && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startEditingDescription}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Admin Tag Editor */}
              {showAdminControls && (
                <div className="bg-stone-200/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium text-sm">Gestionar Etiquetas (Admin)</span>
                    {savingTag && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                  <div className="space-y-3">
                    {TAG_GROUPS.map(group => {
                      const groupTags = tagsByGroup[group] || [];
                      if (groupTags.length === 0) return null;
                      
                      return (
                        <div key={group} className="flex flex-wrap items-start gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400 w-24 flex-shrink-0 pt-1.5">
                            {group}:
                          </span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {groupTags.map(tag => {
                              const isSelected = productTags.some(t => t.id === tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => handleToggleTag(tag)}
                                  disabled={savingTag}
                                  className={`
                                    text-xs px-3 py-1.5 rounded-full font-medium transition-all
                                    ${isSelected 
                                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300 shadow-sm' 
                                      : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 dark:hover:bg-amber-900/30 dark:hover:text-amber-200 dark:hover:border-amber-700'
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options */}
              {product.options.map((option) => (
                <div key={option.name}>
                  <h3 className="font-medium text-foreground mb-3">
                    {option.name}: <span className="text-price-yellow">{selectedOptions[option.name]}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleOptionChange(option.name, value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                          selectedOptions[option.name] === value
                            ? "bg-price-yellow text-background shadow-lg shadow-price-yellow/30"
                            : "bg-secondary text-foreground hover:bg-secondary/80 hover:scale-105"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Cantidad</h3>
                <div className="inline-flex items-center gap-1 bg-secondary rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-background transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-foreground">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-background transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <Button
                  onClick={handleAddToCart}
                  variant="hero"
                  size="xl"
                  className="w-full group"
                  disabled={!selectedVariant?.availableForSale}
                >
                  <ShoppingBag className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                  {selectedVariant?.availableForSale
                    ? "Añadir al Carrito"
                    : "Agotado"}
                </Button>

                {/* Features */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    Envío Gratis
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    30 Días Devolución
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-price-yellow" />
                    Pago Seguro
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20 pt-16 border-t border-border">
              <h2 className="text-2xl md:text-3xl font-display italic uppercase text-foreground mb-8">
                También te puede gustar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
