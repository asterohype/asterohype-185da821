import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface AdminRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminRequestModal({ open, onOpenChange }: AdminRequestModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "pending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error("Introduce el código de invitación");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      // Get device info
      const deviceInfo = `${navigator.userAgent} | ${navigator.language} | ${screen.width}x${screen.height}`;

      const { data, error } = await supabase.functions.invoke("request-admin-access", {
        body: { invitationCode: code, deviceInfo },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        if (data.status === "pending") {
          setStatus("pending");
        } else if (data.status === "approved") {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error);
        }
        return;
      }

      setStatus("success");
      toast.success("Solicitud enviada correctamente");
    } catch (err) {
      console.error("Error requesting admin:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (status === "success") {
      return (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Solicitud Enviada</h3>
          <p className="text-muted-foreground text-sm">
            Tu solicitud ha sido enviada. Recibirás una respuesta pronto.
          </p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Cerrar
          </Button>
        </div>
      );
    }

    if (status === "pending") {
      return (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Solicitud Pendiente</h3>
          <p className="text-muted-foreground text-sm">
            Ya tienes una solicitud pendiente de aprobación.
          </p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Cerrar
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code">Código de Invitación</Label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Introduce tu código"
            className="font-mono"
            autoComplete="off"
          />
          {status === "error" && errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Al solicitar acceso, se enviará un email al administrador con información 
          sobre tu dispositivo y ubicación para verificar tu identidad.
        </p>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Solicitar Acceso Admin"
          )}
        </Button>
      </form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Acceso Administrador</DialogTitle>
              <DialogDescription>
                Solicita acceso con tu código de invitación
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}