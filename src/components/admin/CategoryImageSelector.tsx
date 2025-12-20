import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShopifyProduct } from "@/lib/shopify";
import { Upload, Image, Trash2, Search, Check, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface CategoryImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  onClearImage: () => void;
  products: ShopifyProduct[];
  currentImage?: string;
  categoryName: string;
}

const PRODUCTS_PER_PAGE = 20;

export function CategoryImageSelector({
  isOpen,
  onClose,
  onSelectImage,
  onClearImage,
  products,
  currentImage,
  categoryName,
}: CategoryImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // When viewing a product's images, store the product
  const [viewingProduct, setViewingProduct] = useState<ShopifyProduct | null>(null);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.node.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSelectImage(dataUrl);
      toast.success("Imagen subida correctamente");
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectProductImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      toast.success("Imagen seleccionada");
      onClose();
    }
  };

  const handleClearImage = () => {
    onClearImage();
    toast.success("Imagen eliminada");
    onClose();
  };

  const handleProductClick = (product: ShopifyProduct) => {
    setViewingProduct(product);
    setSelectedImage(null);
  };

  const handleBackToProducts = () => {
    setViewingProduct(null);
    setSelectedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Imagen de categoría: {categoryName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Elegir de producto
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir archivo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Select from products */}
          <TabsContent value="products" className="space-y-4">
            {viewingProduct ? (
              // Viewing a specific product's images
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToProducts}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a productos
                </Button>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">{viewingProduct.node.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {viewingProduct.node.images.edges.length} imagen(es) disponibles
                  </p>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-3 gap-4">
                    {viewingProduct.node.images.edges.map((img, index) => (
                      <button
                        key={`${viewingProduct.node.id}-img-${index}`}
                        onClick={() => setSelectedImage(img.node.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                          selectedImage === img.node.url
                            ? "border-primary ring-4 ring-primary/30"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={img.node.url}
                          alt={img.node.altText || `Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {selectedImage === img.node.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-10 w-10 text-primary drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <Button
                  onClick={handleSelectProductImage}
                  disabled={!selectedImage}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Usar esta imagen
                </Button>
              </div>
            ) : (
              // Viewing all products
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Products grid */}
                <ScrollArea className="h-[380px] pr-4">
                  <div className="grid grid-cols-4 gap-3">
                    {paginatedProducts.map((product) => (
                      <button
                        key={product.node.id}
                        onClick={() => handleProductClick(product)}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all hover:scale-105 group"
                      >
                        <img
                          src={product.node.images.edges[0]?.node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs font-medium text-foreground line-clamp-2">
                            {product.node.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {product.node.images.edges.length} imgs
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No se encontraron productos
                    </p>
                  )}
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({filteredProducts.length} productos)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Clear button */}
                {currentImage && (
                  <Button variant="destructive" onClick={handleClearImage} className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar imagen actual
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Upload file */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <label htmlFor="image-upload">
                <Button asChild variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                  </span>
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Current image preview */}
            {currentImage && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Imagen actual:</p>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                  <img
                    src={currentImage}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button variant="destructive" size="sm" onClick={handleClearImage}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar imagen
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
