import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShopifyProduct } from "@/lib/shopify";
import { Upload, Image, Trash2, Search, Check } from "lucide-react";
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

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.node.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all unique images from products
  const productImages = filteredProducts.flatMap((p) =>
    p.node.images.edges.map((img) => ({
      url: img.node.url,
      productTitle: p.node.title,
      productId: p.node.id,
    }))
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    // Convert to base64 for local storage (or you could upload to storage)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
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
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Images grid */}
            <ScrollArea className="h-[350px] pr-4">
              <div className="grid grid-cols-4 gap-3">
                {productImages.slice(0, 60).map((img, index) => (
                  <button
                    key={`${img.productId}-${index}`}
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImage === img.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.productTitle}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedImage === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-8 w-8 text-primary drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {productImages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No se encontraron imágenes
                </p>
              )}
            </ScrollArea>

            {/* Select button */}
            <div className="flex gap-2">
              <Button
                onClick={handleSelectProductImage}
                disabled={!selectedImage}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Usar imagen seleccionada
              </Button>
              {currentImage && (
                <Button variant="destructive" onClick={handleClearImage}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearImage}
                >
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