import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { CategorySection } from "@/components/home/CategorySection";
import { Sponsors } from "@/components/home/Sponsors";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <CategorySection title="Tecnología & Gadgets" categoryFilter="tech" limit={4} />
        <CategorySection title="Accesorios Móvil" categoryFilter="accesorios" limit={4} />
        <CategorySection title="Home & Lifestyle" categoryFilter="home" limit={4} />
        <CategorySection title="Ropa & Calzado" categoryFilter="ropa" limit={4} />
        <Sponsors />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
