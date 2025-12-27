import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Check, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';

export function StockRequestsPanel() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['stock-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('stock_notifications')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-notifications'] });
      toast.success("Estado actualizado");
    }
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-notifications'] });
      toast.success("Solicitud eliminada");
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-price-yellow" />
          <h2 className="text-xl font-semibold">Solicitudes de Stock</h2>
        </div>
        <Badge variant="outline">{requests?.length || 0} solicitudes</Badge>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay solicitudes pendientes
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="text-xs">
                    {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {req.email}
                  </TableCell>
                  <TableCell>{req.product_title || 'Unknown'}</TableCell>
                  <TableCell>{req.variant_title || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'sent' ? 'secondary' : 'default'} className={req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}>
                      {req.status === 'pending' ? 'Pendiente' : 'Enviado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => updateStatus.mutate({ id: req.id, status: 'sent' })}
                          title="Marcar como notificado"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteRequest.mutate(req.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
