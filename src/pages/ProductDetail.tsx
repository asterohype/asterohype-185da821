import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  fetchProductByHandle,
  fetchProducts,
  formatPrice,
  ShopifyProduct,
  updateProductTitle,
  updateProductPrice,
  updateProductDescription,
  deleteProductImage,
  addProductImage,
  deleteProduct,
} from "@/lib/shopify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "@/components/products/ProductCard";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useProductTags, ProductTag } from "@/hooks/useProductTags";
import { useProductCosts } from "@/hooks/useProductCosts";
import { useOptionAliases } from "@/hooks/useOptionAliases";
import { useProductOverride } from "@/hooks/useProductOverrides";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Tag,
  Pencil,
  Save,
  X,
  Trash2,
  ImagePlus,
  TrendingUp,
  RefreshCw,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
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
  const [relatedScrollPos, setRelatedScrollPos] = useState(0);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  
  const { isAdmin } = useAdmin();
  const { isAdminModeActive } = useAdminModeStore();
  const { tags, getTagsForProduct, getTagsByGroup, assignTag, removeTag } = useProductTags();
  const { getCostForProduct, saveCost, calculateProfit, loading: costsLoading } = useProductCosts();
  const { getDisplayName, saveAlias } = useOptionAliases();
  
  const showAdminControls = isAdmin && isAdminModeActive;
  
  // Cost editing states
  const [editingCost, setEditingCost] = useState(false);
  const [editedProductCost, setEditedProductCost] = useState('');
  const [editedShippingCost, setEditedShippingCost] = useState('');
  const [editedCostNotes, setEditedCostNotes] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [fetchingCJData, setFetchingCJData] = useState(false);
  const [cjCostData, setCjCostData] = useState<{productCost: number; shippingCost: number; productName: string; sku: string} | null>(null);

  // Option name editing states
  const [editingOptionName, setEditingOptionName] = useState<string | null>(null);
  const [editedOptionName, setEditedOptionName] = useState('');
  const [savingOptionName, setSavingOptionName] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!handle) return;
      try {
        const data = await fetchProductByHandle(handle);
        setProduct(data);
        if (data?.options) {
          const initialOptions: Record<string, string> = {};
          data.options.forEach((option) => {
            if (option.values.length > 0) {
              initialOptions[option.name] = option.values[0];
            }
          });
          setSelectedOptions(initialOptions);
        }
        
        const allProducts = await fetchProducts(20);
        const related = allProducts
          .filter((p) => p.node.handle !== handle)
          .slice(0, 8);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [handle]);

  const { data: override } = useProductOverride(product?.id);

  const productWithOverride = useMemo(() => {
    if (!product) return null;
    if (!override) return product;

    return {
      ...product,
      title: override.title ?? product.title,
      description: override.description ?? product.description,
      priceRange: {
        ...product.priceRange,
        minVariantPrice:
          override.price != null
            ? { ...product.priceRange.minVariantPrice, amount: String(override.price) }
            : product.priceRange.minVariantPrice,
      },
    };
  }, [product, override]);

  const selectedVariant = product?.variants.edges.find((v) => {
    return v.node.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    );
  })?.node;

  const displayTitle = productWithOverride?.title ?? product?.title;
  const displayDescription = productWithOverride?.description ?? product?.description;
  const displayPriceAmount =
    override?.price != null
      ? String(override.price)
      : selectedVariant?.price.amount || product?.priceRange.minVariantPrice.amount;
  const displayCurrency =
    selectedVariant?.price.currencyCode ||
    product?.priceRange.minVariantPrice.currencyCode ||
    "USD";

  const matchingImageIndex = useMemo(() => {
    if (!product) return 0;

    const colorOption =
      selectedOptions["Color"] || selectedOptions["color"] || selectedOptions["Colour"];
    if (!colorOption) return selectedImage;

    const matchIndex = product.images.edges.findIndex((img) => {
      const altText = img.node.altText?.toLowerCase() || "";
      return altText.includes(colorOption.toLowerCase());
    });

    return matchIndex >= 0 ? matchIndex : selectedImage;
  }, [product, selectedOptions, selectedImage]);

  useEffect(() => {
    if (matchingImageIndex !== selectedImage) {
      setSelectedImage(matchingImageIndex);
    }
  }, [matchingImageIndex]);

  useEffect(() => {
    if (!product) return;
    const urls = product.images.edges.map((e) => e.node.url).filter(Boolean);
    urls.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, [product]);

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
      toast.success('Nombre actualizado');
      setEditingTitle(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Avoid noisy console errors for expected auth/permission failures.
      if (!message.includes('No autorizado para editar productos')) {
        console.error('Error updating title:', error);
      }
      toast.error(message.includes('No autorizado') ? message : 'Error al actualizar el nombre');
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
      toast.success('Precio actualizado');
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
      toast.success('Descripción actualizada');
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
    
    const imageEdge = product.images.edges[index];
    if (!imageEdge) return;
    
    const imageId = imageEdge.node.url.match(/\/(\d+)\//)?.[1];
    
    if (!imageId) {
      toast.error('No se pudo identificar la imagen');
      return;
    }

    setSavingProduct(true);
    try {
      await deleteProductImage(product.id, imageId);
      const updatedImages = product.images.edges.filter((_, i) => i !== index);
      setProduct({ ...product, images: { edges: updatedImages } });
      if (selectedImage >= updatedImages.length) {
        setSelectedImage(Math.max(0, updatedImages.length - 1));
      }
      toast.success('Imagen eliminada');
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
      toast.success('Imagen añadida');
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

  const productCostData = product ? getCostForProduct(product.id) : undefined;
  
  const startEditingCost = () => {
    setEditedProductCost(productCostData?.product_cost?.toString() || '');
    setEditedShippingCost(productCostData?.shipping_cost?.toString() || '');
    setEditedCostNotes(productCostData?.notes || '');
    setEditingCost(true);
  };

  const handleSaveCost = async () => {
    if (!product) return;
    
    setSavingCost(true);
    try {
      await saveCost(
        product.id,
        parseFloat(editedProductCost) || 0,
        parseFloat(editedShippingCost) || 0,
        editedCostNotes
      );
      toast.success('Costes actualizados');
      setEditingCost(false);
    } catch (error) {
      console.error('Error saving cost:', error);
      toast.error('Error al guardar los costes');
    } finally {
      setSavingCost(false);
    }
  };

  const fetchCJCostsForProduct = async () => {
    if (!product) return;
    
    setFetchingCJData(true);
    try {
      const { data, error } = await supabase.functions.invoke('cj-product-cost', {
        body: { productName: product.title }
      });

      if (error) {
        console.log('Error searching CJ:', error);
        return;
      }

      if (data.searchResults && data.searchResults.length > 0) {
        const cjProduct = data.searchResults[0];
        
        const { data: detailData } = await supabase.functions.invoke('cj-product-cost', {
          body: { cjProductId: cjProduct.productId }
        });

        if (detailData?.success && detailData.product) {
          const fullProduct = detailData.product;
          
          if (fullProduct.variants?.length > 0) {
            const firstVariant = fullProduct.variants[0];
            const { data: freightData } = await supabase.functions.invoke('cj-freight', {
              body: { vid: firstVariant.vid, quantity: 1, destCountry: 'ES' }
            });

            const productCost = firstVariant.variantPrice || parseFloat(fullProduct.sellPrice) || 0;
            const shippingCost = freightData?.success && freightData.cheapestOption ? freightData.cheapestOption.price : 0;

            setCjCostData({
              productCost,
              shippingCost,
              productName: fullProduct.productName,
              sku: fullProduct.sku
            });
          }
        }
        return;
      }

      if (data.success && data.product) {
        const cjProduct = data.product;
        
        if (cjProduct.variants?.length > 0) {
          const firstVariant = cjProduct.variants[0];
          const { data: freightData } = await supabase.functions.invoke('cj-freight', {
            body: { vid: firstVariant.vid, quantity: 1, destCountry: 'ES' }
          });

          const productCost = firstVariant.variantPrice || parseFloat(cjProduct.sellPrice) || 0;
          const shippingCost = freightData?.success && freightData.cheapestOption ? freightData.cheapestOption.price : 0;

          setCjCostData({
            productCost,
            shippingCost,
            productName: cjProduct.productName,
            sku: cjProduct.sku
          });
        }
      }
    } catch (err) {
      console.error('Error fetching CJ costs:', err);
    } finally {
      setFetchingCJData(false);
    }
  };

  useEffect(() => {
    if (showAdminControls && product && !productCostData && !costsLoading && !fetchingCJData && !cjCostData) {
      fetchCJCostsForProduct();
    }
  }, [showAdminControls, product, productCostData, costsLoading]);

  const tagsByGroup = getTagsByGroup();
  const productTags = product ? getTagsForProduct(product.id) : [];

  // Related products scroll handlers
  const scrollRelated = (direction: 'left' | 'right') => {
    const container = document.getElementById('related-products-container');
    if (container) {
      const scrollAmount = 300;
      const newPos = direction === 'left' 
        ? Math.max(0, relatedScrollPos - scrollAmount)
        : relatedScrollPos + scrollAmount;
      container.scrollTo({ left: newPos, behavior: 'smooth' });
      setRelatedScrollPos(newPos);
    }
  };

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
  const price = { amount: displayPriceAmount || "0", currencyCode: displayCurrency };

  // Convert description to bullet points
  const descriptionBullets = displayDescription
    ? displayDescription.split(/[.!?]+/).filter((s) => s.trim().length > 10).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Productos</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{displayTitle}</span>
          </nav>

          {/* Main Product Section - Amazon Style Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column - Images (Thumbnails + Main) */}
            <div className="lg:col-span-6 flex gap-3">
              {/* Vertical Thumbnails */}
              <div className="hidden md:flex flex-col gap-2 w-16 flex-shrink-0">
                {images.slice(0, 7).map((img, index) => (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => setSelectedImage(index)}
                      onMouseEnter={() => setSelectedImage(index)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index
                          ? "border-primary ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <img
                        src={img.node.url}
                        alt={img.node.altText || `${product.title} ${index + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {showAdminControls && (
                      <button
                        onClick={() => handleDeleteImage(img.node.url, index)}
                        disabled={savingProduct}
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {showAdminControls && (
                  <button
                    onClick={() => setShowAddImage(true)}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Main Image */}
              <div className="flex-1">
                <div className="aspect-square rounded-xl overflow-hidden bg-card border border-border relative">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImage]?.node.url}
                      alt={images[selectedImage]?.node.altText || product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Mobile Thumbnails */}
                <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-border"
                      }`}
                    >
                      <img
                        src={img.node.url}
                        alt={img.node.altText || `${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Add image form */}
                {showAdminControls && showAddImage && (
                  <div className="mt-3 bg-muted rounded-lg p-3 space-y-2">
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
            </div>

            {/* Middle Column - Product Info */}
            <div className="lg:col-span-4 space-y-4">
              {/* Title */}
              {showAdminControls && editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={saveTitle} disabled={savingProduct} className="h-8 w-8 text-green-600">
                    {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)} className="h-8 w-8 text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                    {displayTitle}
                  </h1>
                  {showAdminControls && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={startEditingTitle} className="h-6 w-6">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={deletingProduct} className="h-6 w-6 text-destructive">
                            {deletingProduct ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El producto "{product.title}" será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )}

              {/* Price Section */}
              <div className="border-b border-border pb-4">
                {showAdminControls && editingPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">€</span>
                    <Input
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePrice();
                        if (e.key === 'Escape') setEditingPrice(false);
                      }}
                      className="w-24 text-lg font-bold"
                      type="number"
                      step="0.01"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={savePrice} disabled={savingProduct} className="h-8 w-8 text-green-600">
                      {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingPrice(false)} className="h-8 w-8 text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-price-yellow">
                      {formatPrice(price.amount, price.currencyCode)}
                    </span>
                    {showAdminControls && (
                      <Button size="icon" variant="ghost" onClick={startEditingPrice} className="h-6 w-6">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Envío gratis</span>
                </div>
              </div>

              {/* Product Specs Table */}
              <div className="space-y-2">
                <table className="w-full text-sm">
                  <tbody>
                    {product.options.filter(opt => opt.values.length > 0).slice(0, 3).map((option) => (
                      <tr key={option.name} className="border-b border-border/50">
                        <td className="py-2 font-medium text-muted-foreground w-28">{getDisplayName(product.id, option.name)}</td>
                        <td className="py-2 text-foreground">{selectedOptions[option.name]}</td>
                      </tr>
                    ))}
                    {selectedVariant?.availableForSale !== undefined && (
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-muted-foreground w-28">Disponibilidad</td>
                        <td className={`py-2 font-medium ${selectedVariant.availableForSale ? 'text-green-600' : 'text-destructive'}`}>
                          {selectedVariant.availableForSale ? 'En stock' : 'Agotado'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Description Bullets */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Acerca de este producto</h3>
                {showAdminControls && editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="min-h-[120px]"
                      placeholder="Descripción del producto..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveDescription} disabled={savingProduct}>
                        {savingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {descriptionBullets.length > 0 ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {descriptionBullets.map((bullet, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{bullet.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {displayDescription || (showAdminControls ? 'Sin descripción - haz clic para añadir' : 'Sin descripción disponible')}
                      </p>
                    )}
                    {showAdminControls && (
                      <Button size="icon" variant="ghost" onClick={startEditingDescription} className="absolute top-0 right-0 h-6 w-6">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Tag Editor */}
              {showAdminControls && (
                <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    <span>Etiquetas</span>
                    {savingTag && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                  <div className="space-y-2">
                    {TAG_GROUPS.map(group => {
                      const groupTags = tagsByGroup[group] || [];
                      if (groupTags.length === 0) return null;
                      
                      return (
                        <div key={group} className="flex flex-wrap gap-1">
                          {groupTags.map(tag => {
                            const isSelected = productTags.some(t => t.id === tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleToggleTag(tag)}
                                disabled={savingTag}
                                className={`text-xs px-2 py-1 rounded-full transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Buy Box */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 bg-card border border-border rounded-xl p-4 space-y-4">
                {/* Price in buy box */}
                <div className="text-2xl font-bold text-price-yellow">
                  {formatPrice(price.amount, price.currencyCode)}
                </div>

                {/* Delivery Info */}
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Truck className="h-4 w-4" />
                    Envío GRATIS
                  </div>
                  <p className="text-muted-foreground text-xs">Entrega estimada: 7-15 días</p>
                </div>

                {/* Availability */}
                <p className={`text-sm font-medium ${selectedVariant?.availableForSale ? 'text-green-600' : 'text-destructive'}`}>
                  {selectedVariant?.availableForSale ? 'En stock' : 'No disponible'}
                </p>

                {/* Options in buy box */}
                {product.options.map((option) => (
                  <div key={option.name} className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {getDisplayName(product.id, option.name)}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {option.values.map((value) => (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                            selectedOptions[option.name] === value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-muted-foreground text-foreground"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Cantidad</label>
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  disabled={!selectedVariant?.availableForSale}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Añadir al Carrito
                </Button>

                {/* Trust badges */}
                <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-green-600" />
                    Pago 100% seguro
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-green-600" />
                    30 días de devolución
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    Garantía incluida
                  </div>
                </div>

                {/* Admin Cost Section */}
                {showAdminControls && (
                  <div className="pt-3 border-t border-border">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Profit Analysis
                        </div>
                        {!editingCost && (
                          <Button size="sm" variant="ghost" onClick={startEditingCost} className="h-6 text-xs">
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                      
                      {editingCost ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">Coste producto</label>
                              <Input
                                value={editedProductCost}
                                onChange={(e) => setEditedProductCost(e.target.value)}
                                type="number"
                                step="0.01"
                                className="h-7 text-xs"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Coste envío</label>
                              <Input
                                value={editedShippingCost}
                                onChange={(e) => setEditedShippingCost(e.target.value)}
                                type="number"
                                step="0.01"
                                className="h-7 text-xs"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <Input
                            value={editedCostNotes}
                            onChange={(e) => setEditedCostNotes(e.target.value)}
                            className="h-7 text-xs"
                            placeholder="Notas..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveCost} disabled={savingCost} className="h-6 text-xs flex-1">
                              {savingCost ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCost(false)} className="h-6 text-xs">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const hasData = productCostData && (productCostData.product_cost > 0 || productCostData.shipping_cost > 0);
                          const sellingPrice = parseFloat(price.amount);
                          
                          if (cjCostData && !hasData) {
                            const cjTotalCost = cjCostData.productCost + cjCostData.shippingCost;
                            const cjProfit = sellingPrice - cjTotalCost * 0.92;
                            const cjMargin = (cjProfit / sellingPrice) * 100;
                            
                            return (
                              <div className="space-y-2 text-xs">
                                <p className="text-[10px] text-muted-foreground">CJ (no guardado)</p>
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div className="bg-background/50 rounded p-1.5">
                                    <p className="text-[10px] text-muted-foreground">Coste</p>
                                    <p className="font-bold text-destructive">${cjTotalCost.toFixed(2)}</p>
                                  </div>
                                  <div className="bg-background/50 rounded p-1.5">
                                    <p className="text-[10px] text-muted-foreground">Venta</p>
                                    <p className="font-bold text-price-yellow">{sellingPrice.toFixed(2)}€</p>
                                  </div>
                                  <div className="bg-background/50 rounded p-1.5">
                                    <p className="text-[10px] text-muted-foreground">Profit</p>
                                    <p className={`font-bold ${cjProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                      ~{cjProfit.toFixed(2)}€
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          if (fetchingCJData) {
                            return (
                              <div className="text-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                                <p className="text-[10px] text-muted-foreground">Buscando en CJ...</p>
                              </div>
                            );
                          }
                          
                          if (hasData) {
                            const totalCost = productCostData.product_cost + productCostData.shipping_cost;
                            const profit = sellingPrice - totalCost;
                            const margin = (profit / sellingPrice) * 100;
                            
                            return (
                              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                <div className="bg-background/50 rounded p-1.5">
                                  <p className="text-[10px] text-muted-foreground">Coste</p>
                                  <p className="font-bold text-destructive">{totalCost.toFixed(2)}€</p>
                                </div>
                                <div className="bg-background/50 rounded p-1.5">
                                  <p className="text-[10px] text-muted-foreground">Venta</p>
                                  <p className="font-bold text-price-yellow">{sellingPrice.toFixed(2)}€</p>
                                </div>
                                <div className="bg-background/50 rounded p-1.5">
                                  <p className="text-[10px] text-muted-foreground">Profit</p>
                                  <p className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="text-center py-2">
                              <p className="text-[10px] text-muted-foreground mb-1">No hay datos de coste</p>
                              <Button size="sm" variant="ghost" onClick={fetchCJCostsForProduct} className="h-5 text-[10px]">
                                <RefreshCw className="h-2.5 w-2.5 mr-1" />
                                Buscar en CJ
                              </Button>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products - Carousel Style */}
          {relatedProducts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Productos relacionados
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollRelated('left')}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollRelated('right')}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div 
                id="related-products-container"
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                onScroll={(e) => setRelatedScrollPos(e.currentTarget.scrollLeft)}
              >
                {relatedProducts.map((product) => (
                  <div key={product.node.id} className="flex-shrink-0 w-[180px]">
                    <ProductCard product={product} />
                  </div>
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
