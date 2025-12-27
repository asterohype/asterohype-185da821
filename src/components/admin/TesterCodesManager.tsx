import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
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

interface TesterCode {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function TesterCodesManager() {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["tester-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tester_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TesterCode[];
    },
  });

  const createCode = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      const { data, error } = await supabase
        .from("tester_codes")
        .insert({ code, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tester-codes"] });
      setNewCode("");
      setNewName("");
      toast.success("Código de tester creado");
    },
    onError: () => {
      toast.error("Error al crear código");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("tester_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tester-codes"] });
      toast.success("Estado actualizado");
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tester_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tester-codes"] });
      toast.success("Código eliminado");
    },
  });

  const handleCreate = () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Ingresa código y nombre");
      return;
    }
    createCode.mutate({ code: newCode.trim(), name: newName.trim() });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Códigos de Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new code */}
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Código (ej: TEST01)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            className="max-w-[150px]"
          />
          <Input
            placeholder="Nombre del tester"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="max-w-[200px]"
          />
          <Button
            onClick={handleCreate}
            disabled={createCode.isPending}
            variant="hero"
            size="sm"
          >
            {createCode.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Crear
              </>
            )}
          </Button>
        </div>

        {/* List of codes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay códigos de tester creados
          </p>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={code.is_active ? "default" : "secondary"}>
                    {code.code}
                  </Badge>
                  <span className="text-sm font-medium">{code.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {code.is_active ? "Activo" : "Inactivo"}
                    </span>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={(v) =>
                        toggleActive.mutate({ id: code.id, is_active: v })
                      }
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar código?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El código "{code.code}" de {code.name} será eliminado.
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCode.mutate(code.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
