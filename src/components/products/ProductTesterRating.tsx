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

  return (
    <div className="rounded-xl bg-gradient-to-br from-price-yellow to-amber-500 p-4 sm:p-5 shadow-lg">
      <h3 className="text-base sm:text-lg font-display uppercase italic text-foreground mb-3 flex items-center gap-2">
        <Star className="w-4 h-4 sm:w-5 sm:h-5" />
        Evaluación de Producto (Tester)
      </h3>
      
      {!isValidated ? (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-foreground/80">
            Ingresa tu código de tester para evaluar este producto
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Código de tester..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              className="bg-background/90 border-foreground/20 text-foreground placeholder:text-foreground/50"
            />
            <Button 
              onClick={handleValidateCode} 
              disabled={validateCode.isPending}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              Validar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-foreground text-background font-semibold">{testerName}</Badge>
              {existingRating && (
                <Badge variant="outline" className="capitalize border-foreground/30 text-foreground bg-background/20">
                  {RATING_OPTIONS.find((r) => r.value === existingRating.rating)?.label || existingRating.rating}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-foreground hover:bg-foreground/10 self-start sm:self-auto"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {RATING_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                className={`${option.color} text-white text-xs sm:text-sm px-2 sm:px-3 ${existingRating?.rating === option.value ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                onClick={() => handleRate(option.value)}
                disabled={upsertRating.isPending}
              >
                {option.icon}
                <span className="ml-1 truncate">{option.label}</span>
              </Button>
            ))}
            {existingRating && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteRating.isPending}
                className="text-xs sm:text-sm col-span-2 sm:col-span-1"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Borrar
              </Button>
            )}
          </div>

          <Textarea
            placeholder="Notas adicionales (opcional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[50px] sm:min-h-[60px] bg-background/90 border-foreground/20 text-foreground placeholder:text-foreground/50 text-sm"
          />
          {notes !== (existingRating?.notes || "") && existingRating && (
            <Button
              size="sm"
              onClick={() => handleRate(existingRating.rating as RatingValue)}
              disabled={upsertRating.isPending}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Guardar notas
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
