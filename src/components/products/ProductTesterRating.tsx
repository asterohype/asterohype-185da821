import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  { value: "excelente", label: "Excelente", color: "bg-green-500 hover:bg-green-600", icon: <Star className="w-4 h-4" /> },
  { value: "muy_bien", label: "Muy Bien", color: "bg-emerald-500 hover:bg-emerald-600", icon: <ThumbsUp className="w-4 h-4" /> },
  { value: "bien", label: "Bien", color: "bg-blue-500 hover:bg-blue-600", icon: <CheckCircle className="w-4 h-4" /> },
  { value: "mas_o_menos", label: "Más o menos", color: "bg-yellow-500 hover:bg-yellow-600", icon: <AlertCircle className="w-4 h-4" /> },
  { value: "no_muy_bien", label: "No está muy bien", color: "bg-red-500 hover:bg-red-600", icon: <ThumbsDown className="w-4 h-4" /> },
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
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Evaluación de Producto (Tester)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isValidated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ingresa tu código de tester para evaluar este producto
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Código de tester..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              />
              <Button onClick={handleValidateCode} disabled={validateCode.isPending}>
                Validar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{testerName}</Badge>
                {existingRating && (
                  <Badge variant="outline" className="capitalize">
                    {RATING_OPTIONS.find((r) => r.value === existingRating.rating)?.label || existingRating.rating}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <XCircle className="w-4 h-4 mr-1" />
                Salir
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  className={`${option.color} text-white ${existingRating?.rating === option.value ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  onClick={() => handleRate(option.value)}
                  disabled={upsertRating.isPending}
                >
                  {option.icon}
                  <span className="ml-1">{option.label}</span>
                </Button>
              ))}
              {existingRating && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteRating.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Borrar
                </Button>
              )}
            </div>

            <Textarea
              placeholder="Notas adicionales (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
            {notes !== (existingRating?.notes || "") && existingRating && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRate(existingRating.rating as RatingValue)}
                disabled={upsertRating.isPending}
              >
                Guardar notas
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
