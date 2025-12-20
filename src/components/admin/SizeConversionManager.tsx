import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Wand2, Plus, Save } from 'lucide-react';
import { useSizeConversions, useUpsertSizeConversion, useDeleteSizeConversion, useGenerateSizeConversions } from '@/hooks/useSizeConversions';
import { toast } from 'sonner';

interface SizeConversionManagerProps {
  shopifyProductId: string;
  productSizes: string[];
}

export const SizeConversionManager = ({ shopifyProductId, productSizes }: SizeConversionManagerProps) => {
  const { data: conversions, isLoading } = useSizeConversions(shopifyProductId);
  const upsertMutation = useUpsertSizeConversion();
  const deleteMutation = useDeleteSizeConversion();
  const generateMutation = useGenerateSizeConversions();
  
  const [newAsianSize, setNewAsianSize] = useState('');
  const [newLocalSize, setNewLocalSize] = useState('');
  const [sizeType, setSizeType] = useState('clothing');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleGenerate = async () => {
    if (productSizes.length === 0) {
      toast.error('No hay tallas disponibles en el producto');
      return;
    }
    
    try {
      await generateMutation.mutateAsync({
        shopifyProductId,
        asianSizes: productSizes,
        sizeType,
      });
      toast.success('Conversiones generadas automáticamente');
    } catch (error) {
      toast.error('Error al generar conversiones');
    }
  };

  const handleAdd = async () => {
    if (!newAsianSize || !newLocalSize) {
      toast.error('Completa ambos campos');
      return;
    }
    
    try {
      await upsertMutation.mutateAsync({
        shopify_product_id: shopifyProductId,
        asian_size: newAsianSize,
        local_size: newLocalSize,
        size_type: sizeType,
        notes: 'Añadido manualmente',
      });
      setNewAsianSize('');
      setNewLocalSize('');
      toast.success('Conversión añadida');
    } catch (error) {
      toast.error('Error al añadir conversión');
    }
  };

  const handleSaveEdit = async (id: string, asianSize: string) => {
    try {
      await upsertMutation.mutateAsync({
        shopify_product_id: shopifyProductId,
        asian_size: asianSize,
        local_size: editValue,
        size_type: sizeType,
        notes: 'Editado manualmente',
      });
      setEditingId(null);
      toast.success('Conversión actualizada');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, shopifyProductId });
      toast.success('Conversión eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Cargando conversiones...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Conversión de Tallas (Asia → Local)</span>
          <Select value={sizeType} onValueChange={setSizeType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clothing">Ropa</SelectItem>
              <SelectItem value="shoes">Calzado</SelectItem>
              <SelectItem value="accessories">Accesorios</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate button */}
        <Button 
          variant="outline" 
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="w-full"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Generar conversiones automáticas ({productSizes.length} tallas)
        </Button>

        {/* Existing conversions */}
        {conversions && conversions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talla Asia</TableHead>
                <TableHead>Talla Local</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell className="font-medium">{conv.asian_size}</TableCell>
                  <TableCell>
                    {editingId === conv.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(conv.id, conv.asian_size)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => {
                          setEditingId(conv.id);
                          setEditValue(conv.local_size);
                        }}
                      >
                        {conv.local_size}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(conv.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add new conversion */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Talla Asia</Label>
            <Input
              value={newAsianSize}
              onChange={(e) => setNewAsianSize(e.target.value)}
              placeholder="Ej: M, L, 40..."
              className="h-9"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Talla Local</Label>
            <Input
              value={newLocalSize}
              onChange={(e) => setNewLocalSize(e.target.value)}
              placeholder="Ej: L, XL, 42 EU..."
              className="h-9"
            />
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
