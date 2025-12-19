import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Phone, Chrome } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

const phoneSchema = z.object({
  phone: z.string().min(9, "Número de teléfono inválido"),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setOtp("");
    setOtpSent(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    const validation = signupSchema.safeParse({ email, password, fullName });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("Este email ya está registrado. Intenta iniciar sesión.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("¡Cuenta creada! Bienvenido a AsteroHype");
      onOpenChange(false);
      resetForm();
    }
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciales inválidas");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("¡Bienvenido!");
      onOpenChange(false);
      resetForm();
    }
    setLoading(false);
  };

  const handlePhoneOtp = async () => {
    const validation = phoneSchema.safeParse({ phone });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+34${phone}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Código enviado a tu teléfono");
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Introduce el código de 6 dígitos");
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+34${phone}`;
    
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Verificado correctamente!");
      onOpenChange(false);
      resetForm();
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "email") {
      if (mode === "signup") {
        handleEmailSignup();
      } else {
        handleEmailLogin();
      }
    } else if (method === "phone") {
      if (otpSent) {
        handleVerifyOtp();
      } else {
        handlePhoneOtp();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg p-0 gap-0 bg-popover border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        {/* Header Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMode("signup"); resetForm(); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mode === "signup" 
                ? "text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          >
            Registrarse
          </button>
          <button
            onClick={() => { setMode("login"); resetForm(); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mode === "login" 
                ? "text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          >
            Iniciar Sesión
          </button>
        </div>

        <div className="p-6">
          {/* Google Button */}
          <Button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl py-5"
            variant="outline"
          >
            <Chrome className="h-5 w-5" />
            Continuar con Google
          </Button>

          {/* Method Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMethod("email"); setOtpSent(false); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                method === "email"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={{ boxShadow: 'none' }}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => { setMethod("phone"); setOtpSent(false); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                method === "phone"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={{ boxShadow: 'none' }}
            >
              <Phone className="h-4 w-4 inline mr-2" />
              Teléfono
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                {method === "email" ? "o con email" : "o con teléfono"}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {method === "email" ? (
              <>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Tu nombre"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+34 612 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Código de verificación</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-5 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : method === "phone" ? (
                otpSent ? "Verificar código" : "Enviar código"
              ) : mode === "signup" ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
