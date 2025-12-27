import { useState, useMemo, useEffect } from "react";
import { useProductEditStatuses, ProductEditStatus } from "@/hooks/useProductEditStatus";
import { ShopifyProduct } from "@/lib/shopify";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Search, Clock, ArrowRight } from "lucide-react";

export function EditStatusRegistry({ products }: { products: any[] }) {
  const { data: statuses, isLoading } = useProductEditStatuses();
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [search, setSearch] = useState("");
  const [lastEditedId, setLastEditedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_last_edited_product");
    if (saved) setLastEditedId(saved);
  }, []);

  const filteredData = useMemo(() => {
    if (!statuses) return [];
    
    return statuses.filter(item => {
      // Filter logic
      if (filter === "completed" && !item.all_done) return false;
      if (filter === "pending" && item.all_done) return false;

      // Search logic (ID)
      if (search && !item.shopify_product_id.includes(search)) return false;

      return true;
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [statuses, filter, search]);

  const calculateProgress = (item: ProductEditStatus) => {
    const fields = [
      item.title_done,
      item.price_done,
      item.description_done,
      item.about_done,
      item.model_done,
      item.color_done,
      item.tags_done,
      item.offers_done,
      item.images_done
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const getMissingFields = (item: ProductEditStatus) => {
    const missing = [];
    if (!item.title_done) missing.push("Título");
    if (!item.price_done) missing.push("Precio");
    if (!item.description_done) missing.push("Desc.");
    if (!item.images_done) missing.push("Img");
    if (!item.tags_done) missing.push("Tags");
    
    if (missing.length === 0) return "Completo";
    if (missing.length > 3) return `${missing.length} pendientes`;
    return missing.join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registro de Edición</h2>
          <p className="text-muted-foreground">Control de progreso de edición de productos.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ID..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {lastEditedId && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Último producto editado</p>
              <p className="text-xs text-muted-foreground font-mono">{lastEditedId.replace('gid://shopify/Product/', '')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`/products?edit=${lastEditedId}`} className="gap-2">
              Continuar <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Producto ID</TableHead>
              <TableHead className="whitespace-nowrap">Progreso</TableHead>
              <TableHead className="whitespace-nowrap">Estado</TableHead>
              <TableHead className="whitespace-nowrap">Faltantes</TableHead>
              <TableHead className="whitespace-nowrap">Última Act.</TableHead>
              <TableHead className="text-right whitespace-nowrap">Ir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay registros.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const progress = calculateProgress(item);
                const simpleId = item.shopify_product_id.replace('gid://shopify/Product/', '');
                const product = products.find(p => p.node.id === item.shopify_product_id);
                const handle = product?.node.handle;
                const title = product?.node.title || simpleId;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs max-w-[150px] truncate" title={title}>
                      {title}
                      <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">{simpleId}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.all_done ? (
                        <Badge className="bg-green-500/15 text-green-700 border-green-200 hover:bg-green-500/25">Completado</Badge>
                      ) : (
                        <Badge variant="secondary">En Progreso</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate whitespace-nowrap">
                      {getMissingFields(item)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Editar en Shopify">
                          <a href={`https://admin.shopify.com/store/e7kzti-96/products/${simpleId}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        {handle && (
                          <Button variant="ghost" size="icon" asChild title="Ver en tienda">
                            <a href={`/product/${handle}`} target="_blank" rel="noopener noreferrer">
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
