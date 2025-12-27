import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Heart, ShoppingBag, Settings, LogOut, User as UserIcon, Calendar, Mail } from "lucide-react";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCartStore } from "@/stores/cartStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const favorites = useFavoritesStore((state) => state.favorites);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 mt-16 md:mt-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Profile */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">{profile?.full_name || "Usuario"}</h1>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-muted-foreground text-sm justify-center md:justify-start">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Unido el {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
              </div>
            </div>

            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</div>
                <div className="text-xs text-muted-foreground">En Carrito</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-1">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{favorites.length}</div>
                <div className="text-xs text-muted-foreground">Favoritos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-1">
                  <Package className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Pedidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-1">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">-</div>
                <div className="text-xs text-muted-foreground">Ajustes</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl mb-6 overflow-x-auto">
              <TabsTrigger value="orders" className="flex-1 min-w-[100px] py-2.5">Mis Pedidos</TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1 min-w-[100px] py-2.5">Favoritos</TabsTrigger>
              <TabsTrigger value="account" className="flex-1 min-w-[100px] py-2.5">Cuenta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pedidos</CardTitle>
                  <CardDescription>Revisa el estado de tus compras recientes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mb-4 opacity-20" />
                    <p>No tienes pedidos recientes.</p>
                    <Button variant="link" onClick={() => navigate('/products')}>Ir a la tienda</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Favoritos</CardTitle>
                  <CardDescription>Productos que has guardado para después.</CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Placeholder for favorite items list - relying on Favorites page logic ideally */}
                      <p className="col-span-full text-center py-8 text-muted-foreground">
                        Tienes {favorites.length} productos en favoritos. <Button variant="link" onClick={() => navigate('/favorites')}>Ver todos</Button>
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Heart className="h-12 w-12 mb-4 opacity-20" />
                      <p>Tu lista de deseos está vacía.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Cuenta</CardTitle>
                  <CardDescription>Gestiona tu información personal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Correo Electrónico</label>
                    <div className="p-3 bg-muted rounded-md text-sm">{user.email}</div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Nombre Completo</label>
                    <div className="p-3 bg-muted rounded-md text-sm">{profile?.full_name || "No especificado"}</div>
                  </div>
                  {/* More fields could be added here */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNavBar
        onSearchClick={() => {}} // Handle via context or props if needed
      />
    </div>
  );
}
