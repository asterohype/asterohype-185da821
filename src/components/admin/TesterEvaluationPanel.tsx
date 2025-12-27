import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductTestRating, RatingValue } from "@/hooks/useProductTestRatings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search, Filter, MessageSquare, ExternalLink, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { fetchProductByHandle, ShopifyProduct } from "@/lib/shopify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to get products details (since ratings only store ID)
// We will fetch product details on demand or just link to them
async function fetchRatingDetails() {
  const { data, error } = await supabase
    .from("product_test_ratings")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as ProductTestRating[];
}

export function TesterEvaluationPanel({ products }: { products: ShopifyProduct[] }) {
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ratings, isLoading } = useQuery({
    queryKey: ["admin-all-test-ratings"],
    queryFn: fetchRatingDetails,
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_test_ratings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evaluación eliminada");
      queryClient.invalidateQueries({ queryKey: ["admin-all-test-ratings"] });
    },
    onError: () => toast.error("Error al eliminar evaluación"),
  });

  const filteredRatings = useMemo(() => {
    if (!ratings) return [];
    return ratings.filter(r => {
      const matchesSearch = r.tester_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterRating === "all" || r.rating === filterRating;
      return matchesSearch && matchesFilter;
    });
  }, [ratings, searchQuery, filterRating]);

  const getRatingColor = (rating: RatingValue) => {
    switch (rating) {
      case 'excelente': return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
      case 'muy_bien': return "bg-green-500/15 text-green-700 border-green-200";
      case 'bien': return "bg-blue-500/15 text-blue-700 border-blue-200";
      case 'mas_o_menos': return "bg-yellow-500/15 text-yellow-700 border-yellow-200";
      case 'no_muy_bien': return "bg-red-500/15 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingLabel = (rating: RatingValue) => {
    return rating.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Evaluación de Testers</h2>
          <p className="text-muted-foreground">Gestiona y revisa las opiniones internas sobre los productos.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nota..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="excelente">Excelente</SelectItem>
              <SelectItem value="muy_bien">Muy Bien</SelectItem>
              <SelectItem value="bien">Bien</SelectItem>
              <SelectItem value="mas_o_menos">Más o Menos</SelectItem>
              <SelectItem value="no_muy_bien">No Muy Bien (Revisar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Producto (ID)</TableHead>
              <TableHead className="whitespace-nowrap">Tester</TableHead>
              <TableHead className="whitespace-nowrap">Valoración</TableHead>
              <TableHead className="whitespace-nowrap">Notas</TableHead>
              <TableHead className="whitespace-nowrap">Fecha</TableHead>
              <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Cargando evaluaciones...</TableCell>
              </TableRow>
            ) : filteredRatings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron evaluaciones con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              filteredRatings.map((rating) => {
                const product = products.find(p => p.node.id === rating.shopify_product_id);
                const handle = product?.node.handle;
                const productId = rating.shopify_product_id.replace('gid://shopify/Product/', '');

                return (
                <TableRow key={rating.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {productId}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <a href={`https://admin.shopify.com/store/e7kzti-96/products/${productId}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                             <ExternalLink className="h-3 w-3 mr-2" /> Shopify Admin
                          </a>
                        </DropdownMenuItem>
                        {handle && (
                          <DropdownMenuItem asChild>
                            <a href={`/product/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                               <ExternalLink className="h-3 w-3 mr-2" /> Ver en Tienda
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="font-mono">{rating.tester_code}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={`${getRatingColor(rating.rating)} border shadow-sm`}>
                      {getRatingLabel(rating.rating)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate whitespace-nowrap">
                    {rating.notes ? (
                      <div className="flex items-center gap-2" title={rating.notes}>
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{rating.notes}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Sin notas</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta evaluación?')) {
                          deleteRatingMutation.mutate(rating.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
