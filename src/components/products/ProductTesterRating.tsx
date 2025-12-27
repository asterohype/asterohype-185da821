import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Trash2, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  useProductTestRating,
  useUpsertTestRating,
  useDeleteTestRating,
  useValidateTesterCode,
  RatingValue,
} from "@/hooks/useProductTestRatings";

interface ProductTesterRatingProps {
  shopifyProductId: string;
}

const RATING_OPTIONS: { value: RatingValue; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "excelente", label: "Excelente", color: "bg-green-500 hover:bg-green-600", icon: <Star className="w-3 h-3 sm:w-4 sm:h-4" /> },
  { value: "muy_bien", label: "Muy Bien", color: "bg-emerald-500 hover:bg-emerald-600", icon: <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" /> },
  { value: "bien", label: "Bien", color: "bg-blue-500 hover:bg-blue-600", icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> },
  { value: "mas_o_menos", label: "Más o menos", color: "bg-yellow-500 hover:bg-yellow-600", icon: <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" /> },
  { value: "no_muy_bien", label: "No está bien", color: "bg-red-500 hover:bg-red-600", icon: <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" /> },
];

export function ProductTesterRating({ shopifyProductId }: ProductTesterRatingProps) {
  const [testerCode, setTesterCode] = useState<string>("");
  const [isValidated, setIsValidated] = useState(false);
  const [testerName, setTesterName] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [inputCode, setInputCode] = useState("");

  // Load tester code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem("testerCode");
    const savedName = localStorage.getItem("testerName");
    if (savedCode) {
      setTesterCode(savedCode);
      setIsValidated(true);
      if (savedName) setTesterName(savedName);
    }
  }, []);

  const { data: existingRating, isLoading } = useProductTestRating(shopifyProductId, isValidated ? testerCode : null);
  const upsertRating = useUpsertTestRating();
  const deleteRating = useDeleteTestRating();
  const validateCode = useValidateTesterCode();

  const handleValidateCode = async () => {
    if (!inputCode.trim()) {
      toast.error("Ingresa un código de tester");
      return;
    }
    try {
      const result = await validateCode.mutateAsync(inputCode.trim());
      if (result) {
        setTesterCode(result.code);
        setTesterName(result.name);
        setIsValidated(true);
        localStorage.setItem("testerCode", result.code);
        localStorage.setItem("testerName", result.name);
        toast.success(`¡Bienvenido, ${result.name}!`);
      } else {
        toast.error("Código inválido o inactivo");
      }
    } catch (error) {
      toast.error("Error al validar código");
    }
  };

  const handleRate = async (rating: RatingValue) => {
    try {
      await upsertRating.mutateAsync({
        shopifyProductId,
        testerCode,
        rating,
        notes: notes || undefined,
      });
      toast.success("Calificación guardada");
    } catch (error) {
      toast.error("Error al guardar calificación");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRating.mutateAsync({
        shopifyProductId,
        testerCode,
      });
      setNotes("");
      toast.success("Calificación eliminada");
    } catch (error) {
      toast.error("Error al eliminar calificación");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("testerCode");
    localStorage.removeItem("testerName");
    setTesterCode("");
    setTesterName("");
    setIsValidated(false);
    setInputCode("");
    toast.info("Sesión de tester cerrada");
  };

  // Update notes when existing rating loads
  useEffect(() => {
    if (existingRating?.notes) {
      setNotes(existingRating.notes);
    }
  }, [existingRating]);

  if (!isValidated) {
    return (
      <div className="w-full bg-secondary/20 rounded-xl p-4 sm:p-6 border border-border/50 backdrop-blur-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          Área de Evaluación (Testers)
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Código de tester..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="max-w-xs bg-background/80"
            onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
          />
          <Button onClick={handleValidateCode} disabled={validateCode.isPending} variant="secondary">
            {validateCode.isPending ? "Validando..." : "Acceder"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden animate-fade-up">
      <div className="bg-muted/40 p-4 sm:px-6 flex justify-between items-center border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-medium block">Hola, {testerName}</span>
            <span className="text-xs text-muted-foreground">Evaluación de producto</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 text-xs text-muted-foreground hover:text-destructive">
          Salir
        </Button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
            ¿Qué opinas de este producto?
          </label>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((option) => {
              const isActive = existingRating?.rating === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleRate(option.value)}
                  disabled={upsertRating.isPending}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    border
                    ${isActive 
                      ? `${option.color} text-white border-transparent shadow-md scale-105` 
                      : "bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
            Notas adicionales (Opcional)
          </label>
          <div className="relative">
            <Textarea
              placeholder="¿Por qué elegiste esa calificación? ¿Algún defecto o sugerencia?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none bg-muted/20 focus:bg-background transition-colors"
            />
            {existingRating && notes !== existingRating.notes && (
              <Button 
                size="sm" 
                className="absolute bottom-3 right-3 h-7 text-xs"
                onClick={() => handleRate(existingRating.rating)}
              >
                Actualizar nota
              </Button>
            )}
          </div>
        </div>

        {existingRating && (
          <div className="flex justify-between items-center pt-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              Evaluado el {new Date(existingRating.updated_at).toLocaleDateString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteRating.isPending}
              className="text-destructive hover:bg-destructive/10 h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Borrar mi evaluación
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
