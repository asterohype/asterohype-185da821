import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useProductTags } from "@/hooks/useProductTags";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GROUP_ORDER = [
  'General', 'Abrigos', 'Accesorios', 'Belleza', 'Calzado', 'Cocina', 
  'Decoración', 'Deporte', 'Electrónica', 'Fundas', 'Gadgets', 'Hogar', 
  'Hombre', 'Mujer', 'niños', 'Ropa', 'Tecnología', 'Zapatos', 
  'Ropa Detallado', 'Estilos', 'Destacados'
];

export default function Categories() {
  const { getTagsByGroup, loading } = useProductTags();
  const tagsByGroup = getTagsByGroup();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-[100px] md:pt-[130px] pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="font-display text-3xl md:text-4xl uppercase italic">Todas las Categorías</h1>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Cargando categorías...</div>
          ) : (
            <div className="space-y-12">
              {GROUP_ORDER.map((group) => {
                const tags = tagsByGroup[group] || [];
                if (tags.length === 0) return null;

                return (
                  <div key={group} className="space-y-4">
                    <h2 className="text-2xl font-bold border-b border-border pb-2">{group}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/products?tag=${tag.slug}`}
                          className="group bg-card border border-border hover:border-price-yellow rounded-xl p-4 transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col items-center text-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold group-hover:bg-price-yellow/20 group-hover:text-price-yellow transition-colors">
                            {tag.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{tag.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
