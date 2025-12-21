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
  deleteProductImage,
  addProductImage,
  deleteProduct,
  updateProductPrice,
  updateProductTitle,
} from "@/lib/shopify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/stores/cartStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { ProductCard } from "@/components/products/ProductCard";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useProductTags, ProductTag } from "@/hooks/useProductTags";
import { useProductCosts } from "@/hooks/useProductCosts";
import { useOptionAliases } from "@/hooks/useOptionAliases";
import { useProductOverride, useUpsertOverride, splitTitle } from "@/hooks/useProductOverrides";
import { useProductReviews, useProductReviewStats, useCreateReview, useDeleteReview, useUpdateReview } from "@/hooks/useProductReviews";
import { useProductOffer, useUpsertOffer } from "@/hooks/useProductOffers";
import { useProductEditStatus } from "@/hooks/useProductEditStatus";
import { EditStatusChecklist } from "@/components/admin/EditStatusChecklist";
import { NewProductsPanel } from "@/components/admin/NewProductsPanel";
import { VariantsPricePanel } from "@/components/admin/VariantsPricePanel";

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
  Star,
  Gift,
  Clock,
  Award,
  Settings,
  MessageSquare,
  Heart,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [editingSeparator, setEditingSeparator] = useState(false);
  const [selectedSeparator, setSelectedSeparator] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedShopifyTitle, setEditedShopifyTitle] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImage, setShowAddImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [relatedScrollPos, setRelatedScrollPos] = useState(0);
  const [showOfferEditor, setShowOfferEditor] = useState(false);
  const [showVariantsPanel, setShowVariantsPanel] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setOpen);
  
  // Favorites
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isProductFavorite = product ? isFavorite(product.id) : false;
  
  const { isAdmin } = useAdmin();
  const { isAdminModeActive } = useAdminModeStore();
  const { tags, getTagsForProduct, getTagsByGroup, assignTag, removeTag } = useProductTags();
  const { getCostForProduct, saveCost, calculateProfit, loading: costsLoading } = useProductCosts();
  const { getDisplayName, saveAlias } = useOptionAliases();

  // Override hooks for local edits
  const { data: productOverride, isLoading: overrideLoading } = useProductOverride(product?.id);
  const upsertOverride = useUpsertOverride();
  
  // Reviews hooks
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product?.id);
  const { stats: reviewStats } = useProductReviewStats(product?.id);
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();
  const updateReview = useUpdateReview();
  
  // Offers hook
  const { data: productOffer, isLoading: offerLoading } = useProductOffer(product?.id);
  const upsertOffer = useUpsertOffer();
  
  // Edit status hook (for "HECHO" badge)
  const { data: editStatus } = useProductEditStatus(product?.id);
  
  // Check if we came from the NewProductsPanel
  const [showBackToPanel, setShowBackToPanel] = useState(false);
  const [newProductsPanelOpen, setNewProductsPanelOpen] = useState(false);
  
  useEffect(() => {
    const fromPanel = sessionStorage.getItem('fromNewProductsPanel');
    if (fromPanel === 'true') {
      setShowBackToPanel(true);
    }
  }, []);
  
  const handleBackToPanel = () => {
    sessionStorage.removeItem('fromNewProductsPanel');
    setNewProductsPanelOpen(true);
  };
  
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

  // Offer editing states
  const [offerForm, setOfferForm] = useState({
    promo_text: '',
    promo_subtext: '',
    promo_active: false,
    offer_end_date: '',
    offer_text: '',
    offer_active: false,
    discount_percent: '',
    original_price: '',
    low_stock_threshold: '',
    low_stock_active: false,
  });

  // Review form states
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    user_name: '',
  });
  
  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewForm, setEditReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

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

  // Load offer data into form when editing
  useEffect(() => {
    if (productOffer) {
      setOfferForm({
        promo_text: productOffer.promo_text || '',
        promo_subtext: productOffer.promo_subtext || '',
        promo_active: productOffer.promo_active || false,
        offer_end_date: productOffer.offer_end_date ? new Date(productOffer.offer_end_date).toISOString().slice(0, 16) : '',
        offer_text: productOffer.offer_text || '',
        offer_active: productOffer.offer_active || false,
        discount_percent: productOffer.discount_percent?.toString() || '',
        original_price: productOffer.original_price?.toString() || '',
        low_stock_threshold: productOffer.low_stock_threshold?.toString() || '',
        low_stock_active: productOffer.low_stock_active || false,
      });
    }
  }, [productOffer]);

  const selectedVariant = product?.variants.edges.find((v) => {
    return v.node.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    );
  })?.node;

  // Find image that matches selected variant
  const variantImageIndex = useMemo(() => {
    if (!product || !selectedVariant) return 0;
    
    // Try to match by variant title or option values
    const variantValues = selectedVariant.selectedOptions.map(o => o.value.toLowerCase());
    
    const matchIndex = product.images.edges.findIndex((img) => {
      const altText = img.node.altText?.toLowerCase() || "";
      return variantValues.some(val => altText.includes(val));
    });

    return matchIndex >= 0 ? matchIndex : 0;
  }, [product, selectedVariant]);

  // Update selected image when variant changes
  useEffect(() => {
    setSelectedImage(variantImageIndex);
  }, [variantImageIndex]);

  // Use title_separator to split Shopify title into title/subtitle
  // Title and subtitle now come from Shopify title, split by the saved separator
  const shopifyTitle = product?.title || '';
  const { title: displayTitle, subtitle: displaySubtitle } = splitTitle(
    shopifyTitle,
    productOverride?.title_separator || null
  );
  const displayDescription = product?.description;

  // Price always comes from Shopify variant (no more price override in DB)
  const displayPriceAmount = selectedVariant?.price.amount || product?.variants.edges[0]?.node.price.amount || product?.priceRange.minVariantPrice.amount;

  const displayCurrency =
    selectedVariant?.price.currencyCode ||
    product?.variants.edges[0]?.node.price.currencyCode ||
    product?.priceRange.minVariantPrice.currencyCode ||
    "EUR";

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
    
    // Auto-switch image when Color option changes
    if (optionName.toLowerCase() === 'color' && product) {
      const images = product.images.edges;
      // Try to find an image that contains the color value in alt text or URL
      const valueLower = value.toLowerCase();
      const matchingIndex = images.findIndex((img, idx) => {
        const alt = img.node.altText?.toLowerCase() || '';
        const url = img.node.url.toLowerCase();
        return alt.includes(valueLower) || url.includes(valueLower);
      });
      if (matchingIndex >= 0) {
        setSelectedImage(matchingIndex);
      }
    }
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

  // Start editing separator
  const startEditingSeparator = () => {
    setSelectedSeparator(productOverride?.title_separator || null);
    setEditingSeparator(true);
  };

  // Start editing title (Shopify title directly)
  const startEditingTitle = () => {
    setEditedShopifyTitle(product?.title || '');

    // If we already have a saved separator, use it; otherwise try to detect one from the current Shopify title.
    const saved = productOverride?.title_separator || null;
    if (saved) {
      setSelectedSeparator(saved);
    } else {
      const current = product?.title || '';
      const detected = [' - ', ' | ', ' — ', ', ', ' / '].find((sep) => current.includes(sep)) || null;
      setSelectedSeparator(detected);
    }

    setEditingTitle(true);
  };

  // Save Shopify title exactly as typed; separator is only for how we *display* title/subtitle
  const saveTitle = async () => {
    if (!product) {
      setEditingTitle(false);
      return;
    }

    const newTitle = editedShopifyTitle.trim();
    if (!newTitle) {
      setEditingTitle(false);
      return;
    }

    setSavingProduct(true);
    try {
      const res = await updateProductTitle(product.id, newTitle);
      if (!res.ok) return;

      const separatorToSave =
        selectedSeparator && newTitle.includes(selectedSeparator) ? selectedSeparator : null;

      await upsertOverride.mutateAsync({
        shopify_product_id: product.id,
        title_separator: separatorToSave,
      });

      setProduct({
        ...product,
        title: newTitle,
      });

      toast.success('Título actualizado en Shopify');
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('No se pudo actualizar el título en Shopify');
    } finally {
      setSavingProduct(false);
    }
  };

  // Save separator to DB (without editing title)
  const saveSeparator = async (separator: string | null) => {
    if (!product) return;
    
    setSavingProduct(true);
    try {
      await upsertOverride.mutateAsync({
        shopify_product_id: product.id,
        title_separator: separator,
      });
      toast.success(separator ? `Separador "${separator}" guardado` : 'Separador eliminado');
      setEditingSeparator(false);
    } catch (error) {
      console.error('Error saving separator:', error);
      toast.error('Error al guardar el separador');
    } finally {
      setSavingProduct(false);
    }
  };

  // Detect possible separators in the Shopify title
  const possibleSeparators = useMemo(() => {
    if (!product) return [];
    const title = product.title;
    const separators = [' - ', ' | ', ' — ', ', ', ' / '];
    return separators.filter(sep => title.includes(sep));
  }, [product]);

  const startEditingPrice = () => {
    if (product) {
      setEditedPrice(displayPriceAmount || '0');
      setEditingPrice(true);
    }
  };

  const savePrice = async () => {
    if (!product || !editedPrice.trim()) {
      setEditingPrice(false);
      return;
    }

    // Get first variant to update price in Shopify
    const firstVariant = product.variants.edges[0]?.node;
    if (!firstVariant) {
      toast.error('No se encontró variante del producto');
      setEditingPrice(false);
      return;
    }

    setSavingProduct(true);
    try {
      // Update price directly in Shopify (not our DB)
      const res = await updateProductPrice(product.id, firstVariant.id, editedPrice.trim());
      if (!res.ok) return;

      // Update local state to reflect the change
      setProduct({
        ...product,
        priceRange: {
          ...product.priceRange,
          minVariantPrice: {
            ...product.priceRange.minVariantPrice,
            amount: editedPrice.trim(),
          },
        },
        variants: {
          edges: product.variants.edges.map((v, i) =>
            i === 0
              ? {
                  ...v,
                  node: {
                    ...v.node,
                    price: { ...v.node.price, amount: editedPrice.trim() },
                  },
                }
              : v
          ),
        },
      });

      toast.success('Precio actualizado en Shopify');
      setEditingPrice(false);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar el precio en Shopify');
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditingDescription = () => {
    if (product) {
      setEditedDescription(displayDescription || '');
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
      await upsertOverride.mutateAsync({
        shopify_product_id: product.id,
        title: productOverride?.title,
        subtitle: productOverride?.subtitle,
        description: editedDescription,
        price: productOverride?.price,
      });
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

  const handleSaveOffer = async () => {
    if (!product) return;
    
    try {
      await upsertOffer.mutateAsync({
        shopify_product_id: product.id,
        promo_text: offerForm.promo_text || null,
        promo_subtext: offerForm.promo_subtext || null,
        promo_active: offerForm.promo_active,
        offer_end_date: offerForm.offer_end_date ? new Date(offerForm.offer_end_date).toISOString() : null,
        offer_text: offerForm.offer_text || null,
        offer_active: offerForm.offer_active,
        discount_percent: offerForm.discount_percent ? parseInt(offerForm.discount_percent) : null,
        original_price: offerForm.original_price ? parseFloat(offerForm.original_price) : null,
        low_stock_threshold: offerForm.low_stock_threshold ? parseInt(offerForm.low_stock_threshold) : null,
        low_stock_active: offerForm.low_stock_active,
      });
      toast.success('Configuración de oferta guardada');
      setShowOfferEditor(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Error al guardar la oferta');
    }
  };

  const handleSubmitReview = async () => {
    if (!product || !reviewForm.user_name.trim()) {
      toast.error('Por favor, introduce tu nombre');
      return;
    }
    
    try {
      await createReview.mutateAsync({
        shopify_product_id: product.id,
        user_name: reviewForm.user_name.trim(),
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        comment: reviewForm.comment || undefined,
      });
      toast.success('¡Gracias por tu reseña!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '', user_name: '' });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Error al enviar la reseña');
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

  // Calculate offer countdown
  const offerTimeLeft = useMemo(() => {
    if (!productOffer?.offer_active || !productOffer?.offer_end_date) return null;
    const end = new Date(productOffer.offer_end_date).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  }, [productOffer?.offer_active, productOffer?.offer_end_date]);

  // Convert description to bullet points
  const descriptionBullets = displayDescription
    ? displayDescription.split(/[.!?]+/).filter((s) => s.trim().length > 10).slice(0, 5)
    : [];

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
  const currentPrice = parseFloat(price.amount);
  
  // Use real offer data if available
  const hasDiscount = productOffer?.discount_percent && productOffer?.original_price;
  const originalPrice = hasDiscount ? productOffer.original_price : null;
  const discountPercent = hasDiscount ? productOffer.discount_percent : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* NewProductsPanel modal */}
      <NewProductsPanel open={newProductsPanelOpen} onOpenChange={setNewProductsPanelOpen} />
      
      <main className="pt-24 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back to Panel button (only if came from panel) */}
          {showAdminControls && showBackToPanel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToPanel}
              className="mb-4 gap-2 border-price-yellow/50 text-price-yellow hover:bg-price-yellow/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al Panel de Productos
            </Button>
          )}
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Productos</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{displayTitle}</span>
          </nav>

          {/* Main Product Section - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Images + Variant Selection */}
            <div className="space-y-6">
              {/* Images Section */}
              <div className="flex gap-3">
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
                    
                    {/* Admin badge: HECHO if all_done */}
                    {showAdminControls && editStatus?.all_done && (
                      <div className="absolute bottom-3 left-3 bg-price-yellow text-background px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                        ✅ HECHO
                      </div>
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

            </div>

            {/* Right Column - Product Info (Nike style) */}
            <div className="space-y-6">
              {/* Title + Subtitle with Edit functionality for Admin */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                    {displayTitle}
                  </h1>
                  {showAdminControls && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={startEditingTitle} className="h-6 w-6" title="Editar título y subtítulo">
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
                
                {/* Subtitle from separator */}
                {displaySubtitle && (
                  <p className="text-muted-foreground text-sm">
                    {displaySubtitle}
                  </p>
                )}
                
                {/* Admin: No subtitle yet - hint to add one */}
                {!displaySubtitle && showAdminControls && (
                  <button 
                    onClick={startEditingTitle}
                    className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    Añadir subtítulo
                  </button>
                )}

                {/* Title Editor Dialog (Shopify title directly) */}
                {showAdminControls && editingTitle && (
                  <Dialog open={editingTitle} onOpenChange={setEditingTitle}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar título (Shopify)</DialogTitle>
                        <DialogDescription>
                          Escribe el título tal cual se guardará en Shopify. Si incluyes un separador, la web mostrará
                          lo de la izquierda como título y lo de la derecha como subtítulo.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Current Shopify title */}
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Título actual en Shopify:</p>
                          <p className="font-medium text-foreground text-sm">{shopifyTitle}</p>
                        </div>

                        {/* Shopify title input */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-shopify-title">Título (Shopify)</Label>
                          <Input
                            id="edit-shopify-title"
                            value={editedShopifyTitle}
                            onChange={(e) => setEditedShopifyTitle(e.target.value)}
                            placeholder='Ej: "Alfombrilla Gaming RGB - XXL 80x30"'
                            className="text-base"
                          />
                        </div>

                        {/* Separator selector (display only) */}
                        <div className="space-y-2">
                          <Label>Separador para mostrar subtítulo</Label>
                          <div className="flex flex-wrap gap-2">
                            {[' - ', ' | ', ' — ', ', ', ' / '].map((sep) => (
                              <button
                                key={sep}
                                type="button"
                                onClick={() => setSelectedSeparator(sep)}
                                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                  selectedSeparator === sep
                                    ? 'border-price-yellow bg-price-yellow/10 text-foreground'
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                <span className="font-mono">"{sep.trim()}"</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setSelectedSeparator(null)}
                              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                selectedSeparator === null
                                  ? 'border-price-yellow bg-price-yellow/10 text-foreground'
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                            >
                              Sin separador
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Nota: el separador no se “inserta” solo; para que exista, debes escribirlo dentro del título.
                          </p>
                        </div>

                        {/* Preview */}
                        {(() => {
                          const previewTitle = editedShopifyTitle.trim() || '(vacío)';
                          const { title, subtitle } = splitTitle(previewTitle, selectedSeparator);
                          return (
                            <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
                              <p className="text-xs text-muted-foreground">Vista previa:</p>
                              <p className="font-mono text-sm text-foreground bg-muted px-2 py-1 rounded">{previewTitle}</p>
                              <div className="border-t border-border pt-2 mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Así se verá en la tienda:</p>
                                <p className="font-semibold text-foreground">{title || '(título)'}</p>
                                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={saveTitle}
                            disabled={savingProduct || !editedShopifyTitle.trim()}
                            className="flex-1"
                          >
                            {savingProduct ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Guardar en Shopify
                          </Button>
                          <Button variant="outline" onClick={() => setEditingTitle(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Legacy Separator Editor Dialog - for selecting from existing title */}
                {showAdminControls && editingSeparator && (
                  <Dialog open={editingSeparator} onOpenChange={setEditingSeparator}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Separador de Título</DialogTitle>
                        <DialogDescription>
                          Selecciona dónde cortar el título de Shopify para crear título y subtítulo.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Título completo de Shopify:</p>
                          <p className="font-medium text-foreground">{shopifyTitle}</p>
                        </div>

                        {possibleSeparators.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Separadores detectados:</p>
                            <div className="flex flex-wrap gap-2">
                              {possibleSeparators.map((sep) => {
                                const isSelected = selectedSeparator === sep;
                                return (
                                  <button
                                    key={sep}
                                    onClick={() => setSelectedSeparator(sep)}
                                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                      isSelected 
                                        ? 'border-price-yellow bg-price-yellow/10 text-foreground' 
                                        : 'border-border hover:border-muted-foreground'
                                    }`}
                                  >
                                    <span className="font-mono bg-muted px-1 rounded">"{sep.trim()}"</span>
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setSelectedSeparator(null)}
                                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                  selectedSeparator === null 
                                    ? 'border-price-yellow bg-price-yellow/10 text-foreground' 
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                Sin separador
                              </button>
                            </div>

                            {/* Preview */}
                            {selectedSeparator && (
                              <div className="mt-4 p-3 bg-secondary/50 rounded-lg space-y-1">
                                <p className="text-xs text-muted-foreground">Vista previa:</p>
                                <p className="font-semibold text-foreground">{splitTitle(shopifyTitle, selectedSeparator).title}</p>
                                <p className="text-sm text-muted-foreground">{splitTitle(shopifyTitle, selectedSeparator).subtitle}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No se detectaron separadores comunes en el título. El título se mostrará completo.
                          </p>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={() => saveSeparator(selectedSeparator)} 
                            disabled={savingProduct}
                            className="flex-1"
                          >
                            {savingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingSeparator(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Price Section */}
              <div className="space-y-2">
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
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl font-bold text-foreground">
                      {formatPrice(price.amount, price.currencyCode)}
                    </span>
                    {hasDiscount && originalPrice && (
                      <>
                        <span className="text-base text-muted-foreground line-through">
                          {formatPrice(originalPrice.toString(), price.currencyCode)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-green-600 text-white rounded-md">
                          -{discountPercent}% OFF
                        </span>
                      </>
                    )}
                    {showAdminControls && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={startEditingPrice} className="h-6 w-6" title="Editar precio de variante seleccionada">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowVariantsPanel(true)} 
                          className="h-6 text-xs px-2 border-price-yellow/50 text-price-yellow hover:bg-price-yellow/10"
                          title="Editar precios de todas las variantes"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Todas las variantes
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Variants Price Panel */}
              {showAdminControls && product && (
                <VariantsPricePanel
                  open={showVariantsPanel}
                  onOpenChange={setShowVariantsPanel}
                  productId={product.id}
                  productTitle={product.title}
                  variants={product.variants.edges}
                  images={product.images.edges}
                  onVariantsUpdated={(updatedVariants) => {
                    setProduct({
                      ...product,
                      variants: { edges: updatedVariants },
                    });
                  }}
                />
              )}

              {/* Promo Banner - Only show if configured by admin */}
              {productOffer?.promo_active && productOffer?.promo_text && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{productOffer.promo_text}</p>
                    {productOffer.promo_subtext && (
                      <p className="text-xs text-muted-foreground">{productOffer.promo_subtext}</p>
                    )}
                  </div>
                </div>
              )}

              {/* About this product */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Acerca de este producto</h3>
                  {showAdminControls && (
                    <Button size="icon" variant="ghost" onClick={startEditingDescription} className="h-6 w-6">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {showAdminControls && editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="min-h-[100px]"
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
                ) : descriptionBullets.length > 0 ? (
                  <ul className="space-y-2">
                    {descriptionBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
                        {bullet.trim()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{displayDescription || 'Sin descripción disponible.'}</p>
                )}
              </div>

              {/* Size/Variant Selection (Nike style) */}
              <div className="space-y-4 border-t border-border pt-4">
                {/* Stock Urgency - Only if configured */}
                {productOffer?.low_stock_active && productOffer?.low_stock_threshold && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <span className="animate-pulse">🔥</span>
                    ¡Solo quedan {productOffer.low_stock_threshold} unidades!
                  </div>
                )}

                {product.options.filter(opt => opt.values.length > 1).map((option) => (
                  <div key={option.name} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {showAdminControls && editingOptionName === option.name ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedOptionName}
                            onChange={(e) => setEditedOptionName(e.target.value)}
                            className="h-8 w-32 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveAlias(product.id, option.name, editedOptionName);
                                setEditingOptionName(null);
                                toast.success('Nombre actualizado');
                              }
                              if (e.key === 'Escape') setEditingOptionName(null);
                            }}
                            autoFocus
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => {
                              saveAlias(product.id, option.name, editedOptionName);
                              setEditingOptionName(null);
                              toast.success('Nombre actualizado');
                            }}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingOptionName(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="text-sm font-medium text-foreground flex items-center gap-1">
                          Selecciona tu {getDisplayName(product.id, option.name).toLowerCase()}
                          {showAdminControls && (
                            <button
                              onClick={() => {
                                setEditingOptionName(option.name);
                                setEditedOptionName(getDisplayName(product.id, option.name));
                              }}
                              className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </label>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptions[option.name] === value;
                        return (
                          <button
                            key={value}
                            onClick={() => handleOptionChange(option.name, value)}
                            className={`min-w-[72px] px-5 py-3 text-sm border-2 rounded-lg transition-all relative ${
                              isSelected
                                ? "border-white bg-white text-black font-semibold shadow-md ring-2 ring-white/50"
                                : "border-border bg-background hover:border-muted-foreground text-foreground"
                            }`}
                          >
                            {value}
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 h-4 w-4 bg-price-yellow rounded-full flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-black" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add to Cart Button - White background, black text */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant?.availableForSale}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full bg-white text-black text-base font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <ShoppingBag className="h-5 w-5" />
                Añadir a la cesta
              </button>

              {/* Favorite Button (Nike style - outline with heart) */}
              <button
                onClick={() => product && toggleFavorite(product.id)}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full border text-base font-medium transition-all ${
                  isProductFavorite 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border text-foreground hover:border-muted-foreground'
                }`}
              >
                Favorito
                <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-primary' : ''}`} />
              </button>

              {/* Admin: Configure Offers Button */}
              {showAdminControls && (
                <Dialog open={showOfferEditor} onOpenChange={setShowOfferEditor}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Ofertas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Configurar Ofertas del Producto</DialogTitle>
                      <DialogDescription>
                        Personaliza los banners promocionales, descuentos y urgencia.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Promo Banner Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Banner Promocional</Label>
                          <Switch
                            checked={offerForm.promo_active}
                            onCheckedChange={(v) => setOfferForm({ ...offerForm, promo_active: v })}
                          />
                        </div>
                        <Input
                          placeholder="Texto principal (ej: ¡Compra 2 y llévate envío GRATIS!)"
                          value={offerForm.promo_text}
                          onChange={(e) => setOfferForm({ ...offerForm, promo_text: e.target.value })}
                        />
                        <Input
                          placeholder="Subtexto (ej: Oferta por tiempo limitado)"
                          value={offerForm.promo_subtext}
                          onChange={(e) => setOfferForm({ ...offerForm, promo_subtext: e.target.value })}
                        />
                      </div>

                      {/* Discount Section */}
                      <div className="space-y-3">
                        <Label className="font-semibold">Descuento</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Precio original (€)</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={offerForm.original_price}
                              onChange={(e) => setOfferForm({ ...offerForm, original_price: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">% Descuento</label>
                            <Input
                              type="number"
                              placeholder="25"
                              value={offerForm.discount_percent}
                              onChange={(e) => setOfferForm({ ...offerForm, discount_percent: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Urgency Offer Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Oferta con Fecha Límite</Label>
                          <Switch
                            checked={offerForm.offer_active}
                            onCheckedChange={(v) => setOfferForm({ ...offerForm, offer_active: v })}
                          />
                        </div>
                        <Input
                          type="datetime-local"
                          value={offerForm.offer_end_date}
                          onChange={(e) => setOfferForm({ ...offerForm, offer_end_date: e.target.value })}
                        />
                        <Input
                          placeholder="Texto de oferta (ej: ¡Oferta especial!)"
                          value={offerForm.offer_text}
                          onChange={(e) => setOfferForm({ ...offerForm, offer_text: e.target.value })}
                        />
                      </div>

                      {/* Stock Urgency Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Urgencia de Stock</Label>
                          <Switch
                            checked={offerForm.low_stock_active}
                            onCheckedChange={(v) => setOfferForm({ ...offerForm, low_stock_active: v })}
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="Cantidad (ej: 12)"
                          value={offerForm.low_stock_threshold}
                          onChange={(e) => setOfferForm({ ...offerForm, low_stock_threshold: e.target.value })}
                        />
                      </div>

                      <Button onClick={handleSaveOffer} className="w-full" disabled={upsertOffer.isPending}>
                        {upsertOffer.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Configuración
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Urgency Section - Only if configured with real date */}
              {offerTimeLeft && productOffer?.offer_text && (
                <div className="bg-gradient-to-r from-red-600 to-amber-500 rounded-xl p-4 space-y-2 text-white">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="h-5 w-5 animate-pulse" />
                    {productOffer.offer_text}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-xl">{offerTimeLeft.days}</span>
                      <p className="text-xs">días</p>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-xl">{offerTimeLeft.hours}</span>
                      <p className="text-xs">hrs</p>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-xl">{offerTimeLeft.minutes}</span>
                      <p className="text-xs">min</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin: Tags Section - Only in admin mode */}
              {showAdminControls && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    Etiquetas
                  </div>
                  <div className="space-y-3">
                    {TAG_GROUPS.map(groupName => {
                      const groupTags = tagsByGroup[groupName] || [];
                      if (groupTags.length === 0) return null;
                      return (
                        <div key={groupName}>
                          <p className="text-[10px] text-muted-foreground mb-1">{groupName}</p>
                          <div className="flex flex-wrap gap-1">
                            {groupTags.map(tag => {
                              const isAssigned = productTags.some(t => t.id === tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => handleToggleTag(tag)}
                                  disabled={savingTag}
                                  className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                                    isAssigned 
                                      ? 'bg-primary/20 border-primary text-primary' 
                                      : 'bg-muted border-border text-muted-foreground hover:border-primary'
                                  }`}
                                >
                                  {isAssigned && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
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

              {/* Admin Profit Analysis - Only visible in admin mode */}
              {showAdminControls && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      Profit Analysis
                    </div>
                    {!editingCost && (
                      <Button size="sm" variant="ghost" onClick={startEditingCost} className="h-7 text-xs">
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                  
                  {editingCost ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Coste producto</label>
                          <Input
                            value={editedProductCost}
                            onChange={(e) => setEditedProductCost(e.target.value)}
                            type="number"
                            step="0.01"
                            className="h-8 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Coste envío</label>
                          <Input
                            value={editedShippingCost}
                            onChange={(e) => setEditedShippingCost(e.target.value)}
                            type="number"
                            step="0.01"
                            className="h-8 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <Input
                        value={editedCostNotes}
                        onChange={(e) => setEditedCostNotes(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Notas..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCost} disabled={savingCost} className="h-7 text-xs flex-1">
                          {savingCost ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCost(false)} className="h-7 text-xs">
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
                        
                        return (
                          <div className="space-y-2 text-sm">
                            <p className="text-xs text-muted-foreground">CJ (no guardado)</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-background/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Coste</p>
                                <p className="font-bold text-destructive">${cjTotalCost.toFixed(2)}</p>
                              </div>
                              <div className="bg-background/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Venta</p>
                                <p className="font-bold text-price-yellow">{sellingPrice.toFixed(2)}€</p>
                              </div>
                              <div className="bg-background/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Profit</p>
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
                          <div className="text-center py-3">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">Buscando en CJ...</p>
                          </div>
                        );
                      }
                      
                      if (hasData) {
                        const totalCost = productCostData.product_cost + productCostData.shipping_cost;
                        const profit = sellingPrice - totalCost;
                        
                        return (
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-background/50 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground">Coste</p>
                              <p className="font-bold text-destructive">{totalCost.toFixed(2)}€</p>
                            </div>
                            <div className="bg-background/50 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground">Venta</p>
                              <p className="font-bold text-price-yellow">{sellingPrice.toFixed(2)}€</p>
                            </div>
                            <div className="bg-background/50 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground">Profit</p>
                              <p className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="text-center py-3">
                          <p className="text-xs text-muted-foreground mb-2">No hay datos de coste</p>
                          <Button size="sm" variant="ghost" onClick={fetchCJCostsForProduct} className="h-6 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Buscar en CJ
                          </Button>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Admin: Edit Status Checklist */}
              {showAdminControls && product && (
                <EditStatusChecklist shopifyProductId={product.id} />
              )}
            </div>
          </div>

          {/* Full HTML Description with Images (like Amazon) */}
          {(product.descriptionHtml || showAdminControls) && (
            <section className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Descripción del producto</h2>
                {showAdminControls && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Open Shopify admin to edit description
                      const productId = product.id.replace('gid://shopify/Product/', '');
                      window.open(`https://admin.shopify.com/store/astero-2/products/${productId}`, '_blank');
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-2" />
                    Editar en Shopify
                  </Button>
                )}
              </div>
              {product.descriptionHtml ? (
                <div 
                  className="product-description-styled max-w-4xl mx-auto
                    [&_img]:rounded-2xl [&_img]:shadow-xl [&_img]:mx-auto [&_img]:max-w-full [&_img]:my-8
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:flex [&_h1]:items-center [&_h1]:gap-2
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:border-b [&_h2]:border-border/50 [&_h2]:pb-2
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-4
                    [&_strong]:text-foreground [&_strong]:font-semibold
                    [&_em]:text-primary [&_em]:not-italic [&_em]:font-medium
                    [&_ul]:space-y-2 [&_ul]:my-4 [&_ul]:pl-0
                    [&_li]:text-muted-foreground [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:list-none [&_li]:pl-0
                    [&_li::before]:content-[''] [&_li]:relative
                    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80
                    [&>p:first-child]:hidden
                    [&_hr]:my-6 [&_hr]:border-border/30"
                  dangerouslySetInnerHTML={{ 
                    __html: product.descriptionHtml
                      .replace(/Product description:/gi, '')
                      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br/>')
                  }}
                />
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay descripción disponible. Añádela desde Shopify.
                </p>
              )}
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Reseñas de clientes
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(reviewStats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{reviewStats.averageRating || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              </div>
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Escribir reseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Escribe tu reseña</DialogTitle>
                    <DialogDescription>
                      Comparte tu experiencia con este producto.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tu nombre</Label>
                      <Input
                        value={reviewForm.user_name}
                        onChange={(e) => setReviewForm({ ...reviewForm, user_name: e.target.value })}
                        placeholder="Tu nombre..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Puntuación</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`h-6 w-6 ${star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Título (opcional)</Label>
                      <Input
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        placeholder="Resume tu experiencia..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comentario (opcional)</Label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Cuéntanos más sobre tu experiencia..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSubmitReview} className="w-full" disabled={createReview.isPending}>
                      {createReview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Enviar reseña
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aún no hay reseñas para este producto.</p>
                <p className="text-sm">¡Sé el primero en compartir tu experiencia!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => {
                  const isOwnReview = currentUserId && review.user_id === currentUserId;
                  const canDelete = showAdminControls || isOwnReview;
                  const canEdit = isOwnReview;
                  const isEditing = editingReviewId === review.id;
                  
                  return (
                    <div key={review.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {review.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setEditReviewForm({...editReviewForm, rating: star})}
                                  className="p-0.5"
                                >
                                  <Star
                                    className={`h-4 w-4 ${star <= editReviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                            </div>
                          )}
                          {!isEditing && (canEdit || canDelete) && (
                            <div className="flex items-center gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setEditingReviewId(review.id);
                                    setEditReviewForm({
                                      rating: review.rating,
                                      title: review.title || '',
                                      comment: review.comment || '',
                                    });
                                  }}
                                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('¿Eliminar esta reseña?')) return;
                                    try {
                                      await deleteReview.mutateAsync({ reviewId: review.id, productId: product!.id });
                                      toast.success('Reseña eliminada');
                                    } catch (error) {
                                      toast.error('Error al eliminar');
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editReviewForm.title}
                            onChange={(e) => setEditReviewForm({...editReviewForm, title: e.target.value})}
                            placeholder="Título (opcional)"
                            className="text-sm"
                          />
                          <Textarea
                            value={editReviewForm.comment}
                            onChange={(e) => setEditReviewForm({...editReviewForm, comment: e.target.value})}
                            placeholder="Comentario..."
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={async () => {
                                try {
                                  await updateReview.mutateAsync({
                                    reviewId: review.id,
                                    productId: product!.id,
                                    updates: {
                                      rating: editReviewForm.rating,
                                      title: editReviewForm.title || null,
                                      comment: editReviewForm.comment || null,
                                    }
                                  });
                                  toast.success('Reseña actualizada');
                                  setEditingReviewId(null);
                                } catch (error) {
                                  toast.error('Error al actualizar');
                                }
                              }}
                              disabled={updateReview.isPending}
                            >
                              {updateReview.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                              Guardar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {review.title && (
                            <p className="font-medium text-sm">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Related Products */}
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
